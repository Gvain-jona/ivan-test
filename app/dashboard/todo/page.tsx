'use client';

import React, { useState } from 'react';
import { PlusCircle, Search, CheckCircle2, Clock, Calendar, Tag, MoreHorizontal, CheckSquare, ArrowUpCircle, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define types for our data
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  project?: string;
}

// Sample task data for development
const SAMPLE_TASKS: Task[] = [
  {
    id: 'TSK-001',
    title: 'Order business cards for new employee',
    description: 'Design and order business cards for John Smith',
    dueDate: '2024-04-05',
    priority: 'Medium',
    status: 'Pending',
    project: 'Admin Tasks'
  },
  {
    id: 'TSK-002',
    title: 'Call client about brochure changes',
    description: 'Follow up with TechStart Inc about requested brochure revisions',
    dueDate: '2024-04-02',
    priority: 'High',
    status: 'In Progress',
    project: 'Client Relations'
  },
  {
    id: 'TSK-003',
    title: 'Order more printer ink',
    description: 'Purchase cyan and magenta ink cartridges for the main printer',
    dueDate: '2024-04-10',
    priority: 'Low',
    status: 'Pending',
    project: 'Supplies'
  },
  {
    id: 'TSK-004',
    title: 'Schedule equipment maintenance',
    description: 'Book the quarterly maintenance for the printing press',
    dueDate: '2024-04-15',
    priority: 'Medium',
    status: 'Pending',
    project: 'Maintenance'
  },
];

export default function TodoPage() {
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'in-progress', 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate metrics
  const totalTasks = SAMPLE_TASKS.length;
  const pendingTasks = SAMPLE_TASKS.filter(task => task.status === 'Pending').length;
  const inProgressTasks = SAMPLE_TASKS.filter(task => task.status === 'In Progress').length;
  const completedTasks = SAMPLE_TASKS.filter(task => task.status === 'Completed').length;

  // Filter tasks based on status and search query
  const filteredTasks = SAMPLE_TASKS.filter(task => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && task.status === 'Pending') ||
      (filter === 'in-progress' && task.status === 'In Progress') ||
      (filter === 'completed' && task.status === 'Completed');

    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personal To-Do</h1>
          <p className="text-muted-foreground mt-1">Manage your personal tasks and projects</p>
        </div>

        <Button size="sm" className="h-9">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
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
            <Card key={task.id} className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`mt-1 rounded-full p-0.5 h-6 w-6 ${
                        task.status === 'Completed'
                          ? 'text-green-500 bg-green-500/10'
                          : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10'
                      }`}
                    >
                      <CheckCircle2 size={16} />
                      <span className="sr-only">Mark as complete</span>
                    </Button>

                    <div>
                      <h3 className={`font-medium ${
                        task.status === 'Completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar size={14} className="mr-1" />
                          <span>Due: {task.dueDate}</span>
                        </div>

                        <Badge variant="outline" className={task.priority === 'High'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : task.priority === 'Medium'
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }>
                          {task.priority}
                        </Badge>

                        {task.project && (
                          <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-muted/20">
                            {task.project}
                          </Badge>
                        )}

                        <Badge variant="outline" className={task.status === 'Completed'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : task.status === 'In Progress'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Task options</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}