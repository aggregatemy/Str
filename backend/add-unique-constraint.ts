import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addUniqueConstraint() {
  try {
    await prisma.$executeRawUnsafe(
      'CREATE UNIQUE INDEX LegalFact_compositeKey_key ON LegalFact(compositeKey)'
    );
    console.log('✅ Utworzono unikatowy indeks na compositeKey');
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addUniqueConstraint();
