import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
  const record = await prisma.legalFact.findFirst({
    where: { sourceId: 'unknown' }
  });
  
  if (record) {
    console.log('Stary rekord z sourceId=unknown:');
    console.log(JSON.stringify(record, null, 2));
  } else {
    console.log('Brak rekordów z sourceId=unknown');
  }
  
  // Sprawdź ile jest takich rekordów
  const count = await prisma.legalFact.count({
    where: { sourceId: 'unknown' }
  });
  console.log(`\nLiczba rekordów z sourceId='unknown': ${count}`);
}

inspect().finally(() => prisma.$disconnect());
