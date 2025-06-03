export interface ContactIdentification {
  email?: string | null;
  phoneNumber?: string | null;
}

export interface ContactResponse {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
} 