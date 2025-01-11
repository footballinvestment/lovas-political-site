-- CreateTable
CREATE TABLE `Slide` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('GRADIENT', 'IMAGE', 'VIDEO') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `gradientFrom` VARCHAR(255) NULL,
    `gradientTo` VARCHAR(255) NULL,
    `mediaUrl` VARCHAR(255) NULL,
    `ctaText` VARCHAR(255) NULL,
    `ctaLink` VARCHAR(255) NULL,
    `videoType` VARCHAR(10) NULL,
    `autoPlay` BOOLEAN NOT NULL DEFAULT true,
    `loop` BOOLEAN NOT NULL DEFAULT true,
    `muted` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
