"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTaskStatus = exports.updateTask = exports.getTaskById = exports.getTasks = exports.createTask = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const getSingleParam = (value) => Array.isArray(value) ? value[0] : value;
const taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255),
    description: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate: zod_1.z.string().datetime().optional().nullable()
});
const createTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = taskSchema.parse(req.body);
        const userId = req.user.userId;
        const task = yield prisma_1.default.task.create({
            data: Object.assign(Object.assign({}, validatedData), { userId })
        });
        res.status(201).json({
            success: true,
            data: task
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createTask = createTask;
const getTasks = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { status, priority, search, sort } = req.query;
        let whereClause = { userId };
        if (status)
            whereClause.status = status;
        if (priority)
            whereClause.priority = priority;
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        let orderByClause = { createdAt: 'desc' };
        if (sort === 'oldest')
            orderByClause = { createdAt: 'asc' };
        else if (sort === 'dueDate')
            orderByClause = { dueDate: 'asc' };
        else if (sort === 'priority')
            orderByClause = { priority: 'desc' }; // Would need custom logic for enum sorting if not supported, but descending might work for HIGH -> LOW depending on enum DB representation, Prisma doesn't sort enums perfectly without mapping, we'll sort by createdAt if it's complex, or let the client sort. Let's stick to basic Prisma sorting.
        const tasks = yield prisma_1.default.task.findMany({
            where: whereClause,
            orderBy: orderByClause
        });
        res.json({
            success: true,
            data: tasks
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getTasks = getTasks;
const getTaskById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getSingleParam(req.params.id);
        const userId = req.user.userId;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Task id is required' });
        }
        const task = yield prisma_1.default.task.findFirst({
            where: { id, userId }
        });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        res.json({
            success: true,
            data: task
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getTaskById = getTaskById;
const updateTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getSingleParam(req.params.id);
        const userId = req.user.userId;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Task id is required' });
        }
        const validatedData = taskSchema.partial().parse(req.body);
        const existingTask = yield prisma_1.default.task.findFirst({
            where: { id, userId }
        });
        if (!existingTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const task = yield prisma_1.default.task.update({
            where: { id },
            data: validatedData
        });
        res.json({
            success: true,
            data: task
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTask = updateTask;
const statusSchema = zod_1.z.object({
    status: zod_1.z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED'])
});
const updateTaskStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getSingleParam(req.params.id);
        const userId = req.user.userId;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Task id is required' });
        }
        const { status } = statusSchema.parse(req.body);
        const existingTask = yield prisma_1.default.task.findFirst({
            where: { id, userId }
        });
        if (!existingTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const task = yield prisma_1.default.task.update({
            where: { id },
            data: { status }
        });
        res.json({
            success: true,
            data: task
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTaskStatus = updateTaskStatus;
const deleteTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getSingleParam(req.params.id);
        const userId = req.user.userId;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Task id is required' });
        }
        const existingTask = yield prisma_1.default.task.findFirst({
            where: { id, userId }
        });
        if (!existingTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        yield prisma_1.default.task.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTask = deleteTask;
