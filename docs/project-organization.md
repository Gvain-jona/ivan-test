# Project Organization

## Current Structure

The Ivan Prints Business Management System is organized as follows:

### Root Directory (`/`)
- Contains the primary Next.js application
- Houses project-wide configuration files (`.env.local`, `.prettierrc`, etc.)
- Includes the main documentation in the `docs` folder
- Contains the complete Supabase integration with:
  - Server and client components
  - Migration scripts
  - Storage utilities
  - Admin functionality

### Ivan Prints Subdirectory (`/ivan-prints/`)
- Contains a secondary Next.js application that was initially set up
- Serves as a reference for some UI components and basic implementation
- Has a simplified Supabase integration

## Organization Guidelines

To maintain a clean and efficient codebase:

1. **Primary Development Location**: All new development should happen in the root directory's `app` folder.

2. **Reference Only**: The `ivan-prints` subdirectory should be considered a reference only and not actively developed.

3. **Code Sharing**: If any useful components or utilities exist in the `ivan-prints` folder that aren't in the main app:
   - Copy them to the appropriate location in the root `app` directory
   - Update imports and dependencies as needed
   - Test functionality in the main app

4. **Documentation**: Keep all documentation in the root `docs` folder.

5. **Dependencies**: The `package.json` in the root directory contains all necessary dependencies.

## Future Organization

The plan is to eventually phase out the `ivan-prints` subdirectory completely once all useful code has been migrated to the main application. This will ensure a single source of truth for the codebase and eliminate potential confusion or duplication.

For now, both structures are maintained to ensure no functionality is lost during the transition period.

## Running the Application

To run the application, always use the commands from the root directory:

```bash
npm run dev   # Start development server
npm run build # Build for production
npm run start # Start production server
```

All environment variables and configuration are set up in the root directory. 