-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "builders" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "yearEstablished" INTEGER,
    "yearsInMarketRaw" TEXT,
    "deliveredProjects" INTEGER,
    "deliveredProjectsRaw" TEXT,
    "ongoingProjects" INTEGER,
    "logoColor" TEXT NOT NULL DEFAULT '#0f3460',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "builderId" UUID NOT NULL,
    "projectType" TEXT,
    "category" TEXT,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "possession" TEXT NOT NULL,
    "possessionDate" TEXT NOT NULL,
    "description" TEXT,
    "reraId" TEXT,
    "reraRegisteredAt" TIMESTAMP(3),
    "reraCompletionAt" TIMESTAMP(3),
    "areaAcres" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "towers" INTEGER NOT NULL DEFAULT 0,
    "totalUnits" INTEGER,
    "clubSizeSqft" INTEGER,
    "configsLabel" TEXT NOT NULL DEFAULT '',
    "gradientFrom" TEXT NOT NULL DEFAULT '#0f3460',
    "gradientTo" TEXT NOT NULL DEFAULT '#16697a',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "startingPriceLakh" DOUBLE PRECISION,
    "maxPriceLakh" DOUBLE PRECISION,
    "pricePerSqFt" INTEGER,
    "priceRangeLabel" TEXT NOT NULL DEFAULT '',
    "bookingAmount" DOUBLE PRECISION,
    "maintenancePerSqft" DOUBLE PRECISION,
    "startingDerived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configurations" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "areaSqFt" INTEGER NOT NULL DEFAULT 0,
    "saleableAreaSqft" INTEGER,
    "carpetAreaSqft" DOUBLE PRECISION,
    "balconyAreaSqft" DOUBLE PRECISION,
    "builtUpAreaSqft" DOUBLE PRECISION,
    "priceLabel" TEXT NOT NULL DEFAULT '',
    "floorPlanImage" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "towers" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ceilingHeight" TEXT,
    "floorPlan" TEXT,
    "lifts" INTEGER,
    "unitsPerFloor" INTEGER,
    "totalUnits" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "towers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "basement" INTEGER,
    "ev" INTEGER,
    "mechanical" INTEGER,
    "open" INTEGER,
    "total" INTEGER,

    CONSTRAINT "parking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_metrics" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "metroMin" INTEGER,
    "schoolMin" INTEGER,
    "hospitalMin" INTEGER,
    "expresswayMin" INTEGER,
    "expresswayNote" TEXT,
    "mapsUrl" TEXT,
    "sector" TEXT,
    "connectivityIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "location_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_metrics" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "appreciationPct" DOUBLE PRECISION,
    "rentalYieldPct" DOUBLE PRECISION,
    "demandIndex" INTEGER NOT NULL DEFAULT 0,
    "idealFor" TEXT,
    "investorFriendly" BOOLEAN,
    "upcomingInfrastructure" TEXT,

    CONSTRAINT "investment_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_analysis" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "locationScore" INTEGER,
    "amenitiesScore" INTEGER,
    "builderScore" INTEGER,
    "investmentScore" INTEGER,
    "overallRecommendation" TEXT,

    CONSTRAINT "internal_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_media" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "property_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_attributes" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'misc',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "property_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "userId" UUID,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'email',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_comparisons" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_comparison_properties" (
    "id" UUID NOT NULL,
    "savedComparisonId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,

    CONSTRAINT "saved_comparison_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_runs" (
    "id" UUID NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "report" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "builders_name_key" ON "builders"("name");

-- CreateIndex
CREATE INDEX "builders_name_idx" ON "builders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "properties_slug_key" ON "properties"("slug");

-- CreateIndex
CREATE INDEX "properties_builderId_idx" ON "properties"("builderId");

-- CreateIndex
CREATE INDEX "properties_city_idx" ON "properties"("city");

-- CreateIndex
CREATE INDEX "properties_kind_idx" ON "properties"("kind");

-- CreateIndex
CREATE INDEX "properties_possession_idx" ON "properties"("possession");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_propertyId_key" ON "pricing"("propertyId");

-- CreateIndex
CREATE INDEX "pricing_startingPriceLakh_idx" ON "pricing"("startingPriceLakh");

-- CreateIndex
CREATE INDEX "configurations_propertyId_idx" ON "configurations"("propertyId");

-- CreateIndex
CREATE INDEX "towers_propertyId_idx" ON "towers"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "parking_propertyId_key" ON "parking"("propertyId");

-- CreateIndex
CREATE INDEX "amenities_propertyId_idx" ON "amenities"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_propertyId_key_key" ON "amenities"("propertyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "location_metrics_propertyId_key" ON "location_metrics"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "investment_metrics_propertyId_key" ON "investment_metrics"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "internal_analysis_propertyId_key" ON "internal_analysis"("propertyId");

-- CreateIndex
CREATE INDEX "property_media_propertyId_idx" ON "property_media"("propertyId");

-- CreateIndex
CREATE INDEX "property_attributes_propertyId_idx" ON "property_attributes"("propertyId");

-- CreateIndex
CREATE INDEX "reviews_propertyId_idx" ON "reviews"("propertyId");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "saved_comparisons_userId_idx" ON "saved_comparisons"("userId");

-- CreateIndex
CREATE INDEX "saved_comparison_properties_propertyId_idx" ON "saved_comparison_properties"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_comparison_properties_savedComparisonId_propertyId_key" ON "saved_comparison_properties"("savedComparisonId", "propertyId");

-- CreateIndex
CREATE INDEX "import_runs_sourceFile_idx" ON "import_runs"("sourceFile");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "builders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing" ADD CONSTRAINT "pricing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "towers" ADD CONSTRAINT "towers_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking" ADD CONSTRAINT "parking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_metrics" ADD CONSTRAINT "location_metrics_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_metrics" ADD CONSTRAINT "investment_metrics_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_analysis" ADD CONSTRAINT "internal_analysis_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_attributes" ADD CONSTRAINT "property_attributes_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_comparisons" ADD CONSTRAINT "saved_comparisons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_comparison_properties" ADD CONSTRAINT "saved_comparison_properties_savedComparisonId_fkey" FOREIGN KEY ("savedComparisonId") REFERENCES "saved_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_comparison_properties" ADD CONSTRAINT "saved_comparison_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

