-- CreateEnum
CREATE TYPE "BroadcastEditor" AS ENUM ('DEFAULT', 'MARKDOWN');

-- CreateEnum
CREATE TYPE "MailerStatus" AS ENUM (
    'READY',
    'PENDING',
    'INSTALLING',
    'CREATING_IDENTITIES',
    'SENDING_TEST_EMAIL',
    'DISABLED'
);

-- CreateEnum
CREATE TYPE "MailerProvider" AS ENUM ('AWS_SES', 'POSTMARK', 'MAILGUN');

-- CreateEnum
CREATE TYPE "MailerIdentityStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'DENIED',
    'FAILED',
    'TEMPORARILY_FAILED'
);

-- CreateEnum
CREATE TYPE "MailerIdentityType" AS ENUM ('EMAIL', 'DOMAIN');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM (
    'ALL_EVENTS',
    'CONTACT_ADDED',
    'CONTACT_REMOVED',
    'CONTACT_TAG_ADDED',
    'CONTACT_TAG_REMOVED',
    'BROADCAST_SENT',
    'BROADCAST_PAUSED',
    'BROADCAST_EMAIL_OPENED',
    'BROADCAST_EMAIL_LINK_CLICKED',
    'AUDIENCE_ADDED',
    'TAG_ADDED',
    'TAG_REMOVED'
);

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('ADMINISTRATOR', 'USER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE');

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "domain" TEXT NOT NULL,
    "installedSslCertificate" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "password" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessToken" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "hash" TEXT NOT NULL,
    "abilities" TEXT [] DEFAULT ARRAY [] :: TEXT [],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "teamId" TEXT,
    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackClicks" BOOLEAN,
    "trackOpens" BOOLEAN,
    "configurationKey" TEXT NOT NULL,
    "broadcastEditor" "BroadcastEditor" NOT NULL DEFAULT 'DEFAULT',
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mailer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configuration" TEXT NOT NULL,
    "default" BOOLEAN,
    "provider" "MailerProvider" NOT NULL,
    "status" "MailerStatus" NOT NULL DEFAULT 'PENDING',
    "teamId" TEXT NOT NULL,
    "testEmailSentAt" TIMESTAMP(3),
    "installationCompletedAt" TIMESTAMP(3),
    CONSTRAINT "Mailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailerIdentity" (
    "id" TEXT NOT NULL,
    "mailerId" TEXT,
    "value" TEXT NOT NULL,
    "type" "MailerIdentityType" NOT NULL,
    "status" "MailerIdentityStatus" NOT NULL DEFAULT 'PENDING',
    "configuration" JSONB,
    "confirmedApprovalAt" TIMESTAMP(3),
    CONSTRAINT "MailerIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" "WebhookEvent" [] DEFAULT ARRAY ['ALL_EVENTS'] :: "WebhookEvent" [],
    "teamId" TEXT NOT NULL,
    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audience" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    CONSTRAINT "Audience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "subscribedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "audienceId" TEXT NOT NULL,
    "attributes" JSONB,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagsOnContacts" (
    "tagId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3),
    CONSTRAINT "TagsOnContacts_pkey" PRIMARY KEY ("tagId", "contactId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_url_key" ON "Setting"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_domain_key" ON "Setting"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_audienceId_key" ON "Contact"("email", "audienceId");

-- CreateIndex
CREATE INDEX "TagsOnContacts_tagId_contactId_idx" ON "TagsOnContacts"("tagId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "TagsOnContacts_tagId_contactId_key" ON "TagsOnContacts"("tagId", "contactId");

-- AddForeignKey
ALTER TABLE
    "AccessToken"
ADD
    CONSTRAINT "AccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE
SET
    NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "AccessToken"
ADD
    CONSTRAINT "AccessToken_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE
SET
    NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "Team"
ADD
    CONSTRAINT "Team_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "Mailer"
ADD
    CONSTRAINT "Mailer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "MailerIdentity"
ADD
    CONSTRAINT "MailerIdentity_mailerId_fkey" FOREIGN KEY ("mailerId") REFERENCES "Mailer"("id") ON DELETE
SET
    NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "Webhook"
ADD
    CONSTRAINT "Webhook_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "TeamMembership"
ADD
    CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE
SET
    NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "TeamMembership"
ADD
    CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "Audience"
ADD
    CONSTRAINT "Audience_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "Contact"
ADD
    CONSTRAINT "Contact_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "Audience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "TagsOnContacts"
ADD
    CONSTRAINT "TagsOnContacts_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "TagsOnContacts"
ADD
    CONSTRAINT "TagsOnContacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;