import { NextResponse } from 'next/server';
import { taskService } from '@/services/taskService';
import { CalendarSyncService } from '@/services/calendarSync.service';
import { z } from 'zod';

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    dueDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    tags: z.string().optional(),
    stackId: z.number().optional(),
    order: z.number().optional(),
});

export async function GET() {
    try {
        const tasks = await taskService.getAllTasks();
        return NextResponse.json(tasks);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = createTaskSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const task = await taskService.createTask(validation.data);

        // Auto-sync to calendar
        if (task.dueDate) {
            await CalendarSyncService.syncEventToNylas({
                sourceType: 'task',
                sourceId: task.id,
                action: 'create',
            });
        }

        return NextResponse.json(task, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
