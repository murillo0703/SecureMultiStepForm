# Murillo Insurance Enrollment System

## Overview
This project is a web-based insurance enrollment application for Murillo Insurance Agency. It enables employers to complete the insurance enrollment process, including company information, ownership details, employee data, document uploads, plan selection, and contribution setup. The application also includes an admin dashboard for managing applications.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application follows a modern full-stack architecture with:

1. **Frontend**: React-based SPA (Single Page Application) with TypeScript
2. **Backend**: Express.js server using TypeScript
3. **Database**: PostgreSQL with Drizzle ORM for database management
4. **Authentication**: Session-based authentication with Passport.js
5. **UI Framework**: Custom UI using shadcn/ui components with Tailwind CSS

The system uses a modular architecture with clear separation between the client and server code. The shared directory contains schema definitions that are used by both frontend and backend.

### Key Design Decisions

1. **TypeScript Throughout**: The application uses TypeScript on both frontend and backend to ensure type safety and better development experience.

2. **Database Schema Sharing**: The schema is defined in a shared folder, allowing both frontend and backend to use the same types and validation logic.

3. **React Query for Data Fetching**: The frontend uses React Query for efficient data fetching, caching, and state management.

4. **Authentication Flow**: Uses session-based authentication with Passport.js for secure user management.

5. **Progressive Form Flow**: The enrollment process is broken down into a multi-step flow with validation at each step.

6. **File Upload System**: Custom document upload system for insurance-related documentation.

7. **PDF Generation**: Includes utilities for generating carrier-specific PDF forms.

## Key Components

### Backend Components

1. **Express Server**: Main server entry point (`server/index.ts`)
2. **Authentication Module**: Handles user auth (`server/auth.ts`)
3. **Storage Layer**: Abstracts database operations (`server/storage.ts`)
4. **Routes**: API endpoints (`server/routes.ts`)
5. **Vite Integration**: Serves the SPA in development (`server/vite.ts`)

### Frontend Components

1. **Pages**:
   - Authentication (`auth-page.tsx`)
   - Home Dashboard (`home-page.tsx`)
   - Enrollment Flow (company-info, ownership-info, employee-info, etc.)
   - Admin Dashboard (`admin/dashboard.tsx`)

2. **Components**:
   - UI Components (built on shadcn/ui)
   - Layout components (header, progress bar)
   - Form components (specialized for the enrollment process)

3. **Hooks**:
   - `useAuth`: Authentication state and methods
   - `useToast`: Notification system
   - `useMultistepForm`: Handles multi-step form flows
   - `useMobile`: Responsive design helper

### Database Schema

The database schema includes tables for:

1. **users**: Authentication and basic user information
2. **companies**: Employer company details
3. **owners**: Company ownership information
4. **employees**: Employee records
5. **documents**: Uploaded documents
6. **plans**: Available insurance plans
7. **companyPlans**: Plans selected by companies
8. **contributions**: Employer contribution settings
9. **applications**: Overall application status tracking

## Data Flow

1. **User Authentication**:
   - User registers or logs in through the auth page
   - Session is established and maintained via cookies

2. **Enrollment Process**:
   - User progresses through a multi-step form flow
   - Data is validated both client and server-side
   - Progress is saved automatically between steps

3. **Document Management**:
   - Users upload required documents
   - Files are stored on the server filesystem
   - Document metadata is stored in the database

4. **Plan Selection**:
   - Available plans are fetched from the database
   - Users select and customize their plan options
   - Contribution amounts are configured

5. **Review & Submission**:
   - All data is consolidated for review
   - PDF forms are generated for selected carriers
   - Application is submitted for processing

## External Dependencies

### Frontend Dependencies
- React for UI rendering
- React Query for data fetching
- React Hook Form with Zod for form validation
- Lucide React for icons
- Tailwind CSS for styling
- Radix UI components via shadcn/ui

### Backend Dependencies
- Express.js for API server
- Drizzle ORM for database access
- Passport.js for authentication
- Multer for file uploads
- Session management with express-session

## Deployment Strategy

The application is configured for deployment on Replit with:

1. **Build Process**:
   - Frontend: Vite builds the React application
   - Backend: esbuild bundles the server code

2. **Database**:
   - Uses PostgreSQL (via Replit's PostgreSQL module)
   - Database migrations handled by Drizzle

3. **Static Assets**:
   - Built frontend assets are served by the Express server

4. **Files & Uploads**:
   - Documents are stored in the `uploads` directory
   - The system ensures this directory exists at startup

5. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `SESSION_SECRET`: For secure session management
   - `NODE_ENV`: To determine development/production mode

## Development Workflow

1. **Development Mode**:
   - Run `npm run dev` to start the development server
   - Frontend uses Vite's HMR for quick updates
   - Backend runs with tsx for TypeScript execution

2. **Database Management**:
   - `npm run db:push` to update the database schema
   - Schema is defined in `shared/schema.ts`

3. **Build & Production**:
   - `npm run build` creates production bundles
   - `npm run start` runs the production server