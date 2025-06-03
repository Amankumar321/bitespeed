import { IdentifyService } from '../services/IdentifyService';
import { ContactIdentification, ContactResponse } from '../types/contact';

export async function identifyContact(request: ContactIdentification): Promise<ContactResponse> {
  const identifyService = new IdentifyService();
  return identifyService.identify(request);
} 