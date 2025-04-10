# Navigation Restructuring

This document outlines the restructuring of the navigation system in the Ivan Prints Business Management System.

## Overview

The navigation system has been significantly restructured to improve user experience and follow modern UI patterns:

1. **Footer Navigation**: Moved from a sidebar to a center screen footer navigation
2. **Profile Menu**: Moved user profile options from the TopHeader dropdown to a dedicated side panel
3. **TopHeader Simplification**: Simplified the TopHeader to focus on business information and user greeting
4. **Theme Switching**: Moved theme switching to the Profile menu

## Implementation Details

### 1. Footer Navigation with Profile Option

The footer navigation now includes a Profile option that opens a dedicated side panel:

```jsx
// FooterNav.tsx
const navigationItems = [
  { title: 'Home', icon: Home, href: '/dashboard/home' },
  { title: 'Orders', icon: Package, href: '/dashboard/orders' },
  // ... other navigation items ...
  { title: 'Profile', icon: User, href: '/dashboard/profile' },
];

// Handle tab change with special case for Profile
const handleTabChange = useCallback((index: number | null) => {
  if (index !== null && 'href' in navigationItems[index]) {
    // Check if it's the profile tab
    if (navigationItems[index].title === 'Profile') {
      setProfileMenuOpen(true);
    } else {
      router.push(navigationItems[index].href as string);
    }
  }
}, [router]);
```

### 2. Profile Menu Side Panel

A new ProfileMenu component was created to display user options in a side panel:

```jsx
// ProfileMenu.tsx
export default function ProfileMenu({
  open,
  onOpenChange,
  userName = 'James Brown',
  userInitials = 'JB',
  userAvatarUrl = '/avatar.jpg'
}: ProfileMenuProps) {
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { 
      icon: <User className="mr-2 h-5 w-5" />, 
      label: 'Profile', 
      onClick: () => console.log('Profile clicked') 
    },
    // ... other menu items ...
    { 
      icon: theme === 'dark' 
        ? <Sun className="mr-2 h-5 w-5" /> 
        : <Moon className="mr-2 h-5 w-5" />, 
      label: `${theme === 'dark' ? 'Light' : 'Dark'} theme`, 
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark') 
    },
    { 
      icon: <LogOut className="mr-2 h-5 w-5 text-red-500" />, 
      label: 'Log out', 
      onClick: () => console.log('Logout clicked'),
      className: 'text-red-500'
    }
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="...">
        {/* Profile content */}
      </SheetContent>
    </Sheet>
  );
}
```

### 3. Simplified TopHeader

The TopHeader has been simplified to focus on business information and user greeting:

```jsx
// TopHeader.tsx
export default function TopHeader({
  className,
  businessName = 'Ivan Prints',
  appTitle = 'Business Management System',
  userName = 'James Brown',
  userInitials = 'JB',
  userAvatarUrl = '/avatar.jpg',
  logoUrl = '/logo.png'
}: TopHeaderProps) {
  // ...

  return (
    <header className={...}>
      <div className="flex items-center">
        {/* Logo and Business Name */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 relative">
            <Image 
              src={logoUrl} 
              alt={businessName} 
              fill 
              className="object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-foreground">{businessName}</h1>
            <p className="text-xs text-muted-foreground">{appTitle}</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="ml-auto flex items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-border/40">
            <AvatarImage src={userAvatarUrl} alt={userName} />
            <AvatarFallback className="...">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">Welcome back 👋</p>
          </div>
        </div>
      </div>
    </header>
  );
}
```

## Benefits of the New Structure

1. **Improved Mobile Experience**: The footer navigation is more accessible on mobile devices
2. **Cleaner Header**: The TopHeader is now focused on essential information
3. **Centralized User Options**: All user-related options are now in one place
4. **Better Visual Hierarchy**: The business name and app title are now prominently displayed
5. **Consistent Navigation**: The footer navigation provides a consistent experience across the application

## User Experience Flow

1. **Basic Navigation**: Users use the footer navigation to move between main sections
2. **Profile Access**: Users click the Profile icon in the footer to access profile options
3. **Theme Switching**: Users can switch themes from the Profile menu
4. **Business Context**: The TopHeader provides context about the business and user

## Technical Implementation

The implementation uses several key components:

1. **ExpandableTabs**: For the footer navigation
2. **Sheet**: For the Profile menu side panel
3. **Avatar**: For user representation in both the TopHeader and Profile menu
4. **Image**: For displaying the business logo

## Future Enhancements

1. **User Authentication**: Connect the Profile menu to the authentication system
2. **Customizable Navigation**: Allow users to customize the order of navigation items
3. **Notification Integration**: Add notification indicators to relevant navigation items
4. **Context-Aware Header**: Adapt the TopHeader based on the current section
