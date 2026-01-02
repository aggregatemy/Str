import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllRecords() {
  console.log('🔧 Naprawa wszystkich rekordów...\n');
  
  // Pobierz wszystkie rekordy aby je naprawić
  const allRecords = await prisma.legalFact.findMany();
  
  console.log(`📊 Łącznie rekordów do sprawdzenia: ${allRecords.length}\n`);
  
  let fixed = 0;
  let unchanged = 0;
  
  for (const record of allRecords) {
    const parts = record.id.split('-');
    let newSourceId = 'unknown';
    let newDocId = record.id;
    
    // Określ sourceId na podstawie ID
    if (record.id.startsWith('eli-sejm-')) {
      newSourceId = parts.slice(0, 3).join('-'); // "eli-sejm-du"
      newDocId = parts.slice(3).join('-');
    } else if (record.id.startsWith('eli-')) {
      newSourceId = parts.slice(0, 2).join('-'); // "eli-mz"
      newDocId = parts.slice(2).join('-');
    } else if (record.id.startsWith('rss-')) {
      newSourceId = parts.slice(0, 2).join('-'); // "rss-zus"
      newDocId = parts.slice(2).join('-');
    } else if (record.id.startsWith('nfz-')) {
      newSourceId = 'nfz';
      newDocId = parts.slice(1).join('-');
    } else if (record.id.startsWith('sejm-')) {
      // Stare ID: "sejm-du-2025-1" → "eli-sejm-du", docId: "2025-1"
      if (record.id.startsWith('sejm-du-')) {
        newSourceId = 'eli-sejm-du';
        newDocId = parts.slice(2).join('-'); // "2025-1"
      } else if (record.id.startsWith('sejm-mp-')) {
        newSourceId = 'eli-sejm-mp';
        newDocId = parts.slice(2).join('-');
      } else {
        newSourceId = 'eli-sejm-du'; // domyślnie DU
        newDocId = parts.slice(2).join('-');
      }
    }
    
    const newCompositeKey = `${newSourceId}:${newDocId}:${record.date}`;
    
    // Sprawdź czy to zmiana
    if (record.sourceId === newSourceId && record.docId === newDocId && record.compositeKey === newCompositeKey) {
      unchanged++;
      continue;
    }
    
    try {
      await prisma.legalFact.update({
        where: { id: record.id },
        data: {
          sourceId: newSourceId,
          docId: newDocId,
          compositeKey: newCompositeKey
        }
      });
      fixed++;
      
      if (fixed % 100 === 0) {
        console.log(`✅ Naprawiono ${fixed}/${allRecords.length}`);
      }
    } catch (error) {
      console.error(`❌ Błąd dla ${record.id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Naprawiono: ${fixed} rekordów`);
  console.log(`⏭️  Bez zmian: ${unchanged} rekordów`);
  console.log(`📊 Razem: ${fixed + unchanged}/${allRecords.length}`);
}

fixAllRecords().finally(() => prisma.$disconnect());
