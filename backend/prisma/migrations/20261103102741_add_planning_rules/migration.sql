-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "recipeServings" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "bufferPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "PlanningRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanningRule_name_key" ON "PlanningRule"("name");
