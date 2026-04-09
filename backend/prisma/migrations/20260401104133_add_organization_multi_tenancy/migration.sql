/*
  Warnings:

  - Added the required column `organizationId` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Instance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `InstanceLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `MaintenanceLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Rental` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ActivityLog` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Category` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Department` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Instance` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `InstanceLog` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Item` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Location` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `MaintenanceLog` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Rental` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Reservation` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `organizationId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Organization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organization_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Item` ADD CONSTRAINT `Item_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Instance` ADD CONSTRAINT `Instance_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Location` ADD CONSTRAINT `Location_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rental` ADD CONSTRAINT `Rental_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceLog` ADD CONSTRAINT `MaintenanceLog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstanceLog` ADD CONSTRAINT `InstanceLog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
