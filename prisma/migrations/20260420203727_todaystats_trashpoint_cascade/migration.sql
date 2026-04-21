-- Update TodayStats -> TrashPoint foreign key to cascade on delete
ALTER TABLE "TodayStats" DROP CONSTRAINT "TodayStats_trashPointId_fkey";
ALTER TABLE "TodayStats"
ADD CONSTRAINT "TodayStats_trashPointId_fkey"
FOREIGN KEY ("trashPointId") REFERENCES "TrashPoint"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
