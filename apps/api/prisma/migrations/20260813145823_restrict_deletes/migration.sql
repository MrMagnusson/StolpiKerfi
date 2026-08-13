-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'simtal',
    "subject" TEXT NOT NULL,
    "customerId" TEXT,
    "contactId" TEXT,
    "dueDate" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    CONSTRAINT "Activity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Activity" ("contactId", "customerId", "done", "dueDate", "id", "notes", "subject", "type") SELECT "contactId", "customerId", "done", "dueDate", "id", "notes", "subject", "type" FROM "Activity";
DROP TABLE "Activity";
ALTER TABLE "new_Activity" RENAME TO "Activity";
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("customerId", "email", "id", "name", "phone", "title") SELECT "customerId", "email", "id", "name", "phone", "title" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "customerId" TEXT,
    "projectId" TEXT,
    "unitIds" TEXT NOT NULL DEFAULT '[]',
    "startDate" TEXT,
    "endDate" TEXT,
    "monthlyIsk" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'drog',
    "notes" TEXT,
    CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("customerId", "endDate", "id", "monthlyIsk", "notes", "number", "projectId", "startDate", "status", "unitIds") SELECT "customerId", "endDate", "id", "monthlyIsk", "notes", "number", "projectId", "startDate", "status", "unitIds" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE UNIQUE INDEX "Contract_number_key" ON "Contract"("number");
CREATE TABLE "new_Damage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "responsible" TEXT,
    "projectId" TEXT,
    "costIsk" REAL NOT NULL DEFAULT 0,
    "rebilled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'skrad',
    CONSTRAINT "Damage_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Damage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Damage" ("cause", "costIsk", "date", "description", "id", "projectId", "rebilled", "responsible", "status", "unitId") SELECT "cause", "costIsk", "date", "description", "id", "projectId", "rebilled", "responsible", "status", "unitId" FROM "Damage";
DROP TABLE "Damage";
ALTER TABLE "new_Damage" RENAME TO "Damage";
CREATE TABLE "new_Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "customerId" TEXT,
    "contactId" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'nytt',
    "valueIsk" REAL NOT NULL DEFAULT 0,
    "source" TEXT,
    "expectedClose" TEXT,
    "owner" TEXT NOT NULL,
    "nextStep" TEXT,
    "notes" TEXT,
    CONSTRAINT "Deal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Deal" ("contactId", "customerId", "expectedClose", "id", "nextStep", "notes", "owner", "source", "stage", "title", "valueIsk") SELECT "contactId", "customerId", "expectedClose", "id", "nextStep", "notes", "owner", "source", "stage", "title", "valueIsk" FROM "Deal";
DROP TABLE "Deal";
ALTER TABLE "new_Deal" RENAME TO "Deal";
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "customerId" TEXT,
    "contractNumber" TEXT,
    "period" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,
    "amountIsk" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'drog',
    "bcRef" TEXT,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_contractNumber_fkey" FOREIGN KEY ("contractNumber") REFERENCES "Contract" ("number") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("amountIsk", "bcRef", "contractNumber", "customerId", "id", "number", "period", "status", "units") SELECT "amountIsk", "bcRef", "contractNumber", "customerId", "id", "number", "period", "status", "units" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE INDEX "Invoice_period_idx" ON "Invoice"("period");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "customerId" TEXT,
    "unitsNeeded" INTEGER NOT NULL DEFAULT 1,
    "needsToilet" BOOLEAN NOT NULL DEFAULT false,
    "minSizeM2" REAL,
    "location" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "requiredEquipment" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("customerId", "endDate", "id", "location", "minSizeM2", "name", "needsToilet", "requiredEquipment", "startDate", "status", "unitsNeeded") SELECT "customerId", "endDate", "id", "location", "minSizeM2", "name", "needsToilet", "requiredEquipment", "startDate", "status", "unitsNeeded" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "customerId" TEXT,
    "projectId" TEXT,
    "totalIsk" REAL NOT NULL DEFAULT 0,
    "validTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'drog',
    "notes" TEXT,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("customerId", "id", "notes", "number", "projectId", "status", "totalIsk", "validTo") SELECT "customerId", "id", "notes", "number", "projectId", "status", "totalIsk", "validTo" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");
CREATE TABLE "new_ServiceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'standsetning',
    "unitId" TEXT,
    "projectId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ny',
    "priority" TEXT NOT NULL DEFAULT 'medal',
    "description" TEXT,
    "assignedTo" TEXT,
    "dueDate" TEXT,
    CONSTRAINT "ServiceRequest_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ServiceRequest" ("assignedTo", "description", "dueDate", "id", "priority", "projectId", "status", "title", "type", "unitId") SELECT "assignedTo", "description", "dueDate", "id", "priority", "projectId", "status", "title", "type", "unitId" FROM "ServiceRequest";
DROP TABLE "ServiceRequest";
ALTER TABLE "new_ServiceRequest" RENAME TO "ServiceRequest";
CREATE TABLE "new_Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "sizeM2" REAL NOT NULL,
    "hasToilet" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'available',
    "location" TEXT NOT NULL,
    "equipment" TEXT NOT NULL DEFAULT '[]',
    "customerId" TEXT,
    CONSTRAINT "Unit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Unit" ("code", "customerId", "equipment", "hasToilet", "id", "location", "sizeM2", "status") SELECT "code", "customerId", "equipment", "hasToilet", "id", "location", "sizeM2", "status" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");
CREATE INDEX "Unit_status_idx" ON "Unit"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
