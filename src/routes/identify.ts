import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { identifyContact } from '../controllers/identifyController';

export const identifyRouter = Router();

/**
 * Validation middleware for the identify endpoint.
 * Ensures that:
 * 1. At least one of email or phoneNumber is provided
 * 2. Email, if provided, is in valid format
 * 3. Phone number, if provided, is a string
 * Both fields can be null, but not undefined
 */
const validateIdentifyRequest = [
  body('email')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Email must be a string or null')
    .isEmail()
    .withMessage('Invalid email format')
    .optional({ values: 'null' }),
  body('phoneNumber')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Phone number must be a string or null')
    .optional({ values: 'null' }),
  body()
    .custom((body) => {
      if (body.email === undefined && body.phoneNumber === undefined) {
        throw new Error('At least one of email or phoneNumber must be provided');
      }
      return true;
    })
];

/**
 * POST /identify
 * Identifies and links customer contact information.
 * 
 * @route POST /identify
 * @param {Object} req.body - Contact identification request
 * @param {string} [req.body.email] - Customer email address (optional if phone provided)
 * @param {string} [req.body.phoneNumber] - Customer phone number (optional if email provided)
 * @returns {Object} Consolidated contact information
 * @throws {400} If validation fails
 * @throws {500} If server error occurs
 */
identifyRouter.post('/', validateIdentifyRequest, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await identifyContact(req.body);
    return res.json({ contact: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
}); 