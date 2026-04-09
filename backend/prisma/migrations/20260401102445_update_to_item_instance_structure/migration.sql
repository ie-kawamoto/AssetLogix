/*
  Warnings:

  - You are about to drop the column `assetId` on the `MaintenanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `assetId` on the `Rental` table. All the data in the column will be lost.
  - You are about to drop the column `assetId` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssetLog` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `instanceId` to the `MaintenanceLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instanceId` to the `Rental` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instanceId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Asset` DROP FOREIGN KEY `Asset_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `AssetLog` DROP FOREIGN KEY `AssetLog_assetId_fkey`;

-- DropForeignKey
ALTER TABLE `MaintenanceLog` DROP FOREIGN KEY `MaintenanceLog_assetId_fkey`;

-- DropForeignKey
ALTER TABLE `Rental` DROP FOREIGN KEY `Rental_assetId_fkey`;

-- DropForeignKey
ALTER TABLE `Reservation` DROP FOREIGN KEY `Reservation_assetId_fkey`;

-- AlterTable
ALTER TABLE `MaintenanceLog` DROP COLUMN `assetId`,
    ADD COLUMN `instanceId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Rental` DROP COLUMN `assetId`,
    ADD COLUMN `instanceId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Reservation` DROP COLUMN `assetId`,
    ADD COLUMN `instanceId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `Asset`;

-- DropTable
DROP TABLE `AssetLog`;

-- CreateTable
CREATE TABLE `Item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Instance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemId` INTEGER NOT NULL,
    `serialNumber` VARCHAR(191) NULL,
    `status` ENUM('AVAILABLE', 'RENTED', 'BROKEN') NOT NULL DEFAULT 'AVAILABLE',
    `locationId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Location` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstanceLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instanceId` INTEGER NOT NULL,
    `status` ENUM('AVAILABLE', 'RENTED', 'BROKEN') NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Item` ADD CONSTRAINT `Item_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Instance` ADD CONSTRAINT `Instance_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Instance` ADD CONSTRAINT `Instance_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rental` ADD CONSTRAINT `Rental_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `Instance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `Instance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceLog` ADD CONSTRAINT `MaintenanceLog_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `Instance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstanceLog` ADD CONSTRAINT `InstanceLog_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `Instance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
