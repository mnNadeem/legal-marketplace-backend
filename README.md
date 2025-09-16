# Legal Marketplace Backend

A NestJS-based backend API for a legal marketplace platform where clients can post cases and lawyers can submit quotes.

## Features

- **User Authentication**: JWT-based authentication for clients and lawyers
- **Role-Based Access Control**: Different permissions for clients and lawyers
- **Case Management**: Create, view, and manage legal cases
- **Quote System**: Lawyers can submit quotes for cases
- **File Upload**: Secure file upload for case documents
- **Payment Integration**: Stripe integration for payments
- **API Documentation**: Swagger/OpenAPI documentation
- **Database**: PostgreSQL with TypeORM
- **Security**: Input validation, rate limiting, and secure file handling

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Payment**: Stripe
- **File Upload**: Multer
- **Testing**: Jest

## Database Schema (ERD)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Users      │    │      Cases      │    │     Quotes      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (UUID)       │    │ id (UUID)       │    │ id (UUID)       │
│ email (unique)  │◄───┤ clientId        │◄───┤ caseId          │
│ password        │    │ title           │    │ lawyerId        │
│ name            │    │ category        │    │ amount          │
│ role            │    │ description     │    │ expectedDays    │
│ jurisdiction    │    │ status          │    │ note            │
│ barNumber       │    │ createdAt       │    │ status          │
│ createdAt       │    │ updatedAt       │    │ createdAt       │
│ updatedAt       │    └─────────────────┤    │ updatedAt       │
└─────────────────┘                     │    └─────────────────┘
                                        │
                                        │    ┌─────────────────┐
                                        │    │   Case Files    │
                                        │    ├─────────────────┤
                                        └────┤ caseId          │
                                             │ originalName    │
                                             │ filename        │
                                             │ mimetype        │
                                             │ size            │
                                             │ path            │
                                             │ createdAt       │
                                             └─────────────────┘

┌─────────────────┐
│    Payments     │
├─────────────────┤
│ id (UUID)       │
│ clientId        │
│ lawyerId        │
│ caseId          │
│ quoteId         │
│ amount          │
│ stripePaymentId │
│ status          │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with:
   - Database credentials
   - JWT secret
   - Stripe keys
   - Other configuration

5. Set up PostgreSQL database and run migrations

6. Seed the database with example data:
   ```bash
   npm run seed
   ```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, visit:
- **API Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000

## Example Accounts

After running the seed command, you can use these test accounts:

- **Client**: `client1@example.com` / `Passw0rd!`
- **Lawyer**: `lawyer1@example.com` / `Passw0rd!`

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user

### Cases (Client)
- `POST /cases` - Create new case
- `GET /cases` - Get my cases
- `GET /cases/:id` - Get case details
- `PATCH /cases/:id` - Update case
- `POST /cases/:id/files` - Upload files
- `POST /cases/:id/accept-quote` - Accept a quote

### Cases (Lawyer - Marketplace)
- `GET /cases` - Browse open cases (anonymized)
- `GET /cases/:id` - View case details (anonymized unless accepted)

### Quotes (Lawyer)
- `POST /quotes/cases/:caseId` - Submit quote
- `GET /quotes` - Get my quotes
- `GET /quotes/:id` - Get quote details
- `PATCH /quotes/:id` - Update quote
- `DELETE /quotes/:id` - Delete quote

### Quotes (Client)
- `GET /quotes/cases/:caseId` - Get quotes for my case

### Payments
- `POST /payments/create-intent/:quoteId` - Create payment intent
- `POST /payments/confirm/:paymentIntentId` - Confirm payment
- `GET /payments/:paymentId/status` - Get payment status

### Files
- `GET /files/secure/:fileId` - Download file securely

## Security Features

1. **Authentication**: JWT-based authentication
2. **Authorization**: Role-based access control
3. **Input Validation**: Comprehensive validation using class-validator
4. **Rate Limiting**: Protection against abuse
5. **File Security**: Secure file upload and download
6. **SQL Injection Protection**: TypeORM query builder
7. **CORS**: Configured for frontend integration

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

The application is ready for deployment on platforms like:
- Heroku
- AWS
- DigitalOcean
- Vercel (with external database)

Make sure to:
1. Set up production database
2. Configure environment variables
3. Set up external file storage (S3, etc.)
4. Configure Stripe webhooks
5. Set up SSL/HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.