import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Task, TaskPriority, TaskStatus } from '@/types/orders';
import { CalendarIcon, Save, Ban, Link } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => void;
  initialTask?: Task;
  title: string;
  isEditing: boolean;
  userRole: 'admin' | 'manager' | 'employee';
  linkedOrders?: { id: string, display: string }[];
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialTask,
  title,
  isEditing,
  userRole,
  linkedOrders = [],
}) => {
  // Basic form state - in a real app, you'd use something like react-hook-form
  const [task, setTask] = useState<Partial<Task>>(initialTask || {
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    status: 'pending',
    recurring: false,
    assigned_to: '',
  });
  
  const [showRecurringOptions, setShowRecurringOptions] = useState(
    initialTask?.recurring || false
  );
  
  const isManager = userRole === 'admin' || userRole === 'manager';
  
  const handleSave = () => {
    // Here you would validate the form before saving
    console.log('Saving task:', task);
    onSave(task as Task);
    onOpenChange(false);
  };
  
  const handleDueDateSelect = (date: Date | undefined) => {
    if (date) {
      setTask({
        ...task,
        due_date: date.toISOString().split('T')[0]
      });
    }
  };
  
  const handleRecurringEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setTask({
        ...task,
        recurrence_end_date: date.toISOString().split('T')[0]
      });
    }
  };
  
  const handleToggleRecurring = (checked: boolean) => {
    setShowRecurringOptions(checked);
    setTask({
      ...task,
      recurring: checked,
      recurrence_frequency: checked ? task.recurrence_frequency || 'weekly' : undefined,
      recurrence_end_date: checked ? task.recurrence_end_date : undefined
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-950 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={task.title || ''}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              placeholder="Enter task title"
              className="bg-gray-900 border-gray-800 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={task.description || ''}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              placeholder="Enter task description"
              className="bg-gray-900 border-gray-800 mt-1 min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-300 mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {task.due_date ? formatDate(task.due_date) : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-950 border-gray-800">
                  <Calendar
                    mode="single"
                    selected={task.due_date ? new Date(task.due_date) : undefined}
                    onSelect={handleDueDateSelect}
                    initialFocus
                    className="rounded-md border border-gray-800"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={task.priority || 'medium'}
                onValueChange={(value) => setTask({ ...task, priority: value as TaskPriority })}
              >
                <SelectTrigger id="priority" className="bg-gray-900 border-gray-800 mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-gray-800">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {isManager && (
              <div>
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select
                  value={task.assigned_to || ''}
                  onValueChange={(value) => setTask({ ...task, assigned_to: value })}
                >
                  <SelectTrigger id="assigned_to" className="bg-gray-900 border-gray-800 mt-1">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-800">
                    <SelectItem value="user1">Alex Johnson</SelectItem>
                    <SelectItem value="user2">Sarah Williams</SelectItem>
                    <SelectItem value="user3">Mike Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={task.status || 'pending'}
                onValueChange={(value) => setTask({ ...task, status: value as TaskStatus })}
              >
                <SelectTrigger id="status" className="bg-gray-900 border-gray-800 mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-gray-800">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="linked_order">Linked Order</Label>
            <Select
              value={task.linked_item_id || ''}
              onValueChange={(value) => setTask({
                ...task,
                linked_item_id: value || undefined,
                linked_item_type: value ? 'order' : undefined
              })}
            >
              <SelectTrigger 
                id="linked_order" 
                className="bg-gray-900 border-gray-800 mt-1"
                icon={<Link className="h-4 w-4" />}
              >
                <SelectValue placeholder="Link to an order (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800">
                <SelectItem value="">None</SelectItem>
                {linkedOrders.map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="recurring">Recurring Task</Label>
              <div className="text-xs text-gray-400">
                Set if this task repeats regularly
              </div>
            </div>
            <Switch
              id="recurring"
              checked={showRecurringOptions}
              onCheckedChange={handleToggleRecurring}
            />
          </div>
          
          {showRecurringOptions && (
            <div className="grid grid-cols-2 gap-4 bg-gray-900/50 p-3 rounded-md border border-gray-800">
              <div>
                <Label htmlFor="recurrence_frequency">Frequency</Label>
                <Select
                  value={task.recurrence_frequency || 'weekly'}
                  onValueChange={(value) => setTask({ ...task, recurrence_frequency: value })}
                >
                  <SelectTrigger id="recurrence_frequency" className="bg-gray-900 border-gray-800 mt-1">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-800">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="recurrence_end_date">End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-300 mt-1"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {task.recurrence_end_date ? formatDate(task.recurrence_end_date) : 'No end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-950 border-gray-800">
                    <Calendar
                      mode="single"
                      selected={task.recurrence_end_date ? new Date(task.recurrence_end_date) : undefined}
                      onSelect={handleRecurringEndDateSelect}
                      initialFocus
                      className="rounded-md border border-gray-800"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={() => onOpenChange(false)}
          >
            <Ban className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={handleSave}
          >
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormModal; 