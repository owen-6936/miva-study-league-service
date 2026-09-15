# Miva Study League Service

A backend service for the Miva Study League application, built with Express.js, TypeScript, and MongoDB. It provides comprehensive APIs for managing users, authentication, teams, missions, activities, and seasonal leaderboards.

## Features

- **Authentication & Authorization:** Secure user registration, login, token refresh, and email verification using JSON Web Tokens (JWT) and cookies.
- **User Management:** Profile and statistics management.
- **Team Management & Captains:** Create, update, and manage team members and team scores. Admins can seamlessly promote or demote specific students as "Team Captains" to lead their cohorts.
- **Missions & Quizzes:** APIs to handle daily/weekly tasks, including text responses, URL submissions, and automated quizzes.
- **Admin Dashboard:** System-wide statistics and week-over-week trends for monitoring user growth and engagement.
- **Admin Grading & Submissions:** Dedicated queue for admins to review, accept/reject, and grade manual task submissions, including feedback hints for students. Automatically filters out system-graded tasks.
- **Admin Student Progress Portal:** Fine-grained API endpoints (`/api/v1/admin/users/:id/progress`) enabling admins to view complete task histories, retroactively edit grades, and globally wipe or sync tokens across entire cohorts.
- **Auto-Validated Quizzes:** Quizzes and multiple-choice tasks are instantly auto-graded upon submission and seamlessly bypassed from the manual review queue.
- **Team Transfer Ecosystem:** Admins can grant transfer tokens, allowing students to seamlessly switch teams under strict capacity checks.
- **Gamification & Analytics:** Includes mathematical First Blood speedrunner bonuses, chronological XP Growth Trajectory analytics for student profiles (`/me/analytics`), and a mathematically flawless Hall of Fame podium (`/awards/hall-of-fame`) dynamically powered by real-time team aggregation.
- **Activity & Auditing:** Comprehensive, metadata-rich logging system to track student achievements, task updates, and critical admin actions across the platform.
- **Announcements Management:** Create, view, and delete system-wide broadcast announcements.
- **Timetable Management:** Create, view, update, and delete class/study schedules.
- **Leaderboards & Seasons:** Track team and individual progress across structured seasons.
- **Email Services:** Integrated with Resend for transactional emails (e.g., email verification).

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

The project includes thorough, inline JSDoc comments describing the business logic, parameters, and utilities directly in the source code.

## License

This project is licensed under the [Apache License 2.0](LICENSE).

