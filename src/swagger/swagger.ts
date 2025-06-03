import { OpenAPIV3 } from 'openapi-types';

const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Customer Identity Service API',
    version: '1.0.0',
    description: 'API for linking and managing customer contact information across multiple purchases',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    }
  ],
  tags: [
    {
      name: 'Identity',
      description: 'Customer identity management endpoints'
    }
  ],
  paths: {
    '/identify': {
      post: {
        tags: ['Identity'],
        summary: 'Identify and link customer contacts',
        description: 'Identifies a customer based on email and phone number, linking related contact information',
        operationId: 'identifyContact',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ContactIdentificationRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Contact information successfully consolidated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ContactResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid request parameters',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          msg: { type: 'string' },
                          param: { type: 'string' },
                          location: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ContactIdentificationRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
            description: 'Customer email address. Can be null if not provided.',
            nullable: true
          },
          phoneNumber: {
            type: 'string',
            example: '1234567890',
            description: 'Customer phone number. Can be null if not provided.',
            nullable: true
          }
        },
        anyOf: [
          { required: ['email'] },
          { required: ['phoneNumber'] }
        ],
        description: 'At least one of email or phoneNumber must be provided, both can be null'
      },
      ContactResponse: {
        type: 'object',
        required: ['primaryContatctId', 'emails', 'phoneNumbers', 'secondaryContactIds'],
        properties: {
          primaryContatctId: {
            type: 'integer',
            example: 1,
            description: 'ID of the primary contact'
          },
          emails: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email'
            },
            example: ['primary@example.com', 'secondary@example.com'],
            description: 'List of all email addresses associated with the contact'
          },
          phoneNumbers: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['1234567890', '0987654321'],
            description: 'List of all phone numbers associated with the contact'
          },
          secondaryContactIds: {
            type: 'array',
            items: {
              type: 'integer'
            },
            example: [2, 3],
            description: 'IDs of secondary contacts linked to the primary contact'
          }
        }
      }
    }
  }
};

export default swaggerDocument; 