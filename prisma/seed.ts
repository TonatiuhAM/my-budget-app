import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const CATEGORIAS = [
  "Comida",
  "Transporte",
  "Entretenimiento",
  "Servicios",
  "Salud",
  "Educación",
  "Ropa",
  "Hogar",
  "Suscripciones",
  "Otros",
];

async function main() {
  console.log("Seeding database...");

  for (const nombre of CATEGORIAS) {
    await db.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log(`Created ${CATEGORIAS.length} categories`);

  const hashedPassword = await bcrypt.hash("admin123", 12);
  await db.user.upsert({
    where: { email: "admin@budget.local" },
    update: {},
    create: {
      email: "admin@budget.local",
      name: "Admin",
      password: hashedPassword,
    },
  });
  console.log("Created test user: admin@budget.local / admin123");

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
