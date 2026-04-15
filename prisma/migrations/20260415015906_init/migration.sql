-- CreateEnum
CREATE TYPE "Category" AS ENUM ('plastico', 'papel', 'organico', 'general');

-- CreateEnum
CREATE TYPE "PrizeCategory" AS ENUM ('internet', 'academic', 'cafeteria');

-- CreateTable
CREATE TABLE "TrashPoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "detectedObject" TEXT NOT NULL,
    "detectedImage" TEXT NOT NULL,
    "category" "Category",
    "fillLevel" INTEGER NOT NULL,
    "lastCollected" TEXT NOT NULL,
    "alert" TEXT,

    CONSTRAINT "TrashPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodayStats" (
    "id" SERIAL NOT NULL,
    "plastico" INTEGER NOT NULL,
    "papel" INTEGER NOT NULL,
    "organico" INTEGER NOT NULL,
    "general" INTEGER NOT NULL,
    "trashPointId" TEXT NOT NULL,

    CONSTRAINT "TodayStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "boleta" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ecoPoints" INTEGER NOT NULL,
    "classifications" INTEGER NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("boleta")
);

-- CreateTable
CREATE TABLE "Prize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "PrizeCategory" NOT NULL,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolygonArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "PolygonArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolygonPoint" (
    "id" SERIAL NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "PolygonPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TodayStats_trashPointId_key" ON "TodayStats"("trashPointId");

-- AddForeignKey
ALTER TABLE "TodayStats" ADD CONSTRAINT "TodayStats_trashPointId_fkey" FOREIGN KEY ("trashPointId") REFERENCES "TrashPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolygonPoint" ADD CONSTRAINT "PolygonPoint_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "PolygonArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
