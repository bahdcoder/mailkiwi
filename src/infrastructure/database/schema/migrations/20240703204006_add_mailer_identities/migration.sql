-- CreateEnum
CREATE TYPE "MailerIdentityStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MailerStatus" ADD VALUE 'INSTALLING';
ALTER TYPE "MailerStatus" ADD VALUE 'CREATING_IDENTITIES';
ALTER TYPE "MailerStatus" ADD VALUE 'SENDING_TEST_EMAIL';

-- AlterTable
ALTER TABLE "Mailer" ADD COLUMN     "installationCompletedAt" TIMESTAMP(3),
ADD COLUMN     "testEmailSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MailerIdentity" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "mailerId" TEXT,
    "status" "MailerIdentityStatus" NOT NULL DEFAULT 'PENDING',
    "configuration" TEXT,
    "confirmedApprovalAt" TIMESTAMP(3),

    CONSTRAINT "MailerIdentity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MailerIdentity" ADD CONSTRAINT "MailerIdentity_mailerId_fkey" FOREIGN KEY ("mailerId") REFERENCES "Mailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
