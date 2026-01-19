/*
  Warnings:

  - You are about to alter the column `type` on the `HealthRecord` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.
  - Made the column `bloodGroup` on table `HealthSummary` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `HealthRecord` MODIFY `type` ENUM('VISIT', 'LAB', 'PRESCRIPTION', 'NOTE') NOT NULL;

-- AlterTable
ALTER TABLE `HealthSummary` MODIFY `bloodGroup` ENUM('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG') NOT NULL;

-- AlterTable
ALTER TABLE `UserProfile` MODIFY `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NOT NULL;
