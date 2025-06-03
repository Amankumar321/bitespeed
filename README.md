# Customer Identity Linking Service

A service that links customer contact information across multiple purchases, even when customers use different email addresses or phone numbers.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a PostgreSQL database named `customer_identity_db`

4. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=customer_identity_db
   ```
   Adjust the values according to your PostgreSQL configuration.

5. Run database migrations:
   ```bash
   npm run migration:run
   ```

## Database Migrations

The project uses TypeORM for database migrations. Here are the available migration commands:

- Create a new migration:
  ```bash
  npm run migration:create -- src/database/migrations/MigrationName
  ```

- Generate a migration from entity changes:
  ```bash
  npm run migration:generate -- src/database/migrations/MigrationName
  ```

- Run pending migrations:
  ```bash
  npm run migration:run
  ```

- Revert the last migration:
  ```bash
  npm run migration:revert
  ```

- Show migration status:
  ```bash
  npm run migration:show
  ```

## Development

To run the service in development mode with hot reloading:
```bash
npm run dev
```

## Build and Run

To build the TypeScript code:
```bash
npm run build
```

To run the built code:
```bash
npm start
```

## API Documentation

### POST /identify

Identifies and links customer contact information.

**Request Body:**
```json
{
  "email": "string",      // optional
  "phoneNumber": "string" // optional
}
```
At least one of email or phoneNumber must be provided.

**Response (200 OK):**
```json
{
  "contact": {
    "primaryContatctId": number,
    "emails": string[],
    "phoneNumbers": string[],
    "secondaryContactIds": number[]
  }
}
```

## Testing

To run tests:
```bash
npm test
``` 