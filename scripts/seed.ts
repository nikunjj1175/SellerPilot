import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
  console.error("\n❌ MONGODB_URI not found in .env\n");
  process.exit(1);
}

process.env.MONGODB_URI ??= process.env.DATABASE_URL;

async function main() {
  const { connectDB } = await import("../src/lib/mongodb");
  const { CreditPackage, User } = await import("../src/models");

  await connectDB();

  const packages = [
    { name: "10 Credits", credits: 10, priceInPaise: 9900 },
    { name: "50 Credits", credits: 50, priceInPaise: 39900 },
    { name: "100 Credits", credits: 100, priceInPaise: 69900 },
    { name: "500 Credits", credits: 500, priceInPaise: 299900 },
  ];

  const existing = await CreditPackage.countDocuments();
  if (existing === 0) {
    await CreditPackage.insertMany(packages);
    console.log("✓ Credit packages created");
  } else {
    console.log("✓ Credit packages already exist");
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (adminEmail) {
    const result = await User.updateOne({ email: adminEmail }, { $set: { role: "ADMIN" } });
    if (result.modifiedCount > 0) {
      console.log(`✓ Promoted ${adminEmail} to ADMIN`);
    } else {
      const user = await User.findOne({ email: adminEmail });
      if (user?.role === "ADMIN") {
        console.log(`✓ ${adminEmail} is already ADMIN`);
      } else {
        console.log(`⚠ ADMIN_EMAIL=${adminEmail} — register first, then re-run seed`);
      }
    }
  }

  console.log("\nSeed complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
