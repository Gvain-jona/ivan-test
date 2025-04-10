import { useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, CreateTaskPayload, UpdateTaskPayload } from '@/types/tasks';

interface UseTaskFormProps {
  initialTask?: Partial<Task>;
}

interface UseTaskFormReturn {
  task: Partial<Task>;
  updateTaskField: <K extends keyof Task>(field: K, value: Task[K]) => void;
  updateTaskFields: (fields: Partial<Task>) => void;
  resetTask: () => void;
  isDirty: boolean;
  isValid: boolean;
  createPayload: () => CreateTaskPayload;
  updatePayload: () => UpdateTaskPayload;
}

/**
 * Custom hook for managing task form state
 */
export const useTaskForm = ({ initialTask }: UseTaskFormProps = {}): UseTaskFormReturn => {
  const defaultTask: Partial<Task> = {
    title: '',
    description: '',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    due_date: new Date().toISOString().substring(0, 10),
    recurring: false,
  };

  const [task, setTask] = useState<Partial<Task>>(initialTask || defaultTask);
  const [initialFormState] = useState<Partial<Task>>(initialTask || defaultTask);
  const [isValid, setIsValid] = useState<boolean>(false);
  
  // Update a single field in the task
  const updateTaskField = useCallback(<K extends keyof Task>(field: K, value: Task[K]) => {
    setTask(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Update multiple fields at once
  const updateTaskFields = useCallback((fields: Partial<Task>) => {
    setTask(prev => ({ ...prev, ...fields }));
  }, []);
  
  // Reset form to initial state
  const resetTask = useCallback(() => {
    setTask(initialFormState);
  }, [initialFormState]);
  
  // Check if form has been modified from initial state
  const isDirty = JSON.stringify(task) !== JSON.stringify(initialFormState);
  
  // Validate form fields
  useEffect(() => {
    const valid = !!(
      task.title &&
      task.title.trim() !== '' &&
      task.status &&
      task.priority &&
      task.due_date
    );
    
    setIsValid(valid);
  }, [task]);
  
  // Create a payload for creating a new task
  const createPayload = useCallback((): CreateTaskPayload => {
    return {
      title: task.title || '',
      description: task.description,
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      due_date: task.due_date || new Date().toISOString().substring(0, 10),
      assigned_to: task.assigned_to,
      order_id: task.order_id,
      recurring: task.recurring || false,
      recurrence_frequency: task.recurring ? task.recurrence_frequency : undefined,
      recurrence_end_date: task.recurring ? task.recurrence_end_date : undefined,
    };
  }, [task]);
  
  // Create a payload for updating an existing task
  const updatePayload = useCallback((): UpdateTaskPayload => {
    if (!task.id) throw new Error('Task ID is required for update payload');
    
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      assigned_to: task.assigned_to,
      order_id: task.order_id,
      recurring: task.recurring,
      recurrence_frequency: task.recurring ? task.recurrence_frequency : undefined,
      recurrence_end_date: task.recurring ? task.recurrence_end_date : undefined,
    };
  }, [task]);
  
  return {
    task,
    updateTaskField,
    updateTaskFields,
    resetTask,
    isDirty,
    isValid,
    createPayload,
    updatePayload,
  };
};

export default useTaskForm; 