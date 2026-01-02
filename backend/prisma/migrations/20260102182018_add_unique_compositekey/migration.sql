/*
  Warnings:

  - A unique constraint covering the columns `[compositeKey]` on the table `LegalFact` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "LegalFact_compositeKey_idx";

-- CreateIndex
CREATE UNIQUE INDEX "LegalFact_compositeKey_key" ON "LegalFact"("compositeKey");
