# Profile-Based Enhancements

This document outlines the profile-based enhancements implemented in the application, including role-based menu items and personalized user information in the header.

## 1. Approvals Menu Item for Admins and Managers

### Overview

We've added an "Approvals" menu item to the profile context menu that is only visible to users with the role of 'admin' or 'manager'. This menu item leads to the approvals page where administrators and managers can review and manage deletion requests from staff members.

### Implementation Details

#### Context Menu Update

The context menu has been updated to conditionally render the Approvals menu item based on the user's role:

```jsx
{/* Approvals menu item - only for admins and managers */}
{(profile?.role === 'admin' || profile?.role === 'manager') && (
  <button 
    className="flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
    onClick={() => router.push('/dashboard/approvals')}
  >
    <ClipboardCheck className="mr-2 h-4 w-4" />
    <span>Approvals</span>
  </button>
)}
```

#### Approvals Page

A new page has been created at `/dashboard/approvals` that displays approval requests in a tabbed interface:

1. **Pending Tab**: Shows all pending approval requests that need to be reviewed
2. **Approved Tab**: Shows all approved requests
3. **Rejected Tab**: Shows all rejected requests

The page includes role-based access control to ensure that only admins and managers can access it:

```jsx
// Check if user is admin or manager
useEffect(() => {
  if (!authLoading && profile) {
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      });
      router.push('/dashboard/orders');
    }
  }
}, [authLoading, profile, router, toast]);
```

## 2. Dynamic Header with User Information

### Overview

The header has been updated to display the logged-in user's name and a time-based greeting message.

### Implementation Details

#### Time-Based Greeting

A function has been added to generate a greeting based on the time of day:

```javascript
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}
```

The greeting is updated every minute to ensure it remains current:

```javascript
// Get time-based greeting
const [greeting, setGreeting] = useState(getTimeBasedGreeting());

// Update greeting every minute
useEffect(() => {
  const intervalId = setInterval(() => {
    setGreeting(getTimeBasedGreeting());
  }, 60000); // Update every minute
  
  return () => clearInterval(intervalId);
}, []);
```

#### User Information Display

The header now displays the user's name and role along with the time-based greeting:

```jsx
<div className="hidden md:block text-left">
  <p className="text-sm font-medium">{displayName}</p>
  <p className="text-xs text-muted-foreground">
    {`${greeting} ${profile?.role ? `(${capitalizeFirstLetter(profile.role)})` : ''}`}
  </p>
</div>
```

## 3. Integration with Auth Context

### Overview

The profile-based enhancements are integrated with the authentication context to ensure that user information and roles are consistently applied throughout the application.

### Implementation Details

#### Using Auth Context

The TopHeader component now uses the auth context instead of a separate hook:

```javascript
// Get user profile information from auth context
const { profile, isLoading } = useAuth();
```

This ensures that the user's profile information is consistent across the application and is updated whenever the authentication state changes.

## 4. Benefits

These profile-based enhancements provide several benefits:

1. **Role-Based Access Control**: Only users with appropriate roles can access certain features
2. **Personalized Experience**: Users see their name and a time-appropriate greeting
3. **Improved User Experience**: The interface adapts to the user's role and the time of day
4. **Consistent Authentication**: Using the auth context ensures consistent user information

## 5. Future Enhancements

Potential future enhancements could include:

1. **More Role-Based Features**: Additional features that are only available to certain roles
2. **User Preferences**: Allow users to customize their experience
3. **Activity Tracking**: Show recent activity or notifications specific to the user
4. **Enhanced Approvals**: Add more detailed information and filtering options to the approvals page
