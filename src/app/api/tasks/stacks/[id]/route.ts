import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateStackSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
    order: z.number().optional(),
});

/**
 * PATCH /api/tasks/stacks/[id]
 * Update a task stack
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const body = await req.json();
        const validatedData = updateStackSchema.parse(body);

        const stack = await prisma.taskStack.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(stack);
    } catch (error) {
        console.error('Error updating stack:', error);
        return NextResponse.json(
            { error: 'Failed to update stack' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tasks/stacks/[id]
 * Delete a task stack (tasks will be set to null stackId)
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        await prisma.taskStack.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting stack:', error);
        return NextResponse.json(
            { error: 'Failed to delete stack' },
            { status: 500 }
        );
    }
}
