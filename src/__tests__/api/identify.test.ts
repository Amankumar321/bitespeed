import request from 'supertest';
import express from 'express';
import { identifyRouter } from '../../routes/identify';
import { createPrimaryContact } from '../helpers/contact.helper';

const app = express();
app.use(express.json());
app.use('/identify', identifyRouter);

describe('POST /identify', () => {
  it('should return 400 when no email or phone provided', async () => {
    const response = await request(app)
      .post('/identify')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/identify')
      .send({
        email: 'invalid-email'
      });

    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe('Invalid email format');
  });

  it('should create new contact successfully', async () => {
    const response = await request(app)
      .post('/identify')
      .send({
        email: 'test@example.com',
        phoneNumber: '1234567890'
      });

    expect(response.status).toBe(200);
    expect(response.body.contact).toBeDefined();
    expect(response.body.contact.emails).toContain('test@example.com');
    expect(response.body.contact.phoneNumbers).toContain('1234567890');
  });

  it('should link to existing contact successfully', async () => {
    // Create initial contact
    const existing = await createPrimaryContact({
      email: 'existing@example.com',
      phoneNumber: '1234567890'
    });

    const response = await request(app)
      .post('/identify')
      .send({
        email: 'existing@example.com',
        phoneNumber: '9876543210'
      });

    expect(response.status).toBe(200);
    expect(response.body.contact.primaryContatctId).toBe(existing.id);
    expect(response.body.contact.phoneNumbers).toContain('1234567890');
    expect(response.body.contact.phoneNumbers).toContain('9876543210');
  });

  it('should handle server errors gracefully', async () => {
    // Force an error by sending invalid data type
    const response = await request(app)
      .post('/identify')
      .send({
        email: 'test@example.com',
        phoneNumber: {} // Invalid type to trigger error
      });

    expect(response.status).toBe(400);
  });

  it('should handle null values correctly', async () => {
    // First create a contact with both email and phone
    const response1 = await request(app)
      .post('/identify')
      .send({
        email: 'test@example.com',
        phoneNumber: '1234567890'
      });

    expect(response1.status).toBe(200);

    // Then try to identify with one null value
    const response2 = await request(app)
      .post('/identify')
      .send({
        email: 'test@example.com',
        phoneNumber: null
      });

    expect(response2.status).toBe(200);
    expect(response2.body.contact.primaryContatctId).toBe(response1.body.contact.primaryContatctId);
    expect(response2.body.contact.phoneNumbers).toContain('1234567890');

    // Try with both values provided but one is null
    const response3 = await request(app)
      .post('/identify')
      .send({
        email: null,
        phoneNumber: '1234567890'
      });

    expect(response3.status).toBe(200);
    expect(response3.body.contact.primaryContatctId).toBe(response1.body.contact.primaryContatctId);
    expect(response3.body.contact.emails).toContain('test@example.com');
  });
}); 