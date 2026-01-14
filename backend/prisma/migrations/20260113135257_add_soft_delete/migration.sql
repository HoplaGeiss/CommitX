-- AlterTable
ALTER TABLE "Commitment" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CommitmentParticipant" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Completion" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Commitment_deleted_idx" ON "Commitment"("deleted");

-- CreateIndex
CREATE INDEX "CommitmentParticipant_deleted_idx" ON "CommitmentParticipant"("deleted");

-- CreateIndex
CREATE INDEX "Completion_deleted_idx" ON "Completion"("deleted");
