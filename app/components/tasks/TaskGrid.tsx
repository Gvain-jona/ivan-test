import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/orders';
import { Edit, Trash, Check, Calendar, Link } from 'lucide-react';
import { formatDate, timeAgo } from '@/lib/utils';

interface TaskGridProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onViewTask?: (task: Task) => void;
  userRole: 'admin' | 'manager' | 'employee';
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

  const canEdit = userRole === 'admin' || userRole === 'manager';
  
  const getPriorityColor = (priority: string) => {
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
  
  const getStatusColor = (status: string) => {
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
  
  const getStatusText = (status: string) => {
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
  
  const isPastDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today && !due.toDateString().includes(today.toDateString());
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="bg-gray-900/50 border border-gray-800 shadow-md animate-pulse">
            <CardHeader className="h-24 bg-gray-800/50 rounded-t-lg"></CardHeader>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-800 rounded w-full mb-3"></div>
              <div className="h-3 bg-gray-800 rounded w-5/6 mb-3"></div>
              <div className="h-3 bg-gray-800 rounded w-2/3"></div>
            </CardContent>
            <CardFooter className="p-4 h-16 bg-gray-900/70 rounded-b-lg"></CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-lg border border-dashed border-gray-800 bg-gray-950">
        <h3 className="text-xl font-medium text-gray-300 mb-2">No tasks found</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          There are no tasks matching your current filters or search criteria. Try adjusting your filters or create a new task.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <Card 
          key={task.id} 
          className={`bg-gray-950 border border-gray-800 shadow-md hover:border-gray-700 transition-all ${
            task.status === 'completed' ? 'opacity-80' : ''
          }`}
        >
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between items-start gap-2">
            <div>
              <h3 
                className={`font-medium text-gray-100 line-clamp-1 ${
                  isPastDue(task.due_date) && task.status !== 'completed' 
                    ? 'text-red-400' 
                    : ''
                }`}
              >
                {task.title}
              </h3>
              {task.recurring && (
                <div className="text-xs text-gray-400 flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  Recurring {task.recurrence_frequency}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Badge 
                variant="outline" 
                className={`${getPriorityColor(task.priority)} text-xs`}
              >
                {task.priority}
              </Badge>
              <Badge 
                variant="outline" 
                className={`${getStatusColor(task.status)} text-xs`}
              >
                {getStatusText(task.status)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="px-4 py-2" onClick={() => onViewTask && onViewTask(task)}>
            <p className={`text-sm text-gray-400 ${
              expandedTaskId === task.id 
                ? '' 
                : 'line-clamp-2'
            }`}>
              {task.description || 'No description provided'}
            </p>
            {task.description && task.description.length > 80 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedTaskId(expandedTaskId === task.id ? null : task.id);
                }}
                className="text-xs text-orange-500 hover:text-orange-400 mt-1"
              >
                {expandedTaskId === task.id ? 'Show less' : 'Show more'}
              </button>
            )}
            
            <div className="mt-3 text-sm">
              <div className="flex items-center text-gray-300 mb-1">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <div className="flex flex-col">
                  <span className={`${
                    isPastDue(task.due_date) && task.status !== 'completed' 
                      ? 'text-red-400' 
                      : 'text-gray-400'
                  }`}>
                    {formatDate(task.due_date)}
                  </span>
                  {isPastDue(task.due_date) && task.status !== 'completed' && (
                    <span className="text-xs text-red-500">
                      Due {timeAgo(task.due_date)} ago
                    </span>
                  )}
                </div>
              </div>
              
              {task.assigned_to && (
                <div className="flex items-center text-gray-400 text-xs">
                  <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                    Assigned to: Alex Johnson
                  </span>
                </div>
              )}
              
              {task.linked_item_id && task.linked_item_type === 'order' && (
                <div className="flex items-center text-gray-400 text-xs mt-1">
                  <Link className="h-3 w-3 mr-1" />
                  Linked to order #{task.linked_item_id.slice(0, 8)}
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="px-4 py-3 border-t border-gray-800 justify-between">
            <div className="flex space-x-2">
              {task.status !== 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 border-green-800 hover:bg-green-900/50 text-green-500"
                  onClick={() => onCompleteTask(task.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              
              {canEdit && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 border-gray-700 hover:bg-gray-800 text-gray-400"
                    onClick={() => onEditTask(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 border-red-900 hover:bg-red-900/50 text-red-500"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {task.created_at && (
              <div className="text-xs text-gray-500">
                Created {timeAgo(task.created_at)}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default TaskGrid; 