import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";

async function main() {
  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME || "Super Admin";

  if (!username || !password) {
    throw new Error(
      "SUPERADMIN_USERNAME dan SUPERADMIN_PASSWORD harus di-set di .env sebelum menjalankan seed."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, name, role: "SUPER_ADMIN", isActive: true },
    create: { username, passwordHash, name, role: "SUPER_ADMIN" },
  });

  console.log(`Super admin siap: ${user.username} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
