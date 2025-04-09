# Footer Navigation Enhancements

This document outlines the enhancements made to the footer navigation in the Ivan Prints Business Management System.

## Overview

The footer navigation has been enhanced with the following improvements:

1. **Replaced Settings with Search**: Changed the Settings icon to a Search feature
2. **Added Contextual Action Menu**: Implemented a context-aware action menu that provides options related to the current section
3. **Improved User Experience**: Made the navigation more intuitive and efficient

## Implementation Details

### 1. Search Feature

The Settings navigation item has been replaced with a Search feature:

```jsx
// Before
{ title: 'Settings', icon: Settings, href: '/dashboard/settings' },
{ title: 'Profile', icon: User, href: '/dashboard/profile' },

// After
{ title: 'Search', icon: Search, href: '/dashboard/search' },
```

This change provides users with quick access to search functionality, which is more commonly used than settings.

### 2. Contextual Action Menu

A new ContextMenu component has been created to replace the side modal profile menu:

```jsx
// ContextMenu.tsx
export default function ContextMenu({ activeSection, position }: ContextMenuProps) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  
  // Get the appropriate actions based on the active section
  const sectionKey = activeSection.toLowerCase().replace(/[^a-z]/g, '') as keyof typeof contextualActions;
  const actions = contextualActions[sectionKey] || contextualActions.home;
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={true}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-gray-950/90 border border-gray-800 shadow-md"
          aria-label="Context Menu"
        >
          <User className="h-5 w-5 text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{activeSection} Actions</DropdownMenuLabel>
        {/* Contextual actions based on active section */}
        {/* Profile actions */}
        {/* Theme toggle */}
        {/* Logout */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Key features of the ContextMenu:

1. **Context-Aware Actions**: The menu displays different actions based on the current section
2. **Centralized Profile Options**: All profile-related options are available in one place
3. **Theme Switching**: The theme toggle is included in the menu
4. **Improved Accessibility**: The menu is more accessible and easier to use

### 3. Integration with Footer Navigation

The ContextMenu is integrated with the FooterNav component:

```jsx
// FooterNav.tsx
export default function FooterNav({ className }: FooterNavProps) {
  // ...
  
  // Get the active section name
  const activeSectionName = activeTabIndex !== -1 && 'title' in navigationItems[activeTabIndex]
    ? navigationItems[activeTabIndex].title as string
    : 'Home';
  
  // ...
  
  return (
    <>
      {/* Scroll to top button */}
      {/* ... */}
      
      {/* Context Menu Button */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
        <ContextMenu activeSection={activeSectionName} />
      </div>
      
      {/* Footer Navigation */}
      <div className={/* ... */}>
        <ExpandableTabs
          tabs={navigationItems as any}
          activeColor="text-orange-500"
          className="border-gray-800 bg-gray-950/90 backdrop-blur-md shadow-lg px-1 py-1"
          onChange={handleTabChange}
          initialSelectedIndex={initialTab}
        />
      </div>
    </>
  );
}
```

## Contextual Actions

The ContextMenu provides different actions based on the current section:

| Section | Actions |
|---------|---------|
| Home | New Task, View Calendar, Recent Activity |
| Orders | New Order, Filter Orders, Export Orders |
| Expenses | New Expense, Generate Report, Monthly Summary |
| Material | New Purchase, Edit Inventory, Export List |
| To-Do | New Task, Edit Tasks, Clear Completed |
| Analytics | Export Report, Share Dashboard, Change Period |
| Notifications | Clear All, Notification Settings, Show Archived |
| Search | Advanced Search, Recent Searches, Search Settings |

## Profile Actions

The ContextMenu also includes standard profile actions:

1. **Profile**: View and edit profile information
2. **Settings**: Access application settings
3. **Billing**: Manage billing information
4. **Help & Support**: Get help and support
5. **Theme Toggle**: Switch between light and dark themes
6. **Log Out**: Log out of the application

## Benefits

1. **Improved Efficiency**: Users can access contextual actions without navigating away from the current screen
2. **Reduced Navigation**: Fewer clicks required to perform common actions
3. **Context Awareness**: The menu adapts to the current section, providing relevant options
4. **Centralized Profile Options**: All profile-related options are available in one place
5. **Improved Search Access**: Search functionality is more prominently featured

## User Experience Flow

1. **Basic Navigation**: Users use the footer navigation to move between main sections
2. **Contextual Actions**: Users click the context menu button to access actions related to the current section
3. **Profile Management**: Users can access profile options from the context menu
4. **Theme Switching**: Users can switch themes from the context menu

## Technical Implementation

The implementation uses several key components:

1. **ExpandableTabs**: For the footer navigation
2. **DropdownMenu**: For the context menu
3. **Contextual Actions**: Different actions based on the current section
4. **Active Section Tracking**: Determining the current section for context-aware actions

## Future Enhancements

1. **Customizable Actions**: Allow users to customize the actions in the context menu
2. **Recent Actions**: Show recently used actions at the top of the menu
3. **Keyboard Shortcuts**: Add keyboard shortcuts for common actions
4. **Gesture Support**: Add swipe gestures to access the context menu
5. **Search Integration**: Enhance the search feature with advanced options
