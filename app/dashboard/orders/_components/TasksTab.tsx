'use client';

import React, { useState } from 'react';
import { Clock, Link, CheckCircle, AlertCircle, MapPin, ChevronLeft, ChevronRight, Filter, X, Percent, DollarSign } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import TablePagination from '../../../components/ui/table/TablePagination';
import { useOrdersPage } from '../_context/OrdersPageContext';
import { useOrdersData } from '@/hooks/useOrdersData';
import { Task } from '@/types/orders';
import { cn } from '@/lib/utils';

/**
 * Tab content for the Tasks tab in the Orders page
 */
const TasksTab: React.FC = () => {
  const {
    filteredTasks,
    loading: contextLoading,
    userRole,
    handleCompleteTask,
    taskFilters,
    handleTaskFilterChange
  } = useOrdersPage();

  // Get loading state from the orders hook directly
  const { isLoading: ordersLoading } = useOrdersData();

  // Combined loading state - show skeleton if either context loading or SWR loading is true
  const loading = contextLoading || ordersLoading;

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Filter tasks based on sidebar selection
  const getFilteredTasks = () => {
    if (activeFilter === 'all') return filteredTasks;
    if (activeFilter === 'pending') return filteredTasks.filter(task => task.status === 'pending');
    if (activeFilter === 'in_progress') return filteredTasks.filter(task => task.status === 'in_progress');
    if (activeFilter === 'completed') return filteredTasks.filter(task => task.status === 'completed');
    if (activeFilter === 'high_priority') return filteredTasks.filter(task => task.priority === 'high' || task.priority === 'urgent');
    return filteredTasks;
  };

  const allFilteredTasks = getFilteredTasks();

  // Pagination logic
  const totalPages = Math.ceil(allFilteredTasks.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedTasks = allFilteredTasks.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of task list
    const taskListElement = document.getElementById('task-list-container');
    if (taskListElement) {
      taskListElement.scrollTop = 0;
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Helper functions for UI
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-blue-500 dark:text-blue-400';
      case 'medium':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'high':
        return 'text-orange-500 dark:text-orange-400';
      case 'urgent':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-800';
      case 'paused':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-800';
      case 'printed':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 border-purple-300 dark:border-purple-800';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-300 dark:border-green-800';
      case 'delivered':
        return 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-400 border-teal-300 dark:border-teal-800';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-300 dark:border-red-800';
      default:
        return 'bg-background dark:bg-muted text-foreground dark:text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'paused':
        return 'Paused';
      case 'printed':
        return 'Printed';
      case 'completed':
        return 'Completed';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isPastDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return now > due;
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} years ago`;
    if (interval === 1) return `1 year ago`;

    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} months ago`;
    if (interval === 1) return `1 month ago`;

    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} days ago`;
    if (interval === 1) return `1 day ago`;

    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} hours ago`;
    if (interval === 1) return `1 hour ago`;

    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutes ago`;
    if (interval === 1) return `1 minute ago`;

    return `${Math.floor(seconds)} seconds ago`;
  };

  // Function to get order items for a task
  const getOrderItems = (taskId: string) => {
    // This would be replaced with a real API call in the future
    return [];
  };

  // Function to get notes for a task
  const getTaskNotes = (taskId: string) => {
    // This would be replaced with a real API call in the future
    return [];
  };

  // Calculate total price of items
  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Pagination at the top */}
      <div className="flex justify-between items-center mb-4 px-4 flex-shrink-0">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="mr-2"
          >
            {showFilters ? <X className="h-4 w-4 mr-1" /> : <Filter className="h-4 w-4 mr-1" />}
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={allFilteredTasks.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[4, 8, 12, 16, 24]}
          className="flex-shrink-0"
        />
      </div>

      {/* Main content area with flex layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Filters - Always full height */}
        <div className={cn(
          "border-r border-border h-full flex-shrink-0 transition-all duration-300",
          showFilters ? "w-56" : "w-0 opacity-0"
        )}>
          {showFilters && (
            <div className="p-4 h-full overflow-y-auto">
              <h3 className="text-lg font-medium mb-4 text-foreground sticky top-0 bg-background pt-1 pb-2 z-10">Filters</h3>
              <div className="space-y-1">
                <Button
                  variant={activeFilter === 'all' ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveFilter('all')}
                >
                  All Tasks
                  <Badge className="ml-auto bg-muted text-muted-foreground">{filteredTasks.length}</Badge>
                </Button>
                <Button
                  variant={activeFilter === 'pending' ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveFilter('pending')}
                >
                  Pending
                  <Badge className="ml-auto bg-muted text-muted-foreground">
                    {filteredTasks.filter(t => t.status === 'pending').length}
                  </Badge>
                </Button>
                <Button
                  variant={activeFilter === 'in_progress' ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveFilter('in_progress')}
                >
                  In Progress
                  <Badge className="ml-auto bg-muted text-muted-foreground">
                    {filteredTasks.filter(t => t.status === 'in_progress').length}
                  </Badge>
                </Button>
                <Button
                  variant={activeFilter === 'completed' ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveFilter('completed')}
                >
                  Completed
                  <Badge className="ml-auto bg-muted text-muted-foreground">
                    {filteredTasks.filter(t => t.status === 'completed').length}
                  </Badge>
                </Button>
                <Separator className="my-2" />
                <Button
                  variant={activeFilter === 'high_priority' ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveFilter('high_priority')}
                >
                  High Priority
                  <Badge className="ml-auto bg-muted text-muted-foreground">
                    {filteredTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length}
                  </Badge>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Middle Section - Task Cards */}
        <div id="task-list-container" className="flex-1 px-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {loading && filteredTasks.length === 0 ? (
              // Loading skeletons - only show if we don't have any data yet
              Array(6).fill(0).map((_, index) => (
                <Card key={index} className="bg-card border-border shadow-sm animate-pulse h-[240px]">
                  <CardHeader className="h-16 bg-muted rounded-t-lg"></CardHeader>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-3"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </CardContent>
                </Card>
              ))
            ) : displayedTasks.length === 0 ? (
              <div className="col-span-full text-center py-8 px-4 rounded-lg border border-dashed border-border bg-card">
                <h3 className="text-xl font-medium text-foreground mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  There are no tasks matching your current filters.
                </p>
              </div>
            ) : (
              displayedTasks.map((task) => {
                const orderItems = getOrderItems(task.id);
                const total = calculateTotal(orderItems);

                return (
                  <Card
                    key={task.id}
                    className={cn(
                      "bg-card border-border rounded-lg shadow-sm transition-all cursor-pointer h-auto",
                      selectedTask?.id === task.id ? "ring-2 ring-primary border-primary" : "",
                      "hover:shadow-lg hover:border-primary/50 hover:bg-card/80 active:scale-[0.99] active:shadow-sm"
                    )}
                    onClick={() => setSelectedTask(task)}
                  >
                    {/* Production Status at the top */}
                    <CardHeader className="p-3 pb-2">
                      <div className="flex justify-between items-center">
                        <Badge className={`${getStatusColor(task.status)} px-3 py-1 font-medium text-xs rounded-md transition-colors`}>
                          {getStatusText(task.status)}
                        </Badge>
                        <Badge className={`${getPriorityColor(task.priority)} bg-opacity-10 border px-3 py-1 font-medium text-xs rounded-md`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <Separator />

                    {/* Client Information */}
                    <CardContent className="p-3 pb-2">
                      <div className="flex flex-col">
                        <h3 className="text-base font-semibold text-foreground">{task.assigned_to_name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {task.linked_item_type === 'order' ? 'Regular Client' : 'Contract Client'}
                        </p>
                      </div>
                    </CardContent>

                    <Separator />

                    {/* Order Number and Due Date Section */}
                    <CardContent className="p-3 pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-foreground">{task.linked_order_number || `Order-${task.id.substring(0, 6)}`}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(task.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </CardContent>

                    <Separator />

                    {/* Item Breakdown */}
                    <CardContent className="px-3 py-2">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Items:</h4>
                      <div className="space-y-1">
                        {orderItems.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.type}.{item.category}.{item.size}</span>
                            <span className="text-foreground font-medium">{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>

                    {/* Notes Section */}
                    <Separator />

                    <CardContent className="px-3 py-2">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Notes:</h4>
                      {getTaskNotes(task.id).length > 0 ? (
                        <div className="space-y-2">
                          {getTaskNotes(task.id).map((note, index) => (
                            <div key={index} className="text-xs">
                              <span className="inline-block px-1.5 py-0.5 rounded text-xs capitalize mr-1.5 bg-muted text-muted-foreground">
                                {note.type.replace('_', ' ')}
                              </span>
                              <span className="text-muted-foreground">{note.text}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {task.description || 'No notes available for this order.'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar - Task Details - Always full height */}
        <div className="w-80 border-l border-border h-full flex-shrink-0 bg-[#1A1A1A] rounded-tr-xl rounded-br-xl">
          <div className="p-4 h-full overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-white sticky top-0 bg-[#1A1A1A] pt-1 pb-2 z-10">
              {selectedTask ? 'Order Details' : 'Order Metrics'}
            </h3>
            {selectedTask ? (
              <div className="space-y-4">
                {/* Order Tracking Section */}
                <div className="bg-[#242424] rounded-lg p-4 border border-[#333333]">
                  <h4 className="text-sm font-medium text-white mb-2">Order Tracking</h4>
                  <div className="text-sm mb-3">
                    <p className="text-gray-400">This Order is Ready to Ship! Please click the to ship button.</p>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Button variant="destructive" size="sm" className="flex-1 py-1 h-auto">Reject</Button>
                    <Button variant="outline" size="sm" className="flex-1 py-1 h-auto bg-green-100 text-green-800 border-green-300 hover:bg-green-200">To Ship?</Button>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Placed</p>
                      <p className="text-[10px] text-muted-foreground">12:30 PM</p>
                    </div>
                    <div className="h-0.5 flex-1 bg-green-500"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Packaging</p>
                      <p className="text-[10px] text-muted-foreground">12:40 PM</p>
                    </div>
                    <div className="h-0.5 flex-1 bg-muted"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                        <Clock className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">To Ship</p>
                      <p className="text-[10px] text-muted-foreground">-</p>
                    </div>
                    <div className="h-0.5 flex-1 bg-muted"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Received</p>
                      <p className="text-[10px] text-muted-foreground">-</p>
                    </div>
                  </div>
                </div>

                {/* Order Summary Section */}
                <div className="bg-[#242424] rounded-lg p-4 border border-[#333333]">
                  <h4 className="text-sm font-medium text-white mb-3">Order Summary</h4>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-gray-400">Discount (%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value="10"
                          className="w-12 h-7 text-right bg-[#1A1A1A] border border-[#333333] rounded px-2 text-sm text-white"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-gray-400">Amount</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-400">$</span>
                        <input
                          type="text"
                          value="130"
                          className="w-12 h-7 text-right bg-[#1A1A1A] border border-[#333333] rounded px-2 text-sm text-white"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-gray-400">Vat/Tax (%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value="08"
                          className="w-12 h-7 text-right bg-[#1A1A1A] border border-[#333333] rounded px-2 text-sm text-white"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-gray-400">Amount</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-400">$</span>
                        <input
                          type="text"
                          value="90"
                          className="w-12 h-7 text-right bg-[#1A1A1A] border border-[#333333] rounded px-2 text-sm text-white"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">Total</span>
                      <span className="text-sm font-medium text-white">$1300</span>
                    </div>

                    <div className="flex justify-between items-center text-red-500">
                      <span className="text-sm">Promo Code (0000)</span>
                      <span className="text-sm">-$100</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">Due</span>
                      <span className="text-sm font-medium text-white">$1200</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-white">Subtotal</span>
                      <span className="text-sm font-semibold text-white">$1200</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-3 border-green-500 text-green-600 hover:bg-green-50"
                  >
                    Receive Amount
                  </Button>
                </div>

                {/* Delivery Section */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 12H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Send to Delivery Company</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="border border-green-500 rounded-md p-2 flex items-center justify-center">
                    <span className="text-green-500 font-medium text-xs">REDX</span>
                  </div>
                  <div className="border border-border rounded-md p-2 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Option 2</span>
                  </div>
                  <div className="border border-border rounded-md p-2 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Option 3</span>
                  </div>
                  <div className="border border-border rounded-md p-2 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Option 4</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  Send to Delivery
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Order Summary Metrics */}
                <div className="bg-[#242424] rounded-lg p-4 border border-[#333333]">
                  <h4 className="text-sm font-medium text-white mb-3">Order Summary</h4>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#333333]">
                      <div className="text-2xl font-bold text-white">{filteredTasks.length}</div>
                      <div className="text-xs text-gray-400">Total Orders</div>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#333333]">
                      <div className="text-2xl font-bold text-green-500">
                        {filteredTasks.filter(t => t.status === 'completed').length}
                      </div>
                      <div className="text-xs text-gray-400">Completed</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Pending</span>
                      <span className="text-sm text-white">
                        {filteredTasks.filter(t => t.status === 'pending').length} orders
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">In Progress</span>
                      <span className="text-sm text-white">
                        {filteredTasks.filter(t => t.status === 'in_progress').length} orders
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">High Priority</span>
                      <span className="text-sm text-white">
                        {filteredTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length} orders
                      </span>
                    </div>
                  </div>
                </div>

                {/* Due Today Section */}
                <div className="bg-[#242424] rounded-lg p-4 border border-[#333333]">
                  <h4 className="text-sm font-medium text-white mb-3">Due Today</h4>

                  <div className="space-y-3">
                    {(() => {
                      // Get today's date at midnight for comparison
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      // Get tomorrow's date at midnight
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);

                      // Filter tasks due today
                      const dueTodayTasks = filteredTasks.filter(task => {
                        const dueDate = new Date(task.due_date);
                        dueDate.setHours(0, 0, 0, 0);
                        return dueDate.getTime() === today.getTime();
                      });

                      if (dueTodayTasks.length === 0) {
                        return (
                          <div className="text-center py-3 bg-[#1A1A1A] rounded-lg border border-[#333333]">
                            <p className="text-sm text-gray-400">No orders due today</p>
                          </div>
                        );
                      }

                      return dueTodayTasks.slice(0, 3).map((task, index) => (
                        <div
                          key={index}
                          className="bg-[#1A1A1A] rounded-lg p-3 border border-[#333333] cursor-pointer hover:border-gray-500 transition-colors"
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium text-sm text-white">{task.assigned_to_name}</div>
                            <div className="text-xs text-gray-400">{formatTime(task.due_date)}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-400">Order #{task.id.substring(0, 6)}</div>
                            <div className={`px-2 py-0.5 text-xs rounded-full ${task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-[#242424] rounded-lg p-4 border border-[#333333]">
                  <h4 className="text-sm font-medium text-white mb-3">Category Breakdown</h4>

                  <div className="space-y-3">
                    {/* Simulate category breakdown with mock data */}
                    <div className="relative pt-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Food Items</span>
                        <span className="text-xs text-white">65%</span>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-[#1A1A1A]">
                        <div style={{ width: "65%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                      </div>
                    </div>

                    <div className="relative pt-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Beverages</span>
                        <span className="text-xs text-white">25%</span>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-[#1A1A1A]">
                        <div style={{ width: "25%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                      </div>
                    </div>

                    <div className="relative pt-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Desserts</span>
                        <span className="text-xs text-white">10%</span>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-[#1A1A1A]">
                        <div style={{ width: "10%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Orders */}
                <div className="bg-[#242424] rounded-lg p-4 border border-[#333333]">
                  <h4 className="text-sm font-medium text-white mb-3">Upcoming Due Dates</h4>

                  <div className="space-y-2">
                    {(() => {
                      // Get today's date at midnight for comparison
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      // Get future tasks (not including today)
                      const upcomingTasks = filteredTasks
                        .filter(task => {
                          const dueDate = new Date(task.due_date);
                          dueDate.setHours(0, 0, 0, 0);
                          return dueDate.getTime() > today.getTime();
                        })
                        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

                      if (upcomingTasks.length === 0) {
                        return (
                          <div className="text-center py-2">
                            <p className="text-sm text-gray-400">No upcoming orders</p>
                          </div>
                        );
                      }

                      // Group tasks by due date
                      const groupedByDate = upcomingTasks.reduce((acc, task) => {
                        const dueDate = new Date(task.due_date);
                        dueDate.setHours(0, 0, 0, 0);
                        const dateStr = dueDate.toISOString().split('T')[0];

                        if (!acc[dateStr]) {
                          acc[dateStr] = [];
                        }
                        acc[dateStr].push(task);
                        return acc;
                      }, {});

                      // Get the first 3 dates
                      return Object.entries(groupedByDate).slice(0, 3).map(([dateStr, tasks]) => {
                        const date = new Date(dateStr);
                        const formattedDate = date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        });

                        return (
                          <div key={dateStr} className="flex justify-between items-center py-2 border-b border-[#333333] last:border-0">
                            <div className="text-sm text-white">{formattedDate}</div>
                            <div className="text-sm text-gray-400">{(tasks as Task[]).length} orders</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksTab;