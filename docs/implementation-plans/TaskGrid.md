# Implementation Plan: TaskGrid.tsx Refactoring

This document outlines the detailed step-by-step plan for refactoring the `TaskGrid.tsx` component to adhere to the 200-line file size limit while improving code organization, maintainability, and reusability.

## Current Component Analysis

**File Path:** `app/components/tasks/TaskGrid.tsx`

**Current Structure:**
- Complex task display grid component
- Multiple utility functions for status and priority styling
- Mixed display and interaction logic
- Multiple conditional rendering functions
- Exceeds 200 lines

**Main Issues:**
- Utility functions for formatting and styling embedded in the component
- Complex task card rendering logic within the main component
- Multiple display-related helper functions
- Mixed concerns for task display, actions, and status management

## Refactoring Goals

1. Break down the component into smaller, focused components
2. Extract utility functions for task status and priority styling
3. Create reusable badges for status and priority
4. Implement Shadcn UI components where appropriate
5. Maintain all current functionality
6. Ensure the main component file is under 200 lines

## File Structure After Refactoring

```
app/
└── components/
    └── tasks/
        ├── TaskGrid/
        │   ├── index.tsx                  # Main export file (<200 lines)
        │   ├── TaskCard.tsx               # Individual task card component
        │   ├── TaskStatusBadge.tsx        # Status badge component
        │   ├── TaskPriorityBadge.tsx      # Priority badge component
        │   ├── TaskActions.tsx            # Task action buttons component
        │   └── TaskHeader.tsx             # Task card header component
        └── ...
```

```
app/
└── utils/
    └── tasks/
        ├── task-status.utils.ts           # Status-related utility functions
        ├── task-priority.utils.ts         # Priority-related utility functions
        └── task-date.utils.ts             # Date-related utility functions
```

## Detailed Refactoring Steps

### Step 1: Create Supporting Files and Directories

1. Create the directory structure
   ```
   mkdir -p app/components/tasks/TaskGrid
   mkdir -p app/utils/tasks
   ```

2. Create the utility files
   ```
   touch app/utils/tasks/task-status.utils.ts
   touch app/utils/tasks/task-priority.utils.ts
   touch app/utils/tasks/task-date.utils.ts
   ```

3. Create the component files
   ```
   touch app/components/tasks/TaskGrid/index.tsx
   touch app/components/tasks/TaskGrid/TaskCard.tsx
   touch app/components/tasks/TaskGrid/TaskStatusBadge.tsx
   touch app/components/tasks/TaskGrid/TaskPriorityBadge.tsx
   touch app/components/tasks/TaskGrid/TaskActions.tsx
   touch app/components/tasks/TaskGrid/TaskHeader.tsx
   ```

### Step 2: Extract Utility Functions

Move all utility functions from the original file to the appropriate utility files:

**app/utils/tasks/task-status.utils.ts**
```typescript
import { TaskStatus } from '@/types/tasks';

/**
 * Returns the appropriate CSS classes for a task status badge
 * @param status The task status
 * @returns CSS class string for styling the status badge
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-gray-900/20 text-gray-400 border-gray-800';
    case 'in_progress':
      return 'bg-blue-900/20 text-blue-400 border-blue-800';
    case 'completed':
      return 'bg-green-900/20 text-green-400 border-green-800';
    case 'cancelled':
      return 'bg-red-900/20 text-red-400 border-red-800';
    default:
      return 'bg-gray-900/20 text-gray-400 border-gray-800';
  }
};

/**
 * Converts a task status value to a human-readable text
 * @param status The task status
 * @returns Formatted status text for display
 */
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};
```

**app/utils/tasks/task-priority.utils.ts**
```typescript
import { TaskPriority } from '@/types/tasks';

/**
 * Returns the appropriate CSS classes for a task priority badge
 * @param priority The task priority
 * @returns CSS class string for styling the priority badge
 */
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low':
      return 'bg-blue-900/20 text-blue-400 border-blue-800';
    case 'medium':
      return 'bg-yellow-900/20 text-yellow-400 border-yellow-800';
    case 'high':
      return 'bg-orange-900/20 text-orange-400 border-orange-800';
    case 'urgent':
      return 'bg-red-900/20 text-red-400 border-red-800';
    default:
      return 'bg-gray-900/20 text-gray-400 border-gray-800';
  }
};

/**
 * Converts a task priority value to a human-readable text
 * @param priority The task priority
 * @returns Formatted priority text for display
 */
export const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    case 'urgent':
      return 'Urgent';
    default:
      return priority;
  }
};
```

**app/utils/tasks/task-date.utils.ts**
```typescript
/**
 * Checks if a task's due date is in the past
 * @param dueDate The due date string
 * @returns boolean indicating if the date is past due
 */
export const isPastDue = (dueDate: string): boolean => {
  const today = new Date();
  const due = new Date(dueDate);
  return due < today && !due.toDateString().includes(today.toDateString());
};

/**
 * Formats a date string for display
 * @param dateString The date string to format
 * @returns Formatted date string
 */
export const formatTaskDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
```

### Step 3: Create Badge Components

Extract the badge components for reusability:

**app/components/tasks/TaskGrid/TaskStatusBadge.tsx**
```typescript
import React from 'react';
import { getStatusColor, getStatusText } from '@/utils/tasks/task-status.utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskStatusBadgeProps {
  status: string;
  className?: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  className
}) => {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'px-2 py-1 text-xs font-medium rounded border', 
        getStatusColor(status), 
        className
      )}
    >
      {getStatusText(status)}
    </Badge>
  );
};
```

**app/components/tasks/TaskGrid/TaskPriorityBadge.tsx**
```typescript
import React from 'react';
import { getPriorityColor, getPriorityText } from '@/utils/tasks/task-priority.utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskPriorityBadgeProps {
  priority: string;
  className?: string;
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({
  priority,
  className
}) => {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'px-2 py-1 text-xs font-medium rounded border', 
        getPriorityColor(priority),
        className
      )}
    >
      {getPriorityText(priority)}
    </Badge>
  );
};
```

### Step 4: Create Task Actions Component

Extract the task actions logic:

**app/components/tasks/TaskGrid/TaskActions.tsx**
```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/tasks';
import { Edit, Trash2, Check, Eye } from 'lucide-react';

interface TaskActionsProps {
  task: Task;
  userRole: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
}

export const TaskActions: React.FC<TaskActionsProps> = ({
  task,
  userRole,
  onEditTask,
  onDeleteTask,
  onCompleteTask,
  onViewTask
}) => {
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const isCompleted = task.status === 'completed';
  
  return (
    <div className="flex space-x-1 mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewTask(task)}
        className="h-8 w-8 p-0"
        aria-label="View task details"
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      {!isCompleted && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCompleteTask(task)}
          className="h-8 w-8 p-0"
          aria-label="Mark task as complete"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
      
      {canEdit && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditTask(task)}
            className="h-8 w-8 p-0"
            aria-label="Edit task"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteTask(task)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};
```

### Step 5: Create Task Card Component

Extract the task card rendering logic:

**app/components/tasks/TaskGrid/TaskCard.tsx**
```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/types/tasks';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskActions } from './TaskActions';
import { formatTaskDate, isPastDue } from '@/utils/tasks/task-date.utils';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, CalendarClock, User } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  userRole: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  onToggleExpand,
  userRole,
  onEditTask,
  onDeleteTask,
  onCompleteTask,
  onViewTask
}) => {
  const pastDue = isPastDue(task.due_date);
  
  return (
    <Card className={cn(
      'mb-4 transition-all duration-200',
      pastDue && task.status !== 'completed' && 'border-red-500/50'
    )}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg font-medium line-clamp-1">
            {task.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
            <CalendarClock className="h-4 w-4" />
            <span className={cn(pastDue && task.status !== 'completed' && 'text-red-400')}>
              {formatTaskDate(task.due_date)}
            </span>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
          <button 
            onClick={onToggleExpand}
            className="p-1 rounded-full hover:bg-gray-800"
            aria-label={isExpanded ? "Collapse task" : "Expand task"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isExpanded ? (
          <div className="mt-2 space-y-2">
            <p className="text-gray-300 text-sm">
              {task.description || "No description provided."}
            </p>
            
            {task.assigned_to && (
              <div className="flex items-center text-sm text-gray-400">
                <User className="h-4 w-4 mr-2" />
                <span>Assigned to: {task.assigned_to}</span>
              </div>
            )}
            
            {task.recurring && (
              <div className="text-sm text-gray-400">
                <span>Recurring: {task.recurrence_frequency}</span>
                {task.recurrence_end_date && (
                  <span> until {formatTaskDate(task.recurrence_end_date)}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-300 text-sm line-clamp-1 mt-1">
            {task.description || "No description provided."}
          </p>
        )}
        
        <TaskActions
          task={task}
          userRole={userRole}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onCompleteTask={onCompleteTask}
          onViewTask={onViewTask}
        />
      </CardContent>
    </Card>
  );
};
```

### Step 6: Implement Main Component

Rewrite the main component to use the extracted subcomponents and utilities:

**app/components/tasks/TaskGrid/index.tsx**
```typescript
import React, { useState } from 'react';
import { Task } from '@/types/tasks';
import { TaskCard } from './TaskCard';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskGridProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  userRole: string;
  isLoading?: boolean;
}

const TaskGrid: React.FC<TaskGridProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onCompleteTask,
  onViewTask,
  userRole,
  isLoading = false,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-gray-700 rounded-lg">
        <p className="text-gray-400">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isExpanded={expandedTaskId === task.id}
          onToggleExpand={() => handleToggleExpand(task.id)}
          userRole={userRole}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onCompleteTask={onCompleteTask}
          onViewTask={onViewTask}
        />
      ))}
    </div>
  );
};

export default TaskGrid;
```

### Step 7: Update Original File

Temporarily update the original file to re-export from the new location:

**app/components/tasks/TaskGrid.tsx**
```typescript
import TaskGrid from './TaskGrid/index';
export default TaskGrid;
```

### Step 8: Testing

Test the refactored components to ensure all functionality works as expected:

1. Verify that tasks render correctly
2. Test expanding and collapsing task cards
3. Confirm that actions (edit, delete, complete, view) work properly
4. Validate status and priority badges display correctly
5. Check for any regressions in UI or behavior

### Step 9: Documentation

Update documentation to reflect the new component structure:

1. Update component JSDoc comments
2. Add README.md for the TaskGrid directory
3. Document complex logic or business rules
4. Provide usage examples

## Benefits of This Refactoring

1. **Improved Maintainability:** Each component has a clear, single responsibility
2. **Enhanced Reusability:** Badge components can be reused in other parts of the application
3. **Better Testability:** Smaller components are easier to test
4. **Reduced Cognitive Load:** Developers can focus on smaller pieces of logic
5. **Improved Performance:** Potential for more granular re-renders
6. **Modern Practices:** Integration with Shadcn UI components
7. **File Size Compliance:** Main component file is now under 200 lines

## Migration Path

To minimize disruption, this refactoring can be implemented incrementally:

1. First extract the utility functions
2. Create the badge components
3. Implement the TaskActions component
4. Create the TaskCard component
5. Update the main component
6. Add the re-export from the original location
7. Only when everything is stable, remove the original file

This ensures that other parts of the application that depend on this component continue to function during the refactoring process. 