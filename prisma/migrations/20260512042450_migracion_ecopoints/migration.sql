/*
  Warnings:

  - You are about to drop the column `category` on the `Prize` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Prize` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryId` to the `Prize` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Prize` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'carton';
ALTER TYPE "Category" ADD VALUE 'vidrio';
ALTER TYPE "Category" ADD VALUE 'metal';
ALTER TYPE "Category" ADD VALUE 'basura';

-- AlterTable
ALTER TABLE "PolygonArea" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Prize" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "PrizeCategory";

-- CreateTable
CREATE TABLE "PrizeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrizeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalStats" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plastico" INTEGER NOT NULL DEFAULT 0,
    "papel" INTEGER NOT NULL DEFAULT 0,
    "organico" INTEGER NOT NULL DEFAULT 0,
    "general" INTEGER NOT NULL DEFAULT 0,
    "trashPointId" TEXT NOT NULL,

    CONSTRAINT "HistoricalStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassificationRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "predictedAs" TEXT,
    "selectedAs" TEXT,
    "confidence" DOUBLE PRECISION,
    "trashPointId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoPointTransaction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcoPointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeRedemption" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "qrImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrizeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrizeCategory_name_key" ON "PrizeCategory"("name");

-- CreateIndex
CREATE INDEX "PrizeCategory_name_idx" ON "PrizeCategory"("name");

-- CreateIndex
CREATE INDEX "HistoricalStats_date_idx" ON "HistoricalStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalStats_trashPointId_date_key" ON "HistoricalStats"("trashPointId", "date");

-- CreateIndex
CREATE INDEX "ClassificationRecord_studentId_idx" ON "ClassificationRecord"("studentId");

-- CreateIndex
CREATE INDEX "ClassificationRecord_createdAt_idx" ON "ClassificationRecord"("createdAt");

-- CreateIndex
CREATE INDEX "EcoPointTransaction_studentId_idx" ON "EcoPointTransaction"("studentId");

-- CreateIndex
CREATE INDEX "EcoPointTransaction_type_idx" ON "EcoPointTransaction"("type");

-- CreateIndex
CREATE INDEX "EcoPointTransaction_createdAt_idx" ON "EcoPointTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrizeRedemption_qrCode_key" ON "PrizeRedemption"("qrCode");

-- CreateIndex
CREATE INDEX "PrizeRedemption_studentId_idx" ON "PrizeRedemption"("studentId");

-- CreateIndex
CREATE INDEX "PrizeRedemption_status_idx" ON "PrizeRedemption"("status");

-- CreateIndex
CREATE INDEX "PrizeRedemption_expiresAt_idx" ON "PrizeRedemption"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Prize_name_key" ON "Prize"("name");

-- CreateIndex
CREATE INDEX "Prize_categoryId_idx" ON "Prize"("categoryId");

-- AddForeignKey
ALTER TABLE "HistoricalStats" ADD CONSTRAINT "HistoricalStats_trashPointId_fkey" FOREIGN KEY ("trashPointId") REFERENCES "TrashPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PrizeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassificationRecord" ADD CONSTRAINT "ClassificationRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("boleta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoPointTransaction" ADD CONSTRAINT "EcoPointTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("boleta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeRedemption" ADD CONSTRAINT "PrizeRedemption_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("boleta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeRedemption" ADD CONSTRAINT "PrizeRedemption_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE CASCADE ON UPDATE CASCADE;
