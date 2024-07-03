/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Setting` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "installedSslCertificate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Setting_url_key" ON "Setting"("url");
