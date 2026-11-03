-- CreateTable
CREATE TABLE "EventDish" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "dishId" INTEGER NOT NULL,
    "plannedServings" INTEGER NOT NULL,

    CONSTRAINT "EventDish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventDish_dishId_idx" ON "EventDish"("dishId");

-- CreateIndex
CREATE UNIQUE INDEX "EventDish_eventId_dishId_key" ON "EventDish"("eventId", "dishId");

-- AddForeignKey
ALTER TABLE "EventDish" ADD CONSTRAINT "EventDish_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDish" ADD CONSTRAINT "EventDish_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
