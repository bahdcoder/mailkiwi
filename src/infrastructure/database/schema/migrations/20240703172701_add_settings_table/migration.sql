-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_domain_key" ON "Setting"("domain");
