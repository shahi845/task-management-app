// MOCKED Database Layer — In-memory store per migration guide Phase 2.2
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  otpCode: string | null;
  otpExpiresAt: Date | null;
  otpRequestCount: number;
  otpWindowStart: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Initial demo user: demo@taskflow.com / password123
const demoUser: UserRecord = {
  id: 'demo-user-id-12345',
  name: 'Demo User',
  email: 'demo@taskflow.com',
  passwordHash: bcrypt.hashSync('password123', 10),
  emailVerified: true,
  otpCode: null,
  otpExpiresAt: null,
  otpRequestCount: 0,
  otpWindowStart: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const demoTasks: TaskRecord[] = [
  {
    id: 'task-1',
    title: 'Review System Architecture',
    description: 'Ensure full-stack migration adheres to single-port Node.js and React guidelines.',
    status: 'COMPLETED',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000 * 2),
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(),
    userId: 'demo-user-id-12345',
  },
  {
    id: 'task-2',
    title: 'Verify In-Memory Database and Auth',
    description: 'Test registration, OTP validation, task CRUD operations, and filtering.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 86400000 * 4),
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(),
    userId: 'demo-user-id-12345',
  },
  {
    id: 'task-3',
    title: 'Implement UI Polish and Kanban Board',
    description: 'Check dashboard statistics cards and task status drag-and-drop transitions.',
    status: 'TODO',
    priority: 'LOW',
    dueDate: new Date(Date.now() + 86400000 * 7),
    createdAt: new Date(Date.now() - 86400000 * 1),
    updatedAt: new Date(),
    userId: 'demo-user-id-12345',
  },
];

const usersMap = new Map<string, UserRecord>([
  [demoUser.id, demoUser],
]);

const tasksMap = new Map<string, TaskRecord>(
  demoTasks.map((t) => [t.id, t])
);

function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

const mockPrisma = {
  user: {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id) return usersMap.get(where.id) || null;
      if (where.email) {
        for (const u of usersMap.values()) {
          if (u.email.toLowerCase() === where.email.toLowerCase()) return u;
        }
      }
      return null;
    },
    findFirst: async ({ where }: { where: { id?: string; email?: string } }) => {
      return mockPrisma.user.findUnique({ where });
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || generateId();
      const user: UserRecord = {
        id,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        emailVerified: data.emailVerified ?? false,
        otpCode: data.otpCode ?? null,
        otpExpiresAt: data.otpExpiresAt ?? null,
        otpRequestCount: data.otpRequestCount ?? 0,
        otpWindowStart: data.otpWindowStart ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      usersMap.set(id, user);
      return user;
    },
    update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
      let target: UserRecord | null = null;
      if (where.id) target = usersMap.get(where.id) || null;
      else if (where.email) {
        for (const u of usersMap.values()) {
          if (u.email.toLowerCase() === where.email.toLowerCase()) {
            target = u;
            break;
          }
        }
      }
      if (!target) throw new Error('User not found');
      const updated: UserRecord = {
        ...target,
        ...data,
        updatedAt: new Date(),
      };
      usersMap.set(updated.id, updated);
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const user = usersMap.get(where.id);
      if (user) usersMap.delete(where.id);
      return user || null;
    },
  },
  task: {
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
      let results = Array.from(tasksMap.values());
      if (where?.userId) {
        results = results.filter((t) => t.userId === where.userId);
      }
      if (where?.status) {
        results = results.filter((t) => t.status === where.status);
      }
      if (where?.priority) {
        results = results.filter((t) => t.priority === where.priority);
      }
      if (where?.OR && Array.isArray(where.OR)) {
        results = results.filter((t) => {
          return where.OR.some((condition: any) => {
            if (condition.title?.contains) {
              return t.title.toLowerCase().includes(condition.title.contains.toLowerCase());
            }
            if (condition.description?.contains) {
              return (t.description || '').toLowerCase().includes(condition.description.contains.toLowerCase());
            }
            return false;
          });
        });
      }

      if (orderBy) {
        if (orderBy.createdAt === 'asc') {
          results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else if (orderBy.createdAt === 'desc') {
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (orderBy.dueDate === 'asc') {
          results.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          });
        }
      } else {
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return results;
    },
    findFirst: async ({ where }: { where: { id: string; userId?: string } }) => {
      const task = tasksMap.get(where.id);
      if (!task) return null;
      if (where.userId && task.userId !== where.userId) return null;
      return task;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return tasksMap.get(where.id) || null;
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || generateId();
      const task: TaskRecord = {
        id,
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? 'TODO',
        priority: data.priority ?? 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        userId: data.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      tasksMap.set(id, task);
      return task;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const existing = tasksMap.get(where.id);
      if (!existing) throw new Error('Task not found');
      const updated: TaskRecord = {
        ...existing,
        ...data,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : existing.dueDate,
        updatedAt: new Date(),
      };
      tasksMap.set(where.id, updated);
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const task = tasksMap.get(where.id);
      if (task) tasksMap.delete(where.id);
      return task || null;
    },
  },
};

const prisma = mockPrisma;

export default prisma;
