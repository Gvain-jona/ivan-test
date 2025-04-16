'use client';

import React, { useState } from 'react';
import { PlusCircle, Search, CheckCircle2, Clock, Calendar, Tag, MoreHorizontal, CheckSquare, ArrowUpCircle, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import order types
import { Order, OrderStatus, ClientType, OrderItem, OrderNote, TaskPriority, TaskStatus } from '@/app/types/orders';

// Define types for our task card data
interface Task {
  id: string;
  orderNumber: string;
  clientName: string;
  clientType: ClientType;
  dueDate: string;
  productionStatus: OrderStatus;
  priority: TaskPriority;
  status: TaskStatus;
  items: {
    itemName: string; // Combination of item type, size, and category
    quantity: number;
  }[];
  notes?: string;
}

// Sample task data for development
const SAMPLE_TASKS: Task[] = [
  {
    id: 'TSK-001',
    orderNumber: 'ORD-2024-001',
    clientName: 'Acme Corporation',
    clientType: 'contract',
    dueDate: '2024-04-05',
    productionStatus: 'in_progress',
    priority: 'medium',
    status: 'in_progress',
    items: [
      { itemName: 'Business Cards - A5 - Premium', quantity: 500 },
      { itemName: 'Letterheads - A4 - Standard', quantity: 100 }
    ],
    notes: 'Client requested rush delivery. Needs to be ready by Thursday.'
  },
  {
    id: 'TSK-002',
    orderNumber: 'ORD-2024-015',
    clientName: 'TechStart Inc',
    clientType: 'regular',
    dueDate: '2024-04-02',
    productionStatus: 'paused',
    priority: 'high',
    status: 'in_progress',
    items: [
      { itemName: 'Brochures - A4 - Glossy', quantity: 250 },
      { itemName: 'Flyers - A5 - Matte', quantity: 1000 }
    ],
    notes: 'Waiting for client approval on final design. Follow up required.'
  },
  {
    id: 'TSK-003',
    orderNumber: 'ORD-2024-022',
    clientName: 'Local Retail Shop',
    clientType: 'regular',
    dueDate: '2024-04-10',
    productionStatus: 'pending',
    priority: 'low',
    status: 'pending',
    items: [
      { itemName: 'Posters - A2 - Glossy', quantity: 50 },
      { itemName: 'Price Tags - Small - Standard', quantity: 200 }
    ],
    notes: 'New client. First order needs special attention.'
  },
  {
    id: 'TSK-004',
    orderNumber: 'ORD-2024-030',
    clientName: 'Global Enterprises',
    clientType: 'contract',
    dueDate: '2024-04-15',
    productionStatus: 'printed',
    priority: 'medium',
    status: 'pending',
    items: [
      { itemName: 'Annual Reports - A4 - Premium', quantity: 100 },
      { itemName: 'Presentation Folders - Standard - Glossy', quantity: 75 }
    ],
    notes: 'Ready for delivery. Schedule pickup with client.'
  },
];

export default function TodoPage() {
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'in-progress', 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate metrics
  const totalTasks = SAMPLE_TASKS.length;
  const pendingTasks = SAMPLE_TASKS.filter(task => task.status === 'pending').length;
  const inProgressTasks = SAMPLE_TASKS.filter(task => task.status === 'in_progress').length;
  const completedTasks = SAMPLE_TASKS.filter(task => task.status === 'completed').length;

  // Filter tasks based on status and search query
  const filteredTasks = SAMPLE_TASKS.filter(task => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && task.status === 'pending') ||
      (filter === 'in-progress' && task.status === 'in_progress') ||
      (filter === 'completed' && task.status === 'completed');

    const matchesSearch =
      searchQuery === '' ||
      task.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });
  
  // Function to handle task card click - would update the right sidebar with order details
  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
    // Here you would implement the logic to update the right sidebar with order details
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and track order production tasks</p>
        </div>

        <Button size="sm" className="h-9">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Order Task
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-orange-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>All tasks</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-yellow-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>Waiting to start</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-blue-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>Currently working</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>Finished tasks</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex">
          <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
            <TabsList className="bg-transparent border border-border/40 rounded-lg p-1 w-full sm:w-auto">
              <TabsTrigger
                value="all"
                className="text-sm font-medium text-muted-foreground py-1.5 px-3 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="text-sm font-medium text-muted-foreground py-1.5 px-3 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                className="text-sm font-medium text-muted-foreground py-1.5 px-3 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="text-sm font-medium text-muted-foreground py-1.5 px-3 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-muted/10"
              >
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card className="bg-transparent border-border/40">
            <CardContent className="p-6 flex flex-col items-center justify-center py-8 text-center">
              <ListFilter className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground max-w-md">No tasks match your current filter criteria. Try changing your search or filter settings.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setFilter('all'); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <Card 
              key={task.id} 
              className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer"
              onClick={() => handleTaskClick(task)}
            >
              <CardContent className="p-4">
                {/* Production Status Badge at the top */}
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="outline" className={`
                    ${task.productionStatus === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                    ${task.productionStatus === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
                    ${task.productionStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
                    ${task.productionStatus === 'paused' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}
                    ${task.productionStatus === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                    ${task.productionStatus === 'printed' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : ''}
                    ${task.productionStatus === 'delivered' ? 'bg-teal-500/10 text-teal-500 border-teal-500/20' : ''}
                  `}>
                    {task.productionStatus.replace('_', ' ').charAt(0).toUpperCase() + task.productionStatus.replace('_', ' ').slice(1)}
                  </Badge>
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); }}>
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Task options</span>
                  </Button>
                </div>

                {/* Client Information */}
                <div className="mb-3">
                  <h3 className="font-medium text-foreground">{task.clientName}</h3>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="capitalize">{task.clientType.replace('_', ' ')} Client</span>
                  </div>
                </div>

                {/* Order Number and Due Date */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="font-medium">{task.orderNumber}</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar size={14} className="mr-1" />
                    <span>Due: {task.dueDate}</span>
                  </div>
                </div>

                {/* Item Breakdown */}
                <div className="mb-3 space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Items:</h4>
                  {task.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.itemName}</span>
                      <span className="font-medium">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Notes Section */}
                {task.notes && (
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Notes:</h4>
                    <p className="text-sm text-muted-foreground">{task.notes}</p>
                  </div>
                )}

                {/* Task Status and Priority */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className={task.priority === 'high'
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : task.priority === 'medium'
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      : task.priority === 'low'
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                  }>
                    Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>

                  <Badge variant="outline" className={task.status === 'completed'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : task.status === 'in_progress'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      : task.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }>
                    Status: {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}