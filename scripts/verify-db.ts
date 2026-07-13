import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

async function main() {
  const counts = {
    builders: await prisma.builder.count(),
    properties: await prisma.property.count(),
    pricing: await prisma.pricing.count(),
    configurations: await prisma.configuration.count(),
    towers: await prisma.tower.count(),
    amenities: await prisma.amenity.count(),
    locationMetrics: await prisma.locationMetric.count(),
    investmentMetrics: await prisma.investmentMetric.count(),
    parking: await prisma.parking.count(),
    media: await prisma.propertyMedia.count(),
    attributes: await prisma.propertyAttribute.count(),
    internalAnalysis: await prisma.internalAnalysis.count(),
    reviews: await prisma.review.count(),
    users: await prisma.user.count(),
    savedComparisons: await prisma.savedComparison.count(),
    importRuns: await prisma.importRun.count(),
  };
  console.log("TABLE COUNTS:", JSON.stringify(counts, null, 2));

  const sample = await prisma.property.findFirst({
    include: {
      builder: true,
      pricing: true,
      location: true,
      investment: true,
      parking: true,
      configurations: true,
      towerUnits: true,
      amenities: true,
      attributes: true,
    },
  });
  if (sample) {
    console.log("\nSAMPLE PROPERTY:", JSON.stringify(
      {
        slug: sample.slug,
        name: sample.name,
        builder: sample.builder.name,
        city: sample.city,
        possession: sample.possession,
        areaAcres: sample.areaAcres,
        towersCount: sample.towers,
        configsLabel: sample.configsLabel,
        pricing: { perSqFt: sample.pricing?.pricePerSqFt, range: sample.pricing?.priceRangeLabel, derived: sample.pricing?.startingDerived },
        location: { metroMin: sample.location?.metroMin, expresswayMin: sample.location?.expresswayMin, connectivity: sample.location?.connectivityIndex },
        investment: { appreciation: sample.investment?.appreciationPct, yield: sample.investment?.rentalYieldPct, idealFor: sample.investment?.idealFor },
        parking: sample.parking ? { basement: sample.parking.basement, ev: sample.parking.ev, total: sample.parking.total } : null,
        towers: sample.towerUnits.map((t) => `${t.name}:${t.floorPlan}`),
        configs: sample.configurations.map((c) => `${c.label}(${c.areaSqFt}sqft, carpet ${c.carpetAreaSqft})`),
        amenitiesAvailable: sample.amenities.filter((a) => a.available).map((a) => a.label),
        attributes: sample.attributes.map((a) => `[${a.category}] ${a.key}=${a.value.slice(0, 40)}`),
      },
      null,
      2,
    ));
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
