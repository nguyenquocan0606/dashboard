import prisma from '@/lib/prisma';
import { Task, Priority, Status } from '@prisma/client';

export const taskService = {
    async getAllTasks() {
        return await prisma.task.findMany({
            orderBy: { createdAt: 'desc' },
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
    }) {
        return await prisma.task.create({
            data,
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
