/*
  Warnings:

  - You are about to drop the column `storageKey` on the `Document` table. All the data in the column will be lost.
  - Added the required column `fileData` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Document_storageKey_key";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "storageKey",
ADD COLUMN     "fileData" BYTEA NOT NULL;
