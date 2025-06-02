# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ivan Prints Business Management System - A comprehensive business management system built with Next.js 15, TypeScript, Supabase, and Shadcn UI. The system manages orders, expenses, material purchases, tasks, and analytics with role-based access control.

## Key Development Commands

### Core Development
```bash
npm run dev              # Development server with Turbo (recommended)
npm run dev:normal       # Development server without Turbo
npm run build           # Production build
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run clean:dev       # Clean build and restart dev server
```

### Supabase Commands
```bash
npm run supabase:seed   # Reset and seed database (for local development)
npm run env:local       # Switch to local Supabase environment
npm run env:cloud       # Switch to cloud Supabase environment
npm run dev:local       # Run development with local Supabase
npm run dev:cloud       # Run development with cloud Supabase
```

### UI Component Management
```bash
npm run ui:add <component-name>  # Add a new Shadcn UI component
```

## High-Level Architecture

### Tech Stack
- **Framework**: Next.js 15.3.0 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth with SSR cookie handling
- **UI**: Shadcn UI + Radix UI primitives + TailwindCSS
- **State**: SWR for data fetching, React Context for global state, Zustand for complex state
- **Forms**: React Hook Form + Zod validation
- **Monitoring**: Sentry for error tracking

### Project Structure
```
app/
├── api/              # RESTful API endpoints
├── (auth)/           # Auth route group (signin, verify-email, etc.)
├── (dashboard)/      # Protected dashboard routes
├── components/       # Reusable UI components
│   ├── ui/          # Base UI components (Shadcn)
│   └── [feature]/   # Feature-specific components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and core libraries
│   └── supabase/    # Supabase client configurations
├── context/         # React contexts
├── types/           # TypeScript type definitions
└── utils/           # Helper functions

supabase/
├── migrations/      # Database migrations (run automatically)
└── seed.sql        # Seed data for development
```

### Critical Development Rules

1. **File Size Limit**: Maximum 200 lines per file. Break larger files into smaller components.

2. **Component Structure**: 
   - Single responsibility per component
   - Extract complex logic to custom hooks
   - Use TypeScript interfaces for all props
   - Follow existing patterns in the codebase

3. **Supabase Authentication**:
   - Always use SSR patterns with cookie handling
   - Use `getAll`/`setAll` methods for cookies (never `get`/`set`/`remove`)
   - Middleware handles auth refresh automatically
   - Create Supabase client appropriately for context (server vs client)

4. **UI/UX Standards**:
   - Dark theme with orange accent colors (`orange-500` as primary)
   - Mobile-first responsive design
   - Use skeleton loaders for loading states
   - Follow existing component patterns in `/app/components/ui`

5. **Data Fetching**:
   - Use SWR hooks for client-side data fetching
   - Implement proper error handling
   - Cache keys defined in `/app/lib/cache-keys.ts`
   - Use optimistic updates where appropriate

6. **Form Handling**:
   - React Hook Form for all forms
   - Zod schemas for validation
   - Show inline validation errors
   - Persist form state when appropriate

7. **Documentation**:
   - Update `docs/implementation-updates.md` for new features
   - Update `docs/changelog.md` for significant changes
   - Keep `docs/implementation-checklist.md` current

### Key Patterns to Follow

**API Route Pattern**:
```typescript
// Always check authentication first
const user = await requireAuth(request)
// Validate request body with Zod
const validatedData = schema.parse(await request.json())
// Handle Supabase operations with proper error handling
```

**Component Pattern**:
```typescript
// Props interface at top
interface ComponentProps { ... }
// Main component with proper TypeScript
export function Component({ props }: ComponentProps) { ... }
// Extract complex logic to hooks
// Keep under 200 lines
```

**Hook Pattern**:
```typescript
// Use SWR for data fetching
const { data, error, isLoading, mutate } = useSWR(
  user ? ['key', params] : null,
  fetcher,
  { ...swrConfig }
)
```

**Supabase Client Creation**:
```typescript
// Server component
import { createClient } from '@/utils/supabase/server'
const supabase = await createClient()

// Client component  
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
```

### Environment Configuration

The app uses different Supabase environments:
- **Local**: Uses local Supabase instance (docker required)
- **Cloud**: Uses hosted Supabase instance

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

### Common Development Tasks

**Adding a New Page**:
1. Create route in appropriate group (`(dashboard)` for protected routes)
2. Add navigation link in `SideNav` component
3. Implement loading state with skeleton
4. Follow existing page patterns

**Adding a New API Endpoint**:
1. Create route handler in `/app/api/`
2. Implement authentication check
3. Add request validation with Zod
4. Handle errors appropriately
5. Update TypeScript types

**Working with Database**:
1. Create migration in `/supabase/migrations/`
2. Update TypeScript types in `database.types.ts`
3. Implement RLS policies for security
4. Test locally before pushing to cloud

**Component Development**:
1. Check if Shadcn UI has the component: `npm run ui:add`
2. If custom, create in appropriate directory
3. Follow existing component patterns
4. Keep components under 200 lines
5. Extract reusable logic to hooks

### Performance Considerations
- Use dynamic imports for large components
- Implement virtualization for long lists
- Use React.memo for expensive components
- Optimize images with Next.js Image component
- Implement proper loading states

### Security Best Practices
- All data access through RLS policies
- Validate all user inputs
- Sanitize data before rendering
- Use CSRF protection for mutations
- Never expose sensitive keys client-side