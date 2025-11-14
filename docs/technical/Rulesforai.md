# Rules for AI Development Assistance

This document outlines the key constraints, best practices, and guidelines that AI assistants should follow when working on the Ivan Prints Business Management System. These rules ensure code quality, maintainability, and project organization.

##Development Server 
- The development serever is always running donot start it up unless there are specific outputs you would like to view for addtional information  , otherwise always refer to the terminal for this information

## Documentation Management

### Implementation Tracking
- Always maintain and update the `docs/implementation-updates.md` file with:
  - New features implemented
  - Changes to existing functionality
  - Technical approaches used
  - Challenges faced and solutions implemented
- Add clear dates and section headers for new updates

### Changelog Maintenance
- Record all significant changes in `docs/changelog.md`, including:
  - Issues encountered during development
  - Analysis of the root causes
  - Solutions implemented
  - Validation steps performed
- Organize entries chronologically with the most recent at the top

### Implementation Checklist
- Keep `docs/implementation-checklist.md` updated by:
  - Marking completed tasks with [x]
  - Adding new tasks as they arise
  - Organizing related tasks under appropriate sections
  - Ensuring granular tracking of implementation progress

## Code Quality Constraints

### File Size Limitations
- Limit files to a maximum of 200 lines of code
- Break down larger files into smaller, more manageable components
- Use proper file organization for related functionality

### Component Structure
- Keep components focused on a single responsibility
- Extract reusable logic into separate hooks or utilities
- Follow React best practices for component composition
- Use TypeScript interfaces for prop definitions

### Code Organization
- Follow the established project structure:
  - `app/` for Next.js application code
  - `docs/` for documentation
  - Group routes using Next.js route groups (e.g., `(dashboard)`, `(auth)`)
- Place related components in appropriate subdirectories
- Use descriptive file names that reflect component purpose
- Create proper abstractions for common functionality

## Development Practices

### TypeScript Utilization
- Always use TypeScript for type safety
- Define interfaces for all component props
- Avoid using `any` type
- Leverage TypeScript features for better code quality

### Styling Guidelines
- Use Tailwind CSS for styling components
- Maintain the dark theme with orange accent colors
- Ensure responsive design for all components
- Follow mobile-first approach for responsive layouts

### Performance Considerations
- Implement proper loading states using skeleton loaders
- Use early returns to avoid unnecessary computation
- Optimize component rendering with appropriate React hooks
- Implement infinite scrolling with "Show More" functionality for long lists

## Supabase Integration

### Authentication
- Always use the latest Supabase SSR patterns
- Implement cookie handling with `getAll`/`setAll` methods
- Never use deprecated cookie methods (`get`/`set`/`remove`)
- Follow proper middleware implementation for token refresh

### Database Access
- Implement Row Level Security (RLS) policies for data protection
- Use appropriate Supabase client based on context (server vs. client)
- Follow proper error handling for Supabase operations
- Ensure database queries are optimized and indexed

## Accessibility and User Experience

### Accessibility Standards
- Include proper ARIA attributes on interactive elements
- Ensure keyboard navigability for all interactive components
- Maintain appropriate color contrast for text readability
- Provide alternative text for images and icons

### User Experience
- Implement appropriate error messages for form validation
- Add loading indicators for asynchronous operations
- Create responsive layouts for different screen sizes
- Design intuitive user flows for common operations

## Testing and Validation

### Code Testing
- Write tests for critical components and functions
- Ensure proper error handling and edge cases are covered
- Validate form inputs with appropriate constraints
- Test different user roles and permissions

### Browser Compatibility
- Ensure compatibility with modern browsers (Chrome, Firefox, Safari, Edge)
- Test on different devices (desktop, tablet, mobile)
- Verify responsive layouts at various breakpoints
- Check performance on lower-end devices

## Deployment and Environment

### Environment Configuration
- Maintain proper environment variables
- Ensure secrets are properly managed
- Configure deployment settings appropriately
- Follow proper CI/CD practices

### Build Optimization
- Optimize bundle size for production builds
- Implement proper code splitting
- Ensure efficient loading of assets
- Configure appropriate caching strategies

## Following These Rules Ensures:

1. A well-documented, maintainable codebase
2. Consistent development practices across the project
3. High-quality, type-safe code
4. Proper tracking of project progress
5. Clear communication about changes and issues
6. Efficient collaboration between team members
7. Scalable application architecture

## Refactoring Guidelines

1. **File Size Limitations**:
   - Limit files to a maximum of 200 lines of code.
   - Break down larger files into smaller, more manageable components.

2. **Component Decomposition**:
   - Extract large components into smaller, focused components to enhance readability and maintainability.

3. **Custom Hooks**:
   - Extract complex logic into custom hooks to promote reusability and separation of concerns.

4. **Utilities**:
   - Move reusable functions to utility files to avoid duplication and improve organization.

5. **Context Providers**:
   - Use context for complex state management to simplify prop drilling and enhance component communication.

6. **Higher-Order Components (HOCs)**:
   - Use HOCs for cross-cutting concerns, such as authentication or logging, to keep components clean and focused.

7. **Refactoring Patterns**:
   - When a file exceeds 200 lines, apply the following refactoring patterns:
     - **Extract Form Sections**: For large forms, extract sections into separate components.
     - **Extract Table Components**: For tables, extract headers, rows, and pagination into separate components.
     - **Extract Dialog Components**: Move modal dialogs to separate files for better organization.
     - **Extract Utility Functions**: Move helper functions to utility files for reusability.
     - **Extract Types**: Move complex types to separate files to improve clarity and organization.

8. **Testing After Refactoring**:
   - Always run tests after refactoring to ensure that functionality remains intact and no new bugs are introduced.

9. **Code Reviews**:
   - Conduct code reviews to catch potential issues and ensure adherence to coding standards and best practices.

10. **Documentation**:
    - Keep documentation updated to reflect changes made during refactoring, ensuring that all team members are aware of the current structure and functionality.

These rules should be followed by all AI assistants working on the Ivan Prints Business Management System to maintain code quality and project organization. 