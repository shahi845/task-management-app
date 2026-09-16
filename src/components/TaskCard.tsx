import { format } from 'date-fns';
import { Badge } from './ui/Badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Calendar, Edit, Trash } from 'lucide-react';
import { Button } from './ui/Button';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  const statusColors = {
    TODO: 'secondary',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
  } as const;

  const priorityColors = {
    LOW: 'secondary',
    MEDIUM: 'warning',
    HIGH: 'destructive',
  } as const;

  return (
    <Card className={`relative group transition-all hover:shadow-md ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className={`text-base leading-tight ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </CardTitle>
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onEdit(task)}>
               <Edit className="w-3.5 h-3.5" />
             </Button>
             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task.id)}>
               <Trash className="w-3.5 h-3.5" />
             </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant={statusColors[task.status] as any} className="text-[10px]">
            {task.status.replace('_', ' ')}
          </Badge>
          <Badge variant={priorityColors[task.priority] as any} className="text-[10px]">
            {task.priority} Priority
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5" title="Due Date">
          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-destructive' : ''}`} />
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
          </span>
        </div>
        
        {task.status !== 'COMPLETED' ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs" 
            onClick={() => onStatusChange(task.id, 'COMPLETED')}
          >
            Mark Done
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs text-muted-foreground" 
            onClick={() => onStatusChange(task.id, 'TODO')}
          >
            Reopen
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
