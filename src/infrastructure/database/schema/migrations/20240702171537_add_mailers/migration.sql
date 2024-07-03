/*
  Warnings:

  - A unique constraint covering the columns `[email,audienceId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MailerStatus" AS ENUM ('READY', 'PENDING', 'DISABLED');

-- CreateEnum
CREATE TYPE "MailerProvider" AS ENUM ('AWS_SES', 'POSTMARK', 'MAILGUN');

-- CreateTable
CREATE TABLE "Mailer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configuration" TEXT NOT NULL,
    "default" BOOLEAN,
    "provider" "MailerProvider" NOT NULL,
    "status" "MailerStatus" NOT NULL DEFAULT 'PENDING',
    "teamId" TEXT NOT NULL,

    CONSTRAINT "Mailer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_audienceId_key" ON "Contact"("email", "audienceId");

-- AddForeignKey
ALTER TABLE "Mailer" ADD CONSTRAINT "Mailer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
