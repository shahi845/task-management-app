import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { Task } from '../components/TaskCard';
import TaskCard from '../components/TaskCard';
import TaskModal, { type TaskFormValues } from '../components/TaskModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LayoutGrid, List, Plus, Search, FilterX } from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `/tasks?sort=${sortOrder}`;
      if (search) url += `&search=${search}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;

      const response = await api.get(url);
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, sortOrder]);

  const handleCreateOrUpdate = async (data: TaskFormValues) => {
    setSubmitting(true);
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, data);
      } else {
        await api.post('/tasks', data);
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (error) {
      console.error("Failed to save task", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        setTasks(tasks.filter(t => t.id !== id));
      } catch (error) {
        console.error("Failed to delete task", error);
      }
    }
  };

  const handleStatusChange = async (id: string, status: Task['status']) => {
    try {
      // Optimistic update
      setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
      await api.patch(`/tasks/${id}/status`, { status });
    } catch (error) {
      console.error("Failed to update status", error);
      fetchTasks(); // Revert on failure
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setSortOrder('newest');
  };

  // Kanban setup
  const kanbanColumns = [
    { id: 'TODO', title: 'To Do', color: 'border-l-4 border-l-secondary' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-l-4 border-l-info' },
    { id: 'COMPLETED', title: 'Completed', color: 'border-l-4 border-l-success' },
  ];

  return (
    <div className="space-y-6 flex flex-col h-full fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Tasks</h2>
          <p className="text-muted-foreground mt-1">Manage and track your projects.</p>
        </div>
        <Button onClick={openCreateModal} className="shrink-0 shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4 shrink-0">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks by title or description..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select 
              className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select 
              className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            <select 
              className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>

            {(search || statusFilter || priorityFilter || sortOrder !== 'newest') && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters" className="w-10 h-10">
                <FilterX className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}

            <div className="hidden sm:flex border rounded-md ml-auto overflow-hidden">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="rounded-none h-10 px-3"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="rounded-none h-10 px-3"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-xl animate-pulse"></div>
             ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-xl bg-card/50 text-center space-y-4">
             <div className="bg-primary/10 p-4 rounded-full">
               <Search className="w-8 h-8 text-primary" />
             </div>
             <div>
               <h3 className="text-xl font-bold">No tasks found</h3>
               <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                 We couldn't find any tasks matching your current filters. Try adjusting your search criteria or create a new task.
               </p>
             </div>
             <Button onClick={clearFilters} variant="outline" className="mt-4">Clear Filters</Button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-max">
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={openEditModal} 
                onDelete={handleDelete} 
                onStatusChange={handleStatusChange} 
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start">
            {kanbanColumns.map((column) => (
              <div key={column.id} className="min-w-[320px] w-[320px] shrink-0 bg-muted/40 rounded-xl p-4 flex flex-col h-full max-h-full">
                <h3 className={`font-semibold mb-4 px-2 text-sm uppercase tracking-wider ${column.color}`}>
                  {column.title} <span className="text-muted-foreground ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{tasks.filter(t => t.status === column.id).length}</span>
                </h3>
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  {tasks.filter(t => t.status === column.id).map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={openEditModal} 
                      onDelete={handleDelete} 
                      onStatusChange={handleStatusChange} 
                    />
                  ))}
                  {tasks.filter(t => t.status === column.id).length === 0 && (
                    <div className="text-center p-4 text-sm text-muted-foreground border-2 border-dashed rounded-xl border-muted-foreground/20">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateOrUpdate}
        initialData={editingTask}
        loading={submitting}
      />
    </div>
  );
};

export default Tasks;
