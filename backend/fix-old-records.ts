import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOldRecords() {
  console.log('🔧 Naprawa starych rekordów...\n');
  
  const oldRecords = await prisma.legalFact.findMany({
    where: { sourceId: 'unknown' },
    take: 10
  });
  
  console.log('Przykłady starych rekordów:');
  oldRecords.forEach(r => {
    console.log(`  id="${r.id}" sourceId="${r.sourceId}" docId="${r.docId}"`);
  });
  
  console.log('\n🔄 Generuję prawidłowe sourceId i docId na podstawie ID...\n');
  
  // Pobierz wszystkie stare rekordy
  const allOldRecords = await prisma.legalFact.findMany({
    where: { sourceId: 'unknown' }
  });
  
  let fixed = 0;
  
  for (const record of allOldRecords) {
    const parts = record.id.split('-');
    let newSourceId = 'unknown';
    let newDocId = record.id;
    
    if (record.id.startsWith('eli-sejm-')) {
      newSourceId = parts.slice(0, 3).join('-'); // "eli-sejm-du"
      newDocId = parts.slice(3).join('-');
    } else if (record.id.startsWith('eli-')) {
      newSourceId = parts.slice(0, 2).join('-'); // "eli-mz"
      newDocId = parts.slice(2).join('-');
    } else if (record.id.startsWith('rss-')) {
      newSourceId = parts.slice(0, 2).join('-');
      newDocId = parts.slice(2).join('-');
    } else if (record.id.startsWith('nfz-')) {
      newSourceId = 'nfz';
      newDocId = parts.slice(1).join('-');
    }
    
    const newCompositeKey = `${newSourceId}:${newDocId}:${record.date}`;
    
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
        console.log(`✅ Naprawiono ${fixed}/${allOldRecords.length}`);
      }
    } catch (error) {
      console.error(`❌ Błąd dla ${record.id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Naprawiono ${fixed}/${allOldRecords.length} rekordów`);
}

fixOldRecords().finally(() => prisma.$disconnect());
