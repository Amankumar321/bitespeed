import { ContactService } from '../../services/ContactService';
import { createPrimaryContact, createSecondaryContact } from '../helpers/contact.helper';
import { Contact } from '../../entity/Contact';

describe('ContactService', () => {
  let contactService: ContactService;

  beforeEach(() => {
    contactService = new ContactService();
  });

  describe('findByEmailOrPhone', () => {
    it('should find contact by email', async () => {
      const contact = await createPrimaryContact({
        email: 'test@example.com'
      });

      const result = await contactService.findByEmailOrPhone('test@example.com');
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
    });

    it('should find contact by phone', async () => {
      const contact = await createPrimaryContact({
        phoneNumber: '1234567890'
      });

      const result = await contactService.findByEmailOrPhone(undefined, '1234567890');
      expect(result).toHaveLength(1);
      expect(result[0].phoneNumber).toBe('1234567890');
    });

    it('should find multiple contacts with same email or phone', async () => {
      const primary = await createPrimaryContact({
        email: 'test@example.com',
        phoneNumber: '1234567890'
      });

      const secondary = await createSecondaryContact({
        email: 'test@example.com',
        linkedId: primary.id
      });

      const result = await contactService.findByEmailOrPhone('test@example.com');
      expect(result).toHaveLength(2);
    });
  });

  describe('findLinkedContacts', () => {
    it('should find all linked contacts for primary contact', async () => {
      const primary = await createPrimaryContact({
        email: 'primary@example.com'
      });

      const secondary1 = await createSecondaryContact({
        email: 'secondary1@example.com',
        linkedId: primary.id
      });

      const secondary2 = await createSecondaryContact({
        email: 'secondary2@example.com',
        linkedId: primary.id
      });

      const result = await contactService.findLinkedContacts(primary.id);
      expect(result).toHaveLength(3);
      expect(result.map(c => c.email)).toContain('primary@example.com');
      expect(result.map(c => c.email)).toContain('secondary1@example.com');
      expect(result.map(c => c.email)).toContain('secondary2@example.com');
    });

    it('should return empty array for non-existent contact', async () => {
      const result = await contactService.findLinkedContacts(999);
      expect(result).toHaveLength(0);
    });
  });

  describe('consolidateContactResponse', () => {
    it('should create proper response format', async () => {
      const primary = await createPrimaryContact({
        email: 'primary@example.com',
        phoneNumber: '1234567890'
      });

      const secondary = await createSecondaryContact({
        email: 'secondary@example.com',
        phoneNumber: '0987654321',
        linkedId: primary.id
      });

      const response = await contactService.consolidateContactResponse([primary, secondary]);

      expect(response).toEqual({
        primaryContatctId: primary.id,
        emails: ['primary@example.com', 'secondary@example.com'],
        phoneNumbers: ['1234567890', '0987654321'],
        secondaryContactIds: [secondary.id]
      });
    });

    it('should throw error when no contacts provided', async () => {
      await expect(contactService.consolidateContactResponse([])).rejects.toThrow('No contacts found');
    });

    it('should throw error when no primary contact found', async () => {
      const secondary = await createSecondaryContact({
        email: 'secondary@example.com'
      });

      await expect(contactService.consolidateContactResponse([secondary])).rejects.toThrow('No primary contact found');
    });
  });
}); 