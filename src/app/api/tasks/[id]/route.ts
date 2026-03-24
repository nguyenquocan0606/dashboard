import { NextResponse } from 'next/server';
import { taskService } from '@/services/taskService';
import { CalendarSyncService } from '@/services/calendarSync.service';
import { z } from 'zod';

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    dueDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    tags: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const task = await taskService.getTaskById(id);
        if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        return NextResponse.json(task);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const validation = updateTaskSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const task = await taskService.updateTask(id, validation.data);

        // Auto-sync to calendar
        if (task.dueDate) {
            await CalendarSyncService.syncEventToNylas({
                sourceType: 'task',
                sourceId: id,
                action: 'update',
            });
        }

        return NextResponse.json(task);
    } catch {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        // Sync deletion to calendar (before deleting from DB)
        await CalendarSyncService.syncEventToNylas({
            sourceType: 'task',
            sourceId: id,
            action: 'delete',
        });

        await taskService.deleteTask(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
