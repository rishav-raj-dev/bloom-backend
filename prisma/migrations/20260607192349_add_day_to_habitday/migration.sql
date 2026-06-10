/*
  Warnings:

  - Added the required column `day` to the `HabitDay` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HabitDay" ADD COLUMN     "day" TEXT NOT NULL,
ALTER COLUMN "description" SET DEFAULT '';
