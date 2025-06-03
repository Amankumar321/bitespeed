import { Contact } from '../../entity/Contact';
import { testDataSource } from '../setup';

export const createContact = async (data: Partial<Contact>): Promise<Contact> => {
  const contactRepository = testDataSource.getRepository(Contact);
  const contact = contactRepository.create({
    phoneNumber: null,
    email: null,
    linkedId: null,
    linkPrecedence: 'primary',
    ...data
  });
  return contactRepository.save(contact);
};

export const createPrimaryContact = async (data: Partial<Contact>): Promise<Contact> => {
  return createContact({ ...data, linkPrecedence: 'primary' });
};

export const createSecondaryContact = async (data: Partial<Contact>): Promise<Contact> => {
  return createContact({ ...data, linkPrecedence: 'secondary' });
};

export const findContactById = async (id: number): Promise<Contact | null> => {
  const contactRepository = testDataSource.getRepository(Contact);
  return contactRepository.findOneBy({ id });
}; 