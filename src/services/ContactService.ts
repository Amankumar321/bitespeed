import { Repository } from 'typeorm';
import { Contact, LinkPrecedence } from '../entity/Contact';
import { AppDataSource } from '../database/data-source';
import { ContactIdentification, ContactResponse } from '../types/contact';

/**
 * Service responsible for managing contact entities in the database.
 * Handles CRUD operations and contact information consolidation.
 */
export class ContactService {
  private contactRepository: Repository<Contact>;

  constructor() {
    // The AppDataSource will be replaced with testDataSource in test environment
    this.contactRepository = AppDataSource.getRepository(Contact);
  }

  /**
   * Finds contacts by email or phone number.
   * 
   * @param email - Optional email to search for
   * @param phoneNumber - Optional phone number to search for
   * @returns Array of contacts matching either email or phone number
   */
  async findByEmailOrPhone(email?: string | null, phoneNumber?: string | null): Promise<Contact[]> {
    return this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.email = :email OR contact.phoneNumber = :phoneNumber', {
        email: email || null,
        phoneNumber: phoneNumber || null,
      })
      .getMany();
  }

  /**
   * Finds all contacts linked to a given contact ID.
   * This includes both primary and secondary contacts in the link chain.
   * 
   * @param contactId - ID of the contact to find links for
   * @returns Array of linked contacts
   */
  async findLinkedContacts(contactId: number): Promise<Contact[]> {
    const primaryContact = await this.contactRepository.findOne({
      where: { id: contactId }
    });

    if (!primaryContact) {
      return [];
    }

    // If this is a secondary contact, get its primary contact ID
    const primaryId = primaryContact.linkPrecedence === 'secondary' 
      ? primaryContact.linkedId 
      : primaryContact.id;

    // Get all contacts in the link chain
    return this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.id = :primaryId', { primaryId })
      .orWhere('contact.linkedId = :primaryId', { primaryId })
      .orderBy('contact.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Creates a new contact with the provided information.
   * 
   * @param data - Contact information to create
   * @param linkPrecedence - Whether this is a primary or secondary contact
   * @param linkedId - ID of the primary contact if this is a secondary contact
   * @returns The created contact
   */
  async createContact(
    data: ContactIdentification, 
    linkPrecedence: LinkPrecedence = 'primary',
    linkedId?: number
  ): Promise<Contact> {
    const contact = this.contactRepository.create({
      email: data.email,
      phoneNumber: data.phoneNumber,
      linkPrecedence,
      linkedId
    });
    return this.contactRepository.save(contact);
  }

  /**
   * Consolidates multiple contacts into a single response.
   * Ensures primary contact information appears first in the response.
   * 
   * @param contacts - Array of contacts to consolidate
   * @returns Consolidated contact information
   * @throws Error if no contacts provided or no primary contact found
   */
  async consolidateContactResponse(contacts: Contact[]): Promise<ContactResponse> {
    if (!contacts.length) {
      throw new Error('No contacts found');
    }

    // Find the primary contact
    const primaryContact = contacts.find(c => c.linkPrecedence === 'primary');
    if (!primaryContact) {
      throw new Error('No primary contact found');
    }

    // Collect unique emails and phone numbers
    const emails = Array.from(new Set(
      contacts
        .map(c => c.email)
        .filter((email): email is string => email !== null)
    ));

    const phoneNumbers = Array.from(new Set(
      contacts
        .map(c => c.phoneNumber)
        .filter((phone): phone is string => phone !== null)
    ));

    // Get secondary contact IDs
    const secondaryContactIds = contacts
      .filter(c => c.linkPrecedence === 'secondary')
      .map(c => c.id);

    // Ensure primary contact's email/phone are first in the arrays
    if (primaryContact.email && emails.includes(primaryContact.email)) {
      emails.splice(emails.indexOf(primaryContact.email), 1);
      emails.unshift(primaryContact.email);
    }
    if (primaryContact.phoneNumber && phoneNumbers.includes(primaryContact.phoneNumber)) {
      phoneNumbers.splice(phoneNumbers.indexOf(primaryContact.phoneNumber), 1);
      phoneNumbers.unshift(primaryContact.phoneNumber);
    }

    return {
      primaryContatctId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds
    };
  }

  /**
   * Updates an existing contact with new information.
   * 
   * @param id - ID of the contact to update
   * @param data - New contact information
   * @returns The updated contact
   * @throws Error if contact is not found
   */
  async updateContact(id: number, data: Partial<Contact>): Promise<Contact> {
    await this.contactRepository.update(id, data);
    return this.contactRepository.findOneByOrFail({ id });
  }
} 