import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CheckCircle2, Circle, Clock, ListTodo, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  highPriority: number;
  overdue: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    highPriority: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/tasks');
        if (response.data.success) {
          const tasks = response.data.data;
          const now = new Date();
          
          let completed = 0;
          let inProgress = 0;
          let todo = 0;
          let highPriority = 0;
          let overdue = 0;

          tasks.forEach((task: any) => {
            if (task.status === 'COMPLETED') completed++;
            else if (task.status === 'IN_PROGRESS') inProgress++;
            else todo++;

            if (task.priority === 'HIGH' && task.status !== 'COMPLETED') highPriority++;
            
            if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'COMPLETED') {
              overdue++;
            }
          });

          setStats({
            total: tasks.length,
            completed,
            inProgress,
            todo,
            highPriority,
            overdue
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
             <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}! Here's your task overview.</p>
        </div>
        <Link to="/tasks">
          <Button>View All Tasks</Button>
        </Link>
      </div>

      {stats.total === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <ListTodo className="w-12 h-12 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">No tasks yet</h3>
              <p className="text-muted-foreground mt-1">Create your first task to get started.</p>
            </div>
            <Link to="/tasks">
              <Button>Create Task</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Overview */}
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">Overall Progress</h3>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{stats.completed} of {stats.total} tasks completed</span>
                    <span className="font-bold">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                  <div className="bg-background rounded-lg border p-4 flex-1 md:w-32 text-center shadow-sm">
                    <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Overdue</div>
                  </div>
                  <div className="bg-background rounded-lg border p-4 flex-1 md:w-32 text-center shadow-sm">
                    <div className="text-2xl font-bold text-orange-500">{stats.highPriority}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">High Prio</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending (To Do)</CardTitle>
                <Circle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todo}</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
