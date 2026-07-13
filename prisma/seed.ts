import "dotenv/config";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { importDirectory, formatReport } from "@/lib/import/importer";

/**
 * Seed = run the real Excel importer against data/incoming, then add a small
 * amount of demo auth data. Fully idempotent:
 *  - properties/builders are upserted by slug/name (importer)
 *  - demo user upserted by email
 *  - demo reviews & saved comparison are reset before re-creating
 *
 * Run:  npm run db:migrate   then   npm run db:seed
 * Add more projects: drop .xlsx into data/incoming and run `npm run db:import`.
 */
const INCOMING = path.resolve(process.cwd(), "data/incoming");
const DEMO_REVIEWERS = ["Rohit Verma", "Anita Desai", "Karan Mehta"];

async function main() {
  console.log("⏳ Importing Excel sheets from", INCOMING);
  const reports = await importDirectory(INCOMING);
  console.log("\n" + formatReport(reports));

  // ---- demo user (idempotent) ----
  const user = await prisma.user.upsert({
    where: { email: "demo@creatorshome.in" },
    update: {},
    create: { name: "Demo User", email: "demo@creatorshome.in", provider: "email" },
    select: { id: true },
  });

  const props = await prisma.property.findMany({
    orderBy: { createdAt: "asc" },
    take: 2,
    select: { id: true },
  });

  if (props.length) {
    await prisma.review.deleteMany({ where: { authorName: { in: DEMO_REVIEWERS } } });
    await prisma.review.createMany({
      data: [
        {
          propertyId: props[0].id,
          userId: user.id,
          authorName: "Rohit Verma",
          rating: 5,
          comment: "Great location and amenities. Smooth process.",
        },
        {
          propertyId: props[0].id,
          authorName: "Anita Desai",
          rating: 4,
          comment: "Good value, solid construction quality.",
        },
        ...(props[1]
          ? [
              {
                propertyId: props[1].id,
                authorName: "Karan Mehta",
                rating: 5,
                comment: "Premium project with excellent connectivity.",
              },
            ]
          : []),
      ],
    });
  }

  if (props.length >= 2) {
    await prisma.savedComparison.deleteMany({ where: { userId: user.id } });
    await prisma.savedComparison.create({
      data: {
        userId: user.id,
        name: "My shortlist",
        items: { create: props.map((p) => ({ propertyId: p.id })) },
      },
    });
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
