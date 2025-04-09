'use client';

import React from 'react';
import { PlusCircle, Filter } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import TaskGrid from '../../../components/tasks/TaskGrid';
import { useOrdersPage } from '../_context/OrdersPageContext';

/**
 * Tab content for the Tasks tab in the Orders page
 */
const TasksTab: React.FC = () => {
  const {
    filteredTasks,
    loading,
    userRole,
    handleCompleteTask
  } = useOrdersPage();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-800 bg-gray-900 hover:bg-gray-800">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <TaskGrid
        tasks={filteredTasks}
        isLoading={loading}
        onViewTask={(task) => console.log('View task', task)}
        onEditTask={(task) => console.log('Edit task', task)}
        onDeleteTask={(taskId) => console.log('Delete task', taskId)}
        onCompleteTask={handleCompleteTask}
        userRole={userRole}
      />
    </div>
  );
};

export default TasksTab;