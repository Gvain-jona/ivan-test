# System Architecture

## Overview
The Ivan Prints Business Management System is built using a modern, serverless architecture leveraging Supabase for backend services and Next.js for the frontend. This document outlines the high-level architecture and key technical decisions.

## Architecture Diagram
```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  Next.js Frontend|     |  Supabase Edge   |     |  Supabase       |
|  (App Router)    |<--->|  Functions       |<--->|  Database       |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
         ^                       ^                        ^
         |                       |                        |
         v                       v                        v
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  Client State    |     |  Auth Service    |     |  Storage        |
|  (Zustand)      |     |  (Supabase Auth) |     |  (Supabase)     |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
```

## Key Components

### Frontend (Next.js)
- **App Router**: Leveraging Next.js 14's app router for server components and routing
- **Components**: Using shadcn/ui for consistent, accessible UI components
- **State Management**: Zustand for simple, efficient client-state management
- **Forms**: React Hook Form with Zod for type-safe form validation
- **Styling**: Tailwind CSS for utility-first styling

### Backend (Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Email verification and PIN-based auth
- **Real-time**: Subscriptions for notifications and live updates
- **Edge Functions**: For complex business logic
- **Storage**: For file uploads (e.g., company logo)

## Technical Decisions

### Why Next.js?
1. Server Components for improved performance
2. Built-in TypeScript support
3. File-based routing with App Router
4. API routes for backend functionality
5. Excellent developer experience

### Why Supabase?
1. PostgreSQL with RLS for secure data access
2. Built-in authentication system
3. Real-time capabilities
4. Edge functions for serverless compute
5. Generous free tier for development

### Why Zustand over Redux?
1. Simpler API with less boilerplate
2. Better TypeScript support
3. Smaller bundle size
4. Easy integration with React
5. Supports middleware and devtools

### Why shadcn/ui?
1. Accessible components out of the box
2. Customizable with Tailwind CSS
3. Copy-paste components (no package to install)
4. Regular updates and maintenance
5. Strong community support

## Security Considerations

### Authentication
- Email verification required for initial access
- PIN-based authentication for subsequent logins
- Session management with 2-hour timeout
- Failed login attempt tracking

### Authorization
- Role-based access control (Admin, Manager, Employee)
- Row Level Security in Supabase
- Frontend route protection
- API route protection

### Data Security
- No sensitive data in push notifications
- Encrypted PIN storage
- Secure session management
- Regular security audits

## Performance Optimization

### Frontend
- Server Components for static content
- Dynamic imports for large components
- Image optimization with Next.js Image
- Caching strategies for API calls

### Database
- Proper indexing for frequent queries
- Efficient data modeling
- Connection pooling
- Query optimization

### Real-time
- Selective subscriptions
- Debounced updates
- Optimistic UI updates

## Error Handling

### Frontend
- Toast notifications for user feedback
- Error boundaries for component errors
- Form validation feedback
- Loading states and skeletons

### Backend
- Structured error responses
- Error logging and monitoring
- Graceful degradation
- Retry mechanisms for failed operations

## Monitoring and Logging

### Application Monitoring
- Error tracking with Sentry
- Performance monitoring
- User session tracking
- Real-time alerts

### Database Monitoring
- Query performance
- Connection pooling
- Error rates
- Backup status

## Development Workflow

### Version Control
- Feature branches
- Pull request reviews
- Conventional commits
- Automated testing

### CI/CD
- GitHub Actions for CI
- Automated testing
- Preview deployments
- Production deployments

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for pre-commit hooks



## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) 