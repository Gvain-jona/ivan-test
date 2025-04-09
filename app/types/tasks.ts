export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskRecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface TaskUser {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  assigned_to?: string;
  assigned_user?: TaskUser;
  created_at: string;
  updated_at: string;
  order_id?: string;
  recurring?: boolean;
  recurrence_frequency?: TaskRecurrenceFrequency;
  recurrence_end_date?: string;
  completed_at?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  assigned_to?: string;
  order_id?: string;
  recurring?: boolean;
  recurrence_frequency?: TaskRecurrenceFrequency;
  recurrence_end_date?: string;
}

export interface UpdateTaskPayload {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  order_id?: string;
  recurring?: boolean;
  recurrence_frequency?: TaskRecurrenceFrequency;
  recurrence_end_date?: string;
}

export interface CompleteTaskPayload {
  id: string;
  completed_at: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  due_date_start?: string;
  due_date_end?: string;
  search?: string;
}

export interface TasksState {
  tasks: Task[];
  filteredTasks: Task[];
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;
}

export interface TasksContextType {
  state: TasksState;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
} 