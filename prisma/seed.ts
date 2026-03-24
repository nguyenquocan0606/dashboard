import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create default task stacks if they don't exist
    const existingStacks = await prisma.taskStack.count();

    if (existingStacks === 0) {
        console.log('Creating default task stacks...');

        await prisma.taskStack.createMany({
            data: [
                { name: 'Backlog', order: 0, color: '#64748b' },
                { name: 'In Progress', order: 1, color: '#3b82f6' },
                { name: 'Done', order: 2, color: '#10b981' },
            ],
        });

        console.log('✓ Default task stacks created');

        // Move existing tasks to appropriate stacks
        const backlogStack = await prisma.taskStack.findFirst({ where: { name: 'Backlog' } });
        const inProgressStack = await prisma.taskStack.findFirst({ where: { name: 'In Progress' } });
        const doneStack = await prisma.taskStack.findFirst({ where: { name: 'Done' } });

        if (backlogStack && inProgressStack && doneStack) {
            await prisma.task.updateMany({
                where: { status: 'DONE', stackId: null },
                data: { stackId: doneStack.id },
            });

            await prisma.task.updateMany({
                where: { status: 'IN_PROGRESS', stackId: null },
                data: { stackId: inProgressStack.id },
            });

            await prisma.task.updateMany({
                where: { stackId: null },
                data: { stackId: backlogStack.id },
            });

            console.log('✓ Existing tasks migrated to stacks');
        }
    } else {
        console.log('Task stacks already exist, skipping');
    }
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
