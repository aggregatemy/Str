/*
  Warnings:

  - The primary key for the `LegalFact` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `LegalFact` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LegalFact" (
    "compositeKey" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL DEFAULT 'unknown',
    "docId" TEXT NOT NULL DEFAULT '',
    "ingestMethod" TEXT NOT NULL,
    "eliUri" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "legalStatus" TEXT NOT NULL,
    "officialRationale" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LegalFact" ("category", "compositeKey", "createdAt", "date", "docId", "eliUri", "impact", "ingestMethod", "legalStatus", "officialRationale", "sourceId", "sourceUrl", "summary", "title", "updatedAt") SELECT "category", "compositeKey", "createdAt", "date", "docId", "eliUri", "impact", "ingestMethod", "legalStatus", "officialRationale", "sourceId", "sourceUrl", "summary", "title", "updatedAt" FROM "LegalFact";
DROP TABLE "LegalFact";
ALTER TABLE "new_LegalFact" RENAME TO "LegalFact";
CREATE INDEX "LegalFact_date_idx" ON "LegalFact"("date");
CREATE INDEX "LegalFact_ingestMethod_idx" ON "LegalFact"("ingestMethod");
CREATE INDEX "LegalFact_sourceId_idx" ON "LegalFact"("sourceId");
CREATE INDEX "LegalFact_impact_idx" ON "LegalFact"("impact");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
