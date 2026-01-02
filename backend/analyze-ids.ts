import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeIds() {
  const records = await prisma.legalFact.findMany({
    take: 1000
  });
  
  const patterns = new Map<string, number>();
  
  for (const r of records) {
    let pattern = 'other';
    if (r.id.startsWith('eli-sejm-')) pattern = 'eli-sejm-*';
    else if (r.id.startsWith('eli-')) pattern = 'eli-*';
    else if (r.id.startsWith('rss-')) pattern = 'rss-*';
    else if (r.id.startsWith('nfz-')) pattern = 'nfz-*';
    else if (r.id.startsWith('sejm-')) pattern = 'sejm-*';
    else if (r.id.match(/^[a-z]+-[0-9]+-[0-9]+$/)) pattern = 'name-year-number';
    
    patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
  }
  
  console.log('Wzorce ID w bazie:');
  patterns.forEach((count, pattern) => {
    console.log(`  ${pattern}: ${count}`);
  });
  
  // Pokaz kilka przykładów z każdej kategorii
  console.log('\nPrzykłady:');
  const samples = new Map<string, boolean>();
  for (const r of records) {
    let pattern = 'other';
    if (r.id.startsWith('eli-sejm-')) pattern = 'eli-sejm-*';
    else if (r.id.startsWith('eli-')) pattern = 'eli-*';
    else if (r.id.startsWith('rss-')) pattern = 'rss-*';
    else if (r.id.startsWith('nfz-')) pattern = 'nfz-*';
    else if (r.id.startsWith('sejm-')) pattern = 'sejm-*';
    
    if (!samples.has(pattern)) {
      console.log(`  ${pattern}: "${r.id}"`);
      samples.set(pattern, true);
    }
  }
}

analyzeIds().finally(() => prisma.$disconnect());
