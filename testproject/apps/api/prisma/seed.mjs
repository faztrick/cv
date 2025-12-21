import { CreatorStatus, PriceType, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@fanhouse.test';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const fanEmail = process.env.SEED_FAN_EMAIL ?? 'fan@fanhouse.test';
  const fanPassword = process.env.SEED_FAN_PASSWORD ?? 'fan123';
  const creatorEmail = process.env.SEED_CREATOR_EMAIL ?? 'creator@fanhouse.test';
  const creatorPassword = process.env.SEED_CREATOR_PASSWORD ?? 'creator123';

  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: Role.ADMIN },
    create: { email: adminEmail, passwordHash: adminHash, role: Role.ADMIN }
  });

  const fanHash = await bcrypt.hash(fanPassword, 10);
  await prisma.user.upsert({
    where: { email: fanEmail },
    update: { passwordHash: fanHash, role: Role.FAN },
    create: { email: fanEmail, passwordHash: fanHash, role: Role.FAN }
  });

  const creatorHash = await bcrypt.hash(creatorPassword, 10);
  const creatorUser = await prisma.user.upsert({
    where: { email: creatorEmail },
    update: { passwordHash: creatorHash, role: Role.CREATOR },
    create: { email: creatorEmail, passwordHash: creatorHash, role: Role.CREATOR }
  });

  const creatorProfile = await prisma.creatorProfile.upsert({
    where: { userId: creatorUser.id },
    update: { status: CreatorStatus.APPROVED, displayName: 'Nova Ray' },
    create: {
      userId: creatorUser.id,
      displayName: 'Nova Ray',
      status: CreatorStatus.APPROVED,
      bio: 'Creator demo profile for the vertical slice.'
    }
  });

  const existingPost = await prisma.post.findFirst({
    where: { creatorId: creatorProfile.id }
  });

  if (!existingPost) {
    await prisma.post.create({
      data: {
        creatorId: creatorProfile.id,
        title: 'Welcome to the slice',
        body: 'This is a demo subscriber-only post to validate gating.',
        priceType: PriceType.SUBSCRIBER,
        priceCents: 0
      }
    });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
