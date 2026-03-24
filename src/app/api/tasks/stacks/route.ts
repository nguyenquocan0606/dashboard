import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const stackSchema = z.object({
    name: z.string().min(1, 'Stack name is required'),
    color: z.string().optional(),
});

/**
 * GET /api/tasks/stacks
 * List all task stacks with their tasks
 */
export async function GET() {
    try {
        const stacks = await prisma.taskStack.findMany({
            include: {
                tasks: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(stacks);
    } catch (error) {
        console.error('Error fetching stacks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stacks' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tasks/stacks
 * Create a new task stack
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedData = stackSchema.parse(body);

        // Get max order to append new stack at the end
        const maxOrderStack = await prisma.taskStack.findFirst({
            orderBy: { order: 'desc' },
        });

        const stack = await prisma.taskStack.create({
            data: {
                name: validatedData.name,
                color: validatedData.color || '#64748b',
                order: (maxOrderStack?.order ?? -1) + 1,
            },
        });

        return NextResponse.json(stack, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error creating stack:', error);
        return NextResponse.json(
            { error: 'Failed to create stack' },
            { status: 500 }
        );
    }
}
