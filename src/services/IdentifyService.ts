import { ContactService } from './ContactService';
import { ContactIdentification, ContactResponse } from '../types/contact';
import { Contact } from '../entity/Contact';

/**
 * Service responsible for identifying and linking customer contacts.
 * Handles the business logic for consolidating customer information across multiple records.
 */
export class IdentifyService {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  /**
   * Identifies a customer based on provided email and/or phone number.
   * Links related contact information and maintains a primary-secondary relationship.
   * 
   * @param request - The contact identification request containing email and/or phone number
   * @returns A consolidated response containing all linked contact information
   * @throws Error if no primary contact is found in linked contacts
   */
  async identify(request: ContactIdentification): Promise<ContactResponse> {
    // Find any existing contacts with the provided email or phone
    const existingContacts = await this.contactService.findByEmailOrPhone(
      request.email,
      request.phoneNumber
    );

    // If no contacts exist, create a new primary contact
    if (existingContacts.length === 0) {
      const newContact = await this.contactService.createContact(request);
      return this.contactService.consolidateContactResponse([newContact]);
    }

    // Sort contacts by creation date (oldest first)
    const sortedContacts = existingContacts.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Get all linked contacts for each contact found
    const allLinkedContactsArrays = await Promise.all(
      sortedContacts.map(contact => this.contactService.findLinkedContacts(contact.id))
    );

    // Flatten and deduplicate contacts by ID
    const uniqueContacts = new Map<number, Contact>();
    allLinkedContactsArrays.flat().forEach(contact => {
      uniqueContacts.set(contact.id, contact);
    });

    // Convert back to array and sort by creation date
    let allLinkedContacts = Array.from(uniqueContacts.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Find the oldest primary contact
    const oldestPrimary = allLinkedContacts.find(c => c.linkPrecedence === 'primary');
    if (!oldestPrimary) {
      throw new Error('No primary contact found in linked contacts');
    }

    // Convert any other primary contacts to secondary
    const primaryContactsToUpdate = allLinkedContacts.filter(
      c => c.linkPrecedence === 'primary' && c.id !== oldestPrimary.id
    );

    if (primaryContactsToUpdate.length > 0) {
      // Update the contacts to be secondary
      await Promise.all(
        primaryContactsToUpdate.map(contact =>
          this.contactService.updateContact(contact.id, {
            linkPrecedence: 'secondary',
            linkedId: oldestPrimary.id
          })
        )
      );

      // Refresh the contacts list after updates
      allLinkedContacts = await this.contactService.findLinkedContacts(oldestPrimary.id);
    }

    // Check if we need to create a new secondary contact
    const needsNewContact = this.shouldCreateNewContact(request, allLinkedContacts);
    
    if (needsNewContact) {
      const newSecondaryContact = await this.contactService.createContact(
        request,
        'secondary',
        oldestPrimary.id
      );
      allLinkedContacts.push(newSecondaryContact);
    }

    return this.contactService.consolidateContactResponse(allLinkedContacts);
  }

  /**
   * Determines if a new contact should be created based on the request and existing contacts.
   * 
   * @param request - The contact identification request
   * @param existingContacts - Array of existing contacts to check against
   * @returns boolean indicating whether a new contact should be created
   * @private
   */
  private shouldCreateNewContact(
    request: ContactIdentification,
    existingContacts: Array<{ email: string | null; phoneNumber: string | null }>
  ): boolean {
    // If either email or phone is new, we should create a new contact
    const hasNewEmail = request.email !== undefined && !existingContacts.some(c => c.email === request.email);
    const hasNewPhone = request.phoneNumber !== undefined && !existingContacts.some(c => c.phoneNumber === request.phoneNumber);

    return Boolean(hasNewEmail || hasNewPhone);
  }
} 