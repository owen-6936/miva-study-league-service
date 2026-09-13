# Miva Study League Service

A backend service for the Miva Study League application, built with Express.js, TypeScript, and MongoDB. It provides comprehensive APIs for managing users, authentication, teams, missions, activities, and seasonal leaderboards.

## Features

- **Authentication & Authorization:** Secure user registration, login, token refresh, and email verification using JSON Web Tokens (JWT) and cookies.
- **User Management:** Profile and statistics management.
- **Team Management:** Create, update, and manage team members and team scores.
- **Missions & Activities:** APIs to handle daily/weekly tasks and log user activities.
- **Leaderboards & Seasons:** Track team and individual progress across structured seasons.
- **Email Services:** Integrated with Resend for transactional emails (e.g., email verification).
- **Comprehensive API Documentation:** Automatically generated HTML documentation for all source modules using TypeDoc.

## Tech Stack

- **Framework:** [Express.js](https://expressjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Security:** `bcryptjs`, `jsonwebtoken`
- **Development Tools:** `nodemon`, `eslint`, `typedoc`

## Project Structure

```
├── app.ts                  # Application entry point and Express setup
├── controllers/            # Route handlers and business logic
├── routers/                # Express route definitions
├── schemas/                # Mongoose database models
├── middlewares/            # Custom Express middlewares (e.g., authentication)
├── services/               # External service integrations (DB, Mail)
├── seed/                   # Database seeding scripts
├── docs/                   # Auto-generated TypeDoc HTML documentation
└── utils.ts                # Shared utility functions
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)
- A running instance of MongoDB
- Appropriate environment variables configured

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Create a `.env` file in the root directory and add your environment variables:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# Add other required environment variables (e.g., for Resend)
```

### Running the Application

**Development Mode (with live reload):**
```bash
pnpm run dev
```

**Production Mode:**
```bash
pnpm run start
```

## Documentation

The project includes thorough, auto-generated JSDoc documentation via TypeDoc.

To generate or update the documentation, run:
```bash
npx typedoc
```
You can view the documentation by opening `docs/index.html` in your browser.

## License

This project is licensed under the [Apache License 2.0](LICENSE).

