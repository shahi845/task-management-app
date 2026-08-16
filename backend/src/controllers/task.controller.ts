import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const getSingleParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional().nullable()
});

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = taskSchema.parse(req.body);
    const userId = req.user!.userId;

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        userId
      }
    });

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { status, priority, search, sort } = req.query;

    let whereClause: any = { userId };

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    let orderByClause: any = { createdAt: 'desc' };
    
    if (sort === 'oldest') orderByClause = { createdAt: 'asc' };
    else if (sort === 'dueDate') orderByClause = { dueDate: 'asc' };
    else if (sort === 'priority') orderByClause = { priority: 'desc' }; // Would need custom logic for enum sorting if not supported, but descending might work for HIGH -> LOW depending on enum DB representation, Prisma doesn't sort enums perfectly without mapping, we'll sort by createdAt if it's complex, or let the client sort. Let's stick to basic Prisma sorting.

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: orderByClause
    });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getSingleParam(req.params.id);
    const userId = req.user!.userId;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Task id is required' });
    }

    const task = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getSingleParam(req.params.id);
    const userId = req.user!.userId;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Task id is required' });
    }

    const validatedData = taskSchema.partial().parse(req.body);

    const existingTask = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: validatedData
    });

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

const statusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED'])
});

export const updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getSingleParam(req.params.id);
    const userId = req.user!.userId;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Task id is required' });
    }

    const { status } = statusSchema.parse(req.body);

    const existingTask = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getSingleParam(req.params.id);
    const userId = req.user!.userId;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Task id is required' });
    }

    const existingTask = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
