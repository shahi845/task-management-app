"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate); // Protect all task routes
router.route('/')
    .post(task_controller_1.createTask)
    .get(task_controller_1.getTasks);
router.route('/:id')
    .get(task_controller_1.getTaskById)
    .put(task_controller_1.updateTask)
    .delete(task_controller_1.deleteTask);
router.patch('/:id/status', task_controller_1.updateTaskStatus);
exports.default = router;
