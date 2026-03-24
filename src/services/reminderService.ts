import prisma from '@/lib/prisma';
import { Reminder } from '@prisma/client';

export const reminderService = {
    async getAllReminders() {
        return await prisma.reminder.findMany({
            orderBy: { dateTime: 'asc' },
        });
    },

    async getReminderById(id: number) {
        return await prisma.reminder.findUnique({
            where: { id },
        });
    },

    async createReminder(data: {
        title: string;
        dateTime: Date;
        isRecurring?: boolean;
        isCompleted?: boolean;
        color?: string;
    }) {
        return await prisma.reminder.create({
            data,
        });
    },

    async updateReminder(id: number, data: Partial<Reminder>) {
        return await prisma.reminder.update({
            where: { id },
            data,
        });
    },

    async deleteReminder(id: number) {
        return await prisma.reminder.delete({
            where: { id },
        });
    },
};
