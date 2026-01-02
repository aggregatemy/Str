import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const facts = await prisma.legalFact.groupBy({
    by: ['compositeKey'],
    _count: true,
    having: {
      compositeKey: {
        _count: {
          gt: 1
        }
      }
    }
  });
  
  console.log(`Znaleziono ${facts.length} zduplikowanych kluczy:`);
  
  for (const fact of facts) {
    console.log(`${fact.compositeKey}: ${fact._count} wystąpień`);
  }
  
  // Sprawdź ile jest pustych kluczy
  const emptyKeys = await prisma.legalFact.count({
    where: {
      compositeKey: ""
    }
  });
  
  console.log(`\nLiczba rekordów z pustym compositeKey: ${emptyKeys}`);
}

check().finally(() => prisma.$disconnect());
