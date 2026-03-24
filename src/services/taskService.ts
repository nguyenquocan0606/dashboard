import prisma from '@/lib/prisma';
import { Task, Priority, Status } from '@prisma/client';

export const taskService = {
    async getAllTasks() {
        return await prisma.task.findMany({
            include: { stack: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });
    },

    async getTaskById(id: number) {
        return await prisma.task.findUnique({
            where: { id },
        });
    },

    async createTask(data: {
        title: string;
        description?: string;
        dueDate?: Date;
        priority?: Priority;
        status?: Status;
        tags?: string;
        stackId?: number;
        order?: number;
    }) {
        return await prisma.task.create({
            data,
            include: { stack: true },
        });
    },

    async updateTask(id: number, data: Partial<Task>) {
        return await prisma.task.update({
            where: { id },
            data,
        });
    },

    async deleteTask(id: number) {
        return await prisma.task.delete({
            where: { id },
        });
    },
};
