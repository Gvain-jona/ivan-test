# Ivan Prints Business Management System

A comprehensive business management system for Ivan Prints, designed to manage orders, expenses, material purchases, tasks, and analytics.

## Features

- **Authentication**: Secure email and PIN-based authentication
- **Orders Management**: Create, track, and manage orders with invoicing
- **Expenses Tracking**: Record and monitor business expenses
- **Material Purchases**: Track purchases of materials with installment tracking
- **Task Management**: Organize tasks related to orders, expenses, and purchases
- **Analytics**: Monitor business performance with detailed reports
- **Role-Based Access**: Admin, Manager, and Employee access levels
- **Dark Theme UI**: Modern, clean interface with dark theme

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS, Shadcn UI components
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ivan-prints.git
   cd ivan-prints
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase URL and anonymous key

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Setting up Supabase

1. Create a new Supabase project
2. Use the Supabase initialization functions in `app/lib/supabase/init.ts` to set up your database schema
3. Set up authentication providers in the Supabase dashboard
4. Update your environment variables with the Supabase project URL and keys

## Project Structure

- `/app` - Next.js application code
  - `/(auth)` - Authentication routes and components
  - `/(dashboard)` - Dashboard routes and components
  - `/api` - API endpoints
  - `/components` - Reusable UI components
  - `/hooks` - Custom React hooks
  - `/lib` - Utility libraries and functions
  - `/modules` - Feature-specific modules
  - `/styles` - Global styles
  - `/types` - TypeScript type definitions
  - `/utils` - Utility functions

## Development

### Coding Standards

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Follow the React hooks pattern
- Use the component/container pattern for UI components
- Follow the naming convention for files and folders

### Git Workflow

- Use descriptive commit messages
- Create feature branches from `main`
- Submit pull requests for review

## License

This project is proprietary and not open for public use without permission.

## Contributors

- [Your Name](https://github.com/yourusername)

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/) 