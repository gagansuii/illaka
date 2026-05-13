import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(join(__dirname, '..', '.env')); } catch { /* already in env */ }

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const name  = process.argv[3] ?? 'Public API Key';

  if (!email) {
    console.error('Usage: node scripts/create-api-key.mjs <your-email> [key-name]');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }

  const count = await prisma.apiKey.count({ where: { userId: user.id } });
  if (count >= 10) {
    console.error('This account already has 10 API keys (the maximum).');
    process.exit(1);
  }

  const raw     = `ik_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(raw).digest('hex');
  const prefix  = raw.slice(0, 8);

  const record = await prisma.apiKey.create({
    data: { userId: user.id, name, keyHash, prefix },
  });

  console.log('\n✔  API key created');
  console.log(`   ID     : ${record.id}`);
  console.log(`   Name   : ${record.name}`);
  console.log(`   Prefix : ${record.prefix}…`);
  console.log(`\n   KEY (shown once — copy it now):\n   ${raw}\n`);
  console.log('Pass it via:  x-api-key: <key>  in request headers.');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
