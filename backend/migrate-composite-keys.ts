import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCompositeKeys() {
  console.log('🔄 Rozpoczynam migrację compositeKey...');
  
  // Pobierz wszystkie rekordy z pustym compositeKey
  const facts = await prisma.legalFact.findMany({
    where: {
      compositeKey: ""
    }
  });
  
  console.log(`📊 Znaleziono ${facts.length} rekordów do migracji`);
  
  let updated = 0;
  let errors = 0;
  
  for (const fact of facts) {
    try {
      // Wyodrębnij sourceId i docId z starego ID
      const parts = fact.id.split('-');
      let sourceId = 'unknown';
      let docId = fact.id;
      
      if (fact.id.startsWith('eli-sejm-')) {
        // Format: eli-sejm-du-2025-123 -> sourceId: "eli-sejm-du", docId: "2025-123"
        sourceId = parts.slice(0, 3).join('-'); // "eli-sejm-du" lub "eli-sejm-mp"
        docId = parts.slice(3).join('-');
      } else if (fact.id.startsWith('eli-')) {
        // Format: eli-mz-2025-123 -> sourceId: "eli-mz", docId: "2025-123"
        sourceId = parts.slice(0, 2).join('-');
        docId = parts.slice(2).join('-');
      } else if (fact.id.startsWith('rss-')) {
        // Format: rss-zus-timestamp-random -> sourceId: "rss-zus", docId: "timestamp-random"
        sourceId = parts.slice(0, 2).join('-'); // "rss-zus" lub "rss-cez"
        docId = parts.slice(2).join('-');
      } else if (fact.id.startsWith('nfz-')) {
        // Format: nfz-... -> sourceId: "nfz"
        sourceId = 'nfz';
        docId = parts.slice(1).join('-');
      }
      
      const compositeKey = `${sourceId}:${docId}:${fact.date}`;
      
      // Aktualizuj rekord
      await prisma.legalFact.update({
        where: { id: fact.id },
        data: {
          compositeKey,
          sourceId,
          docId
        }
      });
      
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`✅ Zaktualizowano ${updated}/${facts.length} rekordów...`);
      }
    } catch (error) {
      console.error(`❌ Błąd dla rekordu ${fact.id}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n✅ Migracja zakończona!`);
  console.log(`   📊 Zaktualizowano: ${updated} rekordów`);
  console.log(`   ❌ Błędy: ${errors} rekordów`);
}

migrateCompositeKeys().finally(() => prisma.$disconnect());
