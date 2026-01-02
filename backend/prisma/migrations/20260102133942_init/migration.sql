-- CreateTable
CREATE TABLE "LegalFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateIndex
CREATE INDEX "LegalFact_date_idx" ON "LegalFact"("date");

-- CreateIndex
CREATE INDEX "LegalFact_ingestMethod_idx" ON "LegalFact"("ingestMethod");

-- CreateIndex
CREATE INDEX "LegalFact_impact_idx" ON "LegalFact"("impact");
