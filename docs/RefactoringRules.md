# Refactoring Rules

This document outlines the comprehensive set of rules, guidelines, and best practices for refactoring code in the Ivan Prints Business Management System. Following these rules will ensure that code is refactored systematically while maintaining existing functionality and preventing regressions.

## Table of Contents

1. [General Principles](#general-principles)
2. [Pre-Refactoring Checks](#pre-refactoring-checks)
3. [Refactoring Process](#refactoring-process)
4. [Component Refactoring](#component-refactoring)
5. [State Management Refactoring](#state-management-refactoring)
6. [Utility Functions Refactoring](#utility-functions-refactoring)
7. [UI Component Integration](#ui-component-integration)
8. [Testing and Validation](#testing-and-validation)
9. [Documentation](#documentation)
10. [Post-Refactoring Review](#post-refactoring-review)

## General Principles

1. **Preserve Functionality**: Refactoring should not change the external behavior of the code.
2. **Incremental Changes**: Make small, focused changes rather than large-scale rewrites.
3. **One Concern at a Time**: Address one issue at a time (e.g., extract methods before refactoring logic).
4. **Maintain Tests**: Keep tests running and passing throughout the refactoring process.
5. **Version Control**: Commit frequently with clear, descriptive messages.
6. **Code Style Consistency**: Maintain consistent code style with the rest of the codebase.
7. **Backward Compatibility**: Ensure refactored code works with existing code.

## Pre-Refactoring Checks

Before beginning any refactoring work:

1. **Create a Branch**: Always work in a dedicated branch for refactoring.
2. **Review Dependencies**: Identify all components that depend on the code being refactored.
3. **Understand the Code**: Ensure complete understanding of the code's purpose and behavior.
4. **Document Current Behavior**: Note key functionality, edge cases, and expected outputs.
5. **Identify Tests**: Locate existing tests that cover the code to be refactored.
6. **Create Missing Tests**: If test coverage is inadequate, write additional tests before refactoring.
7. **Define Scope**: Clearly define what will and won't be changed during refactoring.

## Refactoring Process

Follow this structured process for all refactoring work:

1. **Plan**: Create a detailed refactoring plan with specific steps.
2. **Backup**: Ensure the current code is committed to version control.
3. **Test Before**: Run all relevant tests to ensure they pass before starting.
4. **Refactor Incrementally**:
   - Make one logical change at a time
   - Commit after each successful change
   - Run tests after each significant change
5. **Review**: Review changes after completion to ensure they meet the guidelines.
6. **Test After**: Run all tests again to verify functionality is preserved.
7. **Document**: Update documentation to reflect the new code structure.

## Component Refactoring

When refactoring React components:

1. **Single Responsibility Principle**: Each component should do one thing and do it well.
2. **Extraction Order**:
   - First extract pure utility functions
   - Then extract stateless sub-components
   - Finally extract stateful logic into custom hooks
3. **Props Management**:
   - Use TypeScript interfaces to define props
   - Maintain prop naming consistency
   - Don't change prop interfaces unnecessarily
4. **File Structure**:
   - Create a dedicated directory for complex components
   - Use index.tsx for the main component export
   - Place sub-components in separate files within the directory
5. **Component Size**:
   - Limit components to 200 lines maximum
   - If a component exceeds this limit, break it down further
6. **Export Strategy**:
   - Use default exports for main components
   - Use named exports for utilities and sub-components
7. **Backwards Compatibility**:
   - Maintain original file with re-export during transition
   - Remove only when all dependencies are updated

## State Management Refactoring

When refactoring state management:

1. **Custom Hooks**: Extract complex state logic into custom hooks.
2. **State Consolidation**: Combine related state variables using reducer patterns when appropriate.
3. **Context Usage**: Use context for state that needs to be accessed by multiple components.
4. **Avoid Prop Drilling**: Refactor prop drilling into context or composition patterns.
5. **Effect Cleanup**: Ensure all effects have proper cleanup functions.
6. **Memoization**: Use useMemo and useCallback appropriately to prevent unnecessary renders.
7. **State Initialization**: Standardize state initialization patterns.

## Utility Functions Refactoring

When refactoring utility functions:

1. **Pure Functions**: Ensure utilities are pure functions (same input always produces same output).
2. **Single Responsibility**: Each utility should do one thing well.
3. **File Organization**: Group related utilities in dedicated files.
4. **Naming Conventions**: Use descriptive, action-based names (e.g., `formatCurrency`, not `currencyFormatter`).
5. **TypeScript Types**: Add proper TypeScript types for all parameters and return values.
6. **Documentation**: Add JSDoc comments explaining purpose, parameters, and return values.
7. **Testing**: Write unit tests for all utility functions.

## UI Component Integration

When integrating Shadcn UI components:

1. **Component Replacement**: Replace custom UI elements with equivalent Shadcn components.
2. **Styling Consistency**: Maintain dark theme with orange accent colors.
3. **Accessibility**: Preserve or enhance accessibility attributes.
4. **Prop Mapping**: Carefully map existing props to Shadcn component props.
5. **Composition**: Use composition to extend Shadcn components when needed.
6. **Variant Usage**: Use appropriate variants to maintain visual consistency.
7. **Animation Preservation**: Maintain existing animation and transition behaviors.

## Testing and Validation

Throughout the refactoring process:

1. **Test-First Approach**: Run existing tests before making changes.
2. **Incremental Testing**: Test after each significant change.
3. **Visual Regression**: Check for visual regressions in UI components.
4. **Edge Cases**: Test edge cases explicitly (empty states, error states, etc.).
5. **Performance Testing**: Validate that performance remains the same or improves.
6. **Cross-Browser Testing**: Verify functionality in all supported browsers.
7. **Accessibility Testing**: Ensure accessibility is maintained or improved.

## Documentation

Update documentation throughout the refactoring process:

1. **Component Documentation**: Update or create JSDoc comments for all components and functions.
2. **README Files**: Create README.md files for complex component directories.
3. **Implementation Notes**: Document any non-obvious implementation details.
4. **API Changes**: Document any changes to component APIs, even if backward compatible.
5. **Usage Examples**: Provide updated usage examples for refactored components.
6. **Update Central Docs**: Update project-level documentation to reflect changes.

## Post-Refactoring Review

After completing refactoring:

1. **Code Review**: Have another developer review the changes.
2. **Self Review**: Review changes yourself after a day to spot issues with fresh eyes.
3. **Test Coverage Review**: Ensure test coverage has been maintained or improved.
4. **Bundle Size Impact**: Check that bundle size hasn't increased significantly.
5. **Performance Check**: Verify that performance remains the same or has improved.
6. **Documentation Check**: Ensure all documentation has been updated.
7. **Final Cleanup**: Remove any temporary code, comments, or console logs.

## Specific Rules for Common Refactoring Patterns

### Extracting Components

1. Start by creating the new component file
2. Copy the JSX from the original component
3. Identify all props needed by the extracted component
4. Create a TypeScript interface for the props
5. Replace the JSX in the original component with the new component
6. Test that functionality is unchanged

### Extracting Custom Hooks

1. Create a new file for the hook
2. Copy relevant state and effect code from the component
3. Identify dependencies from the component scope
4. Add these as parameters to the hook
5. Return values and functions needed by the component
6. Replace the original code with a call to the hook
7. Test that behavior is identical

### Extracting Utility Functions

1. Identify pure logic that doesn't depend on component state
2. Create a new file or add to an existing utility file
3. Copy the function and ensure it receives all needed inputs as parameters
4. Add proper TypeScript types
5. Add JSDoc documentation
6. Import and use the utility in the original component
7. Write unit tests for the utility function

### Replacing with Shadcn Components

1. Identify the custom component to be replaced
2. Find the equivalent Shadcn component
3. Map current props to Shadcn component props
4. Adjust any styling to maintain visual consistency
5. Update event handlers to match the new component API
6. Test to ensure functionality and appearance are preserved
7. Remove any now-unused custom component code

## Example Refactoring Workflow

Here's an example workflow for refactoring a large component:

1. Create a new branch for the refactoring work
2. Run all tests to ensure they pass before starting
3. Extract utility functions to a separate file
4. Extract complex state logic into custom hooks
5. Break the component into smaller sub-components
6. Replace custom UI elements with Shadcn components
7. Update the main component to use all the extracted pieces
8. Run tests to ensure functionality is preserved
9. Update documentation to reflect the new structure
10. Submit for code review
11. Merge to the main branch

By following these rules, the refactoring process will be systematic, maintainable, and less prone to introducing bugs or regressions. The result will be a more maintainable, testable, and scalable codebase. 