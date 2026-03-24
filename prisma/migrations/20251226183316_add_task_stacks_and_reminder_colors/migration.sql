-- CreateTable: TaskStack
CREATE TABLE `TaskStack` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `color` VARCHAR(191) NULL DEFAULT '#64748b',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: Task - Add stackId and order columns
ALTER TABLE `Task` ADD COLUMN `stackId` INTEGER NULL,
    ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Task - Add foreign key
ALTER TABLE `Task` ADD CONSTRAINT `Task_stackId_fkey` FOREIGN KEY (`stackId`) REFERENCES `TaskStack`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Reminder - Add color column
ALTER TABLE `Reminder` ADD COLUMN `color` VARCHAR(191) NULL DEFAULT '#10b981';
