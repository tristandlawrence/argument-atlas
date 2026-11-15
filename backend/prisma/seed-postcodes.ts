import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";

const prisma = new PrismaClient();

// A deliberately small, individually-verified starter set (capital city
// CBD postcodes) rather than a fabricated national table — there is no
// simple authoritative postcode→electorate file (electorates are drawn
// from geographic boundaries, not postcode ranges; the AEC only publishes
// GIS shapefiles). Postcodes outside this set still resolve to a state via
// postcodeState.ts; the electorate field is left for the person to confirm
// via the AEC's own lookup tool. Extend this table over time with verified
// entries rather than guessed ones.
const CURATED_ELECTORATES: { postcode: string; state: string; federalElectorates: string[] }[] = [
  { postcode: "2000", state: "NSW", federalElectorates: ["Sydney"] },
  { postcode: "3000", state: "VIC", federalElectorates: ["Melbourne"] },
  { postcode: "4000", state: "QLD", federalElectorates: ["Brisbane"] },
  { postcode: "5000", state: "SA", federalElectorates: ["Adelaide"] },
  { postcode: "6000", state: "WA", federalElectorates: ["Perth"] },
  { postcode: "7000", state: "TAS", federalElectorates: ["Clark"] },
  { postcode: "0800", state: "NT", federalElectorates: ["Solomon"] },
  { postcode: "2600", state: "ACT", federalElectorates: ["Canberra"] },
];

async function main() {
  for (const entry of CURATED_ELECTORATES) {
    await prisma.postcode.upsert({
      where: { postcode: entry.postcode },
      create: entry,
      update: entry,
    });
  }
  console.log(`Seeded ${CURATED_ELECTORATES.length} curated postcode→electorate entries.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
