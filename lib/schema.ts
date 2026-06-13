import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'in-progress', 'done']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);
export const subtaskStatusSchema = z.enum(['todo', 'done']);

export const taskSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  createdAt: z.iso.datetime({ offset: true }),
});

export const subtaskSchema = z.object({
  id: z.uuid(),
  taskId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  status: subtaskStatusSchema,
  createdAt: z.iso.datetime({ offset: true }),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  status: taskStatusSchema.optional().default('todo'),
  priority: taskPrioritySchema.optional().default('medium'),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field is required',
  });

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type SubtaskStatus = z.infer<typeof subtaskStatusSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Subtask = z.infer<typeof subtaskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
