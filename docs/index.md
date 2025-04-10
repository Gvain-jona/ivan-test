# Ivan Prints Business Management System Documentation

*Last Updated: April 3, 2024*

Welcome to the documentation for the Ivan Prints Business Management System. This index provides links to all documentation resources for the project.

## Documentation Categories

### [Project Documentation](./README.md)
Main documentation for the project, including status, implementation updates, and architecture.

### [Refactoring Documentation](./refactoring/README.md)
Documentation for refactoring efforts, including plans, implementation guides, and progress tracking.

### [Code Quality](./large-files-checklist.md)
Inventory of large files that are candidates for refactoring.

## Current Refactoring Projects

### [InvoiceSheet Component Refactoring](./refactoring/invoice-sheet/README.md)
Comprehensive plan and implementation guides for refactoring the InvoiceSheet component.

## Refactoring Progress

### [Refactoring Progress Tracking](./refactoring-progress.md)
Detailed tracking of all refactoring efforts across the project.

## How to Use This Documentation

1. Start with the [Project Documentation](./README.md) to understand the overall project
2. Review the [Refactoring Documentation](./refactoring/README.md) for information on code quality improvements
3. Check the [Refactoring Progress Tracking](./refactoring-progress.md) to see the status of current refactoring efforts
4. For specific refactoring projects, refer to their dedicated documentation (e.g., [InvoiceSheet Refactoring](./refactoring/invoice-sheet/README.md))

## Contributing to Documentation

When adding or updating documentation:

1. Follow the established directory structure
2. Update relevant index files
3. Use consistent Markdown formatting
4. Include the date of updates
5. Link related documents together

## Documentation Structure

```
docs/
├── README.md                    # Main project documentation index
├── index.md                     # This file - master index
├── large-files-checklist.md     # Inventory of large files
├── refactoring-progress.md      # Progress tracking for all refactoring
├── refactoring/                 # Refactoring documentation
│   ├── README.md                # Refactoring documentation index
│   └── invoice-sheet/           # InvoiceSheet refactoring
│       ├── README.md            # InvoiceSheet refactoring index
│       ├── InvoiceSheet-Refactoring-Plan.md
│       ├── InvoiceSheet-Refactoring-Steps.md
│       ├── InvoicePreview-Implementation-Guide.md
│       ├── InvoiceSettings-Implementation-Guide.md
│       ├── InvoiceHooks-Implementation-Guide.md
│       ├── RefactoredInvoiceSheet-Implementation-Guide.md
│       └── InvoiceSheet-README.md
└── ... (other documentation files)
```
