import React from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { 
  CalendarIcon, ClipboardList, Link, Clock, 
  CheckCircle2, Edit, Trash, AlertCircle 
} from 'lucide-react';
import { formatDate, timeAgo } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  userRole: 'admin' | 'manager' | 'employee';
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onComplete: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  userRole,
  onView,
  onEdit,
  onDelete,
  onComplete,
}) => {
  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      case 'in_progress':
        return 'text-orange-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatPriority = (priority: TaskPriority): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatStatus = (status: TaskStatus): string => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isActionsDisabled = task.status === 'completed' || task.status === 'cancelled';
  const canModify = userRole === 'admin' || userRole === 'manager' || 
                     (userRole === 'employee' && task.assigned_to === 'user1'); // Assuming 'user1' is current user

  return (
    <Card className="bg-gray-900 border-gray-800 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2 flex flex-row justify-between">
        <div className="flex items-start gap-2">
          <div className={`mt-1 ${getPriorityColor(task.priority)}`}>
            <AlertCircle size={16} />
          </div>
          <div>
            <h3 className="text-base font-medium text-white line-clamp-1">{task.title}</h3>
            <p className="text-xs text-gray-400">
              Assigned to: <span className="text-gray-300">{task.assigned_to_name || 'Unknown'}</span>
            </p>
          </div>
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(task.status)} bg-gray-800`}>
          {formatStatus(task.status)}
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">{task.description || 'No description provided.'}</p>
        
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <CalendarIcon size={14} />
            <span>Due: <span className="text-white">{formatDate(task.due_date)}</span></span>
          </div>
          
          {task.linked_order_number && (
            <div className="flex items-center gap-2 text-gray-400">
              <Link size={14} />
              <span>Order: <span className="text-white">{task.linked_order_number}</span></span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={14} />
            <span>Created: <span className="text-white">{timeAgo(task.created_at)}</span></span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <ClipboardList size={14} />
            <span>Priority: <span className={`${getPriorityColor(task.priority)}`}>{formatPriority(task.priority)}</span></span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t border-gray-800 gap-2 flex-wrap">
        {task.status !== 'completed' && canModify && (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-green-700 text-green-500 hover:bg-green-900 hover:text-green-400"
            onClick={() => onComplete(task)}
          >
            <CheckCircle2 size={14} className="mr-1" />
            Complete
          </Button>
        )}
        
        {canModify && (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-gray-700 text-gray-400 hover:bg-gray-800"
            onClick={() => onEdit(task)}
            disabled={isActionsDisabled}
          >
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
        )}
        
        {(userRole === 'admin' || userRole === 'manager') && (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-red-400"
            onClick={() => onDelete(task)}
          >
            <Trash size={14} className="mr-1" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TaskCard; 