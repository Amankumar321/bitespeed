import { IdentifyService } from '../../services/IdentifyService';
import { createPrimaryContact, createSecondaryContact, findContactById } from '../helpers/contact.helper';

describe('IdentifyService Integration', () => {
  let identifyService: IdentifyService;

  beforeEach(() => {
    identifyService = new IdentifyService();
  });

  describe('identify', () => {
    it('should create new primary contact when no matches found', async () => {
      const result = await identifyService.identify({
        email: 'new@example.com',
        phoneNumber: '1234567890'
      });

      expect(result.emails).toEqual(['new@example.com']);
      expect(result.phoneNumbers).toEqual(['1234567890']);
      expect(result.secondaryContactIds).toEqual([]);

      const savedContact = await findContactById(result.primaryContatctId);
      expect(savedContact).toBeTruthy();
      expect(savedContact?.linkPrecedence).toBe('primary');
    });

    it('should create secondary contact when new info links to existing contact', async () => {
      // Create initial primary contact
      const primary = await createPrimaryContact({
        email: 'primary@example.com',
        phoneNumber: '1234567890'
      });

      // Identify with same email but different phone
      const result = await identifyService.identify({
        email: 'primary@example.com',
        phoneNumber: '0987654321'
      });

      expect(result.primaryContatctId).toBe(primary.id);
      expect(result.emails).toEqual(['primary@example.com']);
      expect(result.phoneNumbers).toContain('1234567890');
      expect(result.phoneNumbers).toContain('0987654321');
      expect(result.secondaryContactIds).toHaveLength(1);

      // Verify secondary contact was created
      const secondary = await findContactById(result.secondaryContactIds[0]);
      expect(secondary?.linkPrecedence).toBe('secondary');
      expect(secondary?.linkedId).toBe(primary.id);
    });

    it('should handle multiple existing contacts', async () => {
      // Create two contacts with shared info
      const primary1 = await createPrimaryContact({
        email: 'shared@example.com',
        phoneNumber: '1111111111'
      });

      const primary2 = await createPrimaryContact({
        email: 'unique@example.com',
        phoneNumber: '2222222222'
      });

      // Link them together with new contact info
      const result = await identifyService.identify({
        email: 'shared@example.com',
        phoneNumber: '2222222222'
      });

      expect(result.emails).toContain('shared@example.com');
      expect(result.emails).toContain('unique@example.com');
      expect(result.phoneNumbers).toContain('1111111111');
      expect(result.phoneNumbers).toContain('2222222222');

      // Verify the contacts are properly linked
      const allContacts = await Promise.all(
        [result.primaryContatctId, ...result.secondaryContactIds].map(findContactById)
      );

      const primary = allContacts.find(c => c?.linkPrecedence === 'primary');
      expect(primary).toBeTruthy();
      expect(allContacts.filter(c => c?.linkPrecedence === 'secondary')).toHaveLength(1);
    });

    it('should maintain order with primary contact info first', async () => {
      const primary = await createPrimaryContact({
        email: 'primary@example.com',
        phoneNumber: '1111111111'
      });

      await createSecondaryContact({
        email: 'secondary@example.com',
        phoneNumber: '2222222222',
        linkedId: primary.id
      });

      const result = await identifyService.identify({
        email: 'secondary@example.com',
        phoneNumber: '3333333333'
      });

      expect(result.emails[0]).toBe('primary@example.com');
      expect(result.phoneNumbers[0]).toBe('1111111111');
    });
  });
}); 