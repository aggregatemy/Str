import { DeduplicationService } from '../../src/services/deduplication';
import { StorageService } from '../../src/services/storage';

describe('DeduplicationService', () => {
  let service: DeduplicationService;

  beforeEach(() => {
    // Use in-memory database for tests with unique name per test
    process.env.DATABASE_PATH = `:memory:`;
    service = new DeduplicationService();
  });

  describe('exists', () => {
    it('should return false for non-existent document', () => {
      const exists = service.exists('non-existent-id');
      expect(exists).toBe(false);
    });

    it('should return true for existing document', async () => {
      const storage = new StorageService();
      
      await storage.saveLegalUpdate({
        id: 'test-id-1',
        ingestMethod: 'scraper',
        title: 'Test Document',
        summary: 'Test summary',
        date: '2024-01-15',
        impact: 'medium',
        category: 'Test',
        legalStatus: 'obowiązujący',
        officialRationale: 'Test rationale'
      });

      const exists = service.exists('test-id-1');
      expect(exists).toBe(true);
    });
  });

  describe('filterNew', () => {
    it('should filter out existing documents', async () => {
      const storage = new StorageService();
      
      // Save one document
      await storage.saveLegalUpdate({
        id: 'nfz-200',
        ingestMethod: 'scraper',
        title: 'Existing Document',
        summary: 'Summary',
        date: '2024-01-15',
        impact: 'medium',
        category: 'Test',
        legalStatus: 'obowiązujący',
        officialRationale: 'Rationale'
      });

      const documents = [
        { Id: 200, Title: 'Existing' },
        { Id: 201, Title: 'New' },
        { Id: 202, Title: 'Also New' }
      ];

      const newDocs = await service.filterNew(documents);

      expect(newDocs).toHaveLength(2);
      expect(newDocs[0].Id).toBe(201);
      expect(newDocs[1].Id).toBe(202);
    });

    it('should handle documents with different ID formats', async () => {
      const documents = [
        { Id: 300 },
        { id: 'eli-456' },
        { guid: 'rss-789' }
      ];

      const newDocs = await service.filterNew(documents);
      expect(newDocs).toHaveLength(3);
    });

    it('should return all documents when none exist', async () => {
      const documents = [
        { Id: 400 },
        { Id: 401 },
        { Id: 402 }
      ];

      const newDocs = await service.filterNew(documents);
      expect(newDocs).toHaveLength(3);
    });
  });

  describe('filterNewIds', () => {
    it('should filter out existing IDs', async () => {
      const storage = new StorageService();
      
      await storage.saveLegalUpdate({
        id: 'existing-1',
        ingestMethod: 'scraper',
        title: 'Test',
        summary: 'Test',
        date: '2024-01-15',
        impact: 'medium',
        category: 'Test',
        legalStatus: 'obowiązujący',
        officialRationale: 'Test'
      });

      const ids = ['existing-1', 'new-1', 'new-2'];
      const newIds = service.filterNewIds(ids);

      expect(newIds).toHaveLength(2);
      expect(newIds).toContain('new-1');
      expect(newIds).toContain('new-2');
      expect(newIds).not.toContain('existing-1');
    });
  });
});
