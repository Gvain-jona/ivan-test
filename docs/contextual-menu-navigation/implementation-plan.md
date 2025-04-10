# Contextual Menu Navigation Implementation Plan

## Overview

This document outlines the implementation plan for adding special navigation items to the footer navigation that trigger contextual menus rather than navigating to other pages. These special items include:

1. **Notifications** - Shows a dropdown of user notifications
2. **Search** - Opens a search interface
3. **Profile** - Displays user profile options

Unlike standard navigation items that navigate to different pages, these items will:
- Remain on the current page when clicked
- Display a contextual menu above the navigation bar
- Change their icon color to indicate active state
- Not display a title text (icon only)

## UI/UX Behavior

Based on the reference image, the contextual menu behavior should:
- Appear as a floating panel above the footer navigation
- Be triggered by clicking on the respective icon
- Do not show a visual indicator (triangle or similar) pointing to the active icon, as the active icon's color change will be visually sufficient to identify the active action
- Close when clicking outside or on another navigation item
- Maintain the active state of the current page in the navigation
- Add logic to prevent the menu from overflowing the viewport. For example, calculate the viewport width and adjust the left position if the menu would extend beyond the screen
- Implement focus trapping in the ContextMenu component to keep focus within the menu while it’s open
- Improve menu switching by updating handleTabChange to handle direct switches between menus.
- Debounce event listeners for better performance.

## Technical Requirements

1. **State Management**:
   - Track which contextual menu is active (if any)
   - Maintain the active page state independently from contextual menu state

2. **Component Structure**:
   - Create reusable contextual menu components
   - Integrate with existing footer navigation
   - Ensure proper z-indexing and positioning

3. **Animations**:
   - Smooth opening/closing transitions
   - Visual feedback for active states

4. **Accessibility**:
   - Keyboard navigation support
   - Proper ARIA attributes
   - Focus management

## Implementation Steps

### Phase 1: Foundation Setup

#### 1.1 Create Context Menu Types and State Management

```typescript
// Define the types for context menu items
type ContextMenuType = 'notifications' | 'search' | 'profile' | null;

// Create a context or state management for tracking active context menu
interface NavigationState {
  activePageIndex: number | null;
  activeContextMenu: ContextMenuType;
}
```

#### 1.2 Update Navigation Item Types

```typescript
// Update the existing navigation item types
interface NavItem {
  title: string;
  icon: React.ComponentType;
  href: string;
  isContextMenu?: boolean;
  menuType?: ContextMenuType;
  type?: never;
}
```

#### 1.3 Create Base Contextual Menu Component

Create a base component that will be used for all contextual menus:

```tsx
interface ContextMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuType: ContextMenuType;
  position: { x: number; y: number } | null;
  activeSection: string;
}

function ContextMenu({
  open,
  onOpenChange,
  menuType,
  position,
  activeSection
}: ContextMenuProps) {
  // Implementation
}
```

### Phase 2: Contextual Menu Components

#### 2.1 Create Notifications Menu Component

```tsx
function NotificationsMenu() {
  // Implementation for notifications menu
}
```

#### 2.2 Create Search Menu Component

```tsx
function SearchMenu() {
  // Implementation for search interface
}
```

#### 2.3 Create Profile Menu Component

```tsx
function ProfileMenu() {
  // Implementation for profile options
}
```

### Phase 3: Footer Navigation Integration

#### 3.1 Update FooterNav Component

Modify the existing FooterNav component to handle contextual menu items:

```tsx
function FooterNav() {
  // Add state for tracking active context menu
  const [activeMenu, setActiveMenu] = useState<ContextMenuType>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  // Update navigation items to include context menu items
  const navigationItems = [
    // Regular navigation items...
    { title: 'Notifications', icon: Bell, href: '#', isContextMenu: true, menuType: 'notifications' },
    { title: 'Search', icon: Search, href: '#', isContextMenu: true, menuType: 'search' },
    { title: 'Profile', icon: User, href: '#', isContextMenu: true, menuType: 'profile' },
  ];

  // Update handleTabChange to handle context menu items with improved menu switching
  const handleTabChange = (index: number, event?: React.MouseEvent) => {
    const item = navigationItems[index];

    if (item.isContextMenu) {
      // Handle context menu click
      if (activeMenu === item.menuType && contextMenuOpen) {
        // If clicking the same menu that's already open, close it
        setContextMenuOpen(false);
        setActiveMenu(null);
      } else {
        // If opening a new menu or switching between menus
        setActiveMenu(item.menuType as ContextMenuType);
        setContextMenuOpen(true);

        // Calculate position for the context menu
        if (event) {
          const rect = event.currentTarget.getBoundingClientRect();
          setClickPosition({
            x: rect.left + rect.width / 2,
            y: rect.top
          });
        }
      }
    } else {
      // Handle regular navigation
      router.push(item.href);
      setActiveMenu(null);
      setContextMenuOpen(false);
    }
  };

  // Add context menu component
  return (
    <>
      {/* Existing navigation */}
      <ExpandableTabs
        tabs={navigationItems}
        onChange={handleTabChange}
        initialSelectedIndex={activeTabIndex}
      />

      {/* Context Menu */}
      <ContextMenu
        open={contextMenuOpen}
        onOpenChange={setContextMenuOpen}
        menuType={activeMenu}
        position={clickPosition}
        activeSection={activeSection}
      />
    </>
  );
}
```

#### 3.2 Update ExpandableTabs Component

Modify the ExpandableTabs component to handle context menu items differently:

```tsx
function ExpandableTabs({ tabs, onChange, initialSelectedIndex }) {
  // Update rendering to handle context menu items
  return (
    <div className="tabs-container">
      {tabs.map((tab, index) => (
        <button
          key={index}
          className={`tab ${tab.isContextMenu ? 'context-menu-tab' : ''}`}
          onClick={(e) => onChange(index, e)}
          aria-selected={selected === index}
          aria-expanded={tab.isContextMenu ? selected === index : undefined}
          aria-haspopup={tab.isContextMenu ? "menu" : undefined}
          aria-controls={tab.isContextMenu ? `${tab.menuType}-menu` : undefined}
        >
          <tab.icon />
          {!tab.isContextMenu && <span>{tab.title}</span>}
        </button>
      ))}
    </div>
  );
}
```

### Phase 4: Context Menu Implementation

#### 4.1 Implement Main ContextMenu Component

```tsx
function ContextMenu({ open, onOpenChange, menuType, position, activeSection }) {
  // Close when clicking outside with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleClickOutside = (e: MouseEvent) => {
      // Logic to detect clicks outside the menu
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Debounce the click handler
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onOpenChange(false);
        }, 100);
      }
    };

    if (open) {
      // Add a small delay before adding the event listener
      // to prevent immediate closing when opening the menu
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timeoutId);
    };
  }, [open, onOpenChange]);

  // Render appropriate menu based on type
  const renderMenu = () => {
    switch (menuType) {
      case 'notifications':
        return <NotificationsMenu activeSection={activeSection} />;
      case 'search':
        return <SearchMenu activeSection={activeSection} />;
      case 'profile':
        return <ProfileMenu activeSection={activeSection} />;
      default:
        return null;
    }
  };

  if (!open || !position) return null;

  // Calculate position to prevent viewport overflow
  const calculatePosition = () => {
    if (!position) return {};

    const menuWidth = 350; // Width of the menu in pixels
    const viewportWidth = window.innerWidth;
    const leftPosition = position.x;

    // Calculate if menu would overflow right edge
    const rightOverflow = leftPosition + (menuWidth / 2) > viewportWidth - 20;
    // Calculate if menu would overflow left edge
    const leftOverflow = leftPosition - (menuWidth / 2) < 20;

    let adjustedLeft;
    let adjustedTransform = 'translateX(-50%)';

    if (rightOverflow) {
      // Align menu to right edge with padding
      adjustedLeft = viewportWidth - menuWidth - 20;
      adjustedTransform = 'none';
    } else if (leftOverflow) {
      // Align menu to left edge with padding
      adjustedLeft = 20;
      adjustedTransform = 'none';
    } else {
      // Center menu above the icon
      adjustedLeft = leftPosition;
    }

    return {
      position: 'absolute',
      left: `${adjustedLeft}px`,
      bottom: `calc(100% + 10px)`,
      transform: adjustedTransform
    };
  };

  return (
    <div
      ref={menuRef}
      className="context-menu-container"
      style={calculatePosition()}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="context-menu-content">
        {renderMenu()}
      </div>
    </div>
  );
}
```

#### 4.2 Implement Specific Menu Components

Example for the Notifications menu:

```tsx
function NotificationsMenu({ activeSection }) {
  return (
    <div className="notifications-menu">
      <h3>Notifications</h3>
      <div className="notifications-list">
        {/* Notification items */}
        <div className="notification-item">
          <div className="notification-icon">📋</div>
          <div className="notification-content">
            <p>New order received</p>
            <span className="notification-time">2 minutes ago</span>
          </div>
        </div>
        {/* More notification items */}
      </div>
    </div>
  );
}
```

### Phase 5: Styling and Animations

#### 5.1 Create Styles for Context Menus

```css
/* Base styles for context menus */
.context-menu-container {
  position: absolute;
  z-index: 50;
  width: 350px;
  background-color: var(--background);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

/* No arrow indicator as per updated requirements */

/* Animation for menu appearance */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px) translateX(-50%);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
}

/* Animation for menu disappearance */
@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
  to {
    opacity: 0;
    transform: translateY(10px) translateX(-50%);
  }
}

/* Context menu tab styling */
.context-menu-tab {
  padding: 0.5rem;
  border-radius: 50%;
}

.context-menu-tab[aria-selected="true"] {
  color: var(--primary);
}
```

#### 5.2 Add Animation Logic

```tsx
function ContextMenu({ open, onOpenChange, menuType, position, activeSection }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onOpenChange(false);
      setIsExiting(false);
    }, 200); // Match animation duration
  };

  // Rest of the component...

  return (
    <div
      className={`context-menu-container ${isExiting ? 'exiting' : ''}`}
      style={{
        // Styles...
        animation: isExiting ? 'slideDown 0.2s ease-in forwards' : 'slideUp 0.2s ease-out'
      }}
    >
      {/* Content... */}
    </div>
  );
}
```

### Phase 6: Accessibility Enhancements

#### 6.1 Add Keyboard Navigation

```tsx
function ContextMenu({ open, onOpenChange, menuType, position, activeSection }) {
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Rest of the component...
}
```

#### 6.2 Add Focus Trapping

```tsx
function ContextMenu({ open, onOpenChange, menuType, position, activeSection }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element and focus the menu when it opens
  useEffect(() => {
    if (open) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the menu or its first focusable element
      if (menuRef.current) {
        const focusable = menuRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable && focusable instanceof HTMLElement) {
          focusable.focus();
        } else {
          menuRef.current.focus();
        }
      }
    } else if (previousFocusRef.current) {
      // Restore focus when menu closes
      previousFocusRef.current.focus();
    }
  }, [open]);

  // Trap focus within the menu
  useEffect(() => {
    if (!open || !menuRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !menuRef.current) return;

      // Get all focusable elements in the menu
      const focusableElements = menuRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // If shift+tab and on first element, wrap to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // If tab and on last element, wrap to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [open]);

  // Rest of the component...

  return (
    <div
      ref={menuRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${menuType} menu`}
      // Rest of the props...
    >
      {/* Content... */}
    </div>
  );
}
```

## Testing Plan

### 1. Unit Tests

- Test context menu state management
- Test proper rendering of different menu types
- Test click handling for context menu items vs. navigation items

### 2. Integration Tests

- Test interaction between footer navigation and context menus
- Test that page navigation state is maintained when using context menus
- Test that context menus close properly when navigating to a new page

### 3. User Acceptance Testing

- Verify smooth animations and transitions
- Confirm proper positioning on different screen sizes
- Test keyboard navigation and accessibility features

## Implementation Timeline

1. **Foundation Setup (1 day)**
   - Create necessary types and interfaces
   - Set up state management

2. **Component Development (2 days)**
   - Create base context menu component
   - Implement specific menu components (notifications, search, profile)

3. **Navigation Integration (1 day)**
   - Update footer navigation to handle context menu items
   - Implement click handling and positioning logic

4. **Styling and Animations (1 day)**
   - Create styles for context menus
   - Implement animations for opening/closing

5. **Accessibility and Testing (1 day)**
   - Add keyboard navigation and focus management
   - Test and fix any issues

## Conclusion

This implementation plan provides a comprehensive approach to adding contextual menu navigation items to the footer navigation. By following these steps, we will create a seamless user experience that allows users to access important features like notifications, search, and profile options without navigating away from the current page.

The implementation leverages existing components where possible and introduces new components and state management to handle the contextual menu behavior. The plan also includes considerations for styling, animations, and accessibility to ensure a polished and inclusive user experience.
