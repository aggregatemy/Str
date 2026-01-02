import { NFZScraper } from '../../src/scrapers/nfz-scraper';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NFZScraper', () => {
  let scraper: NFZScraper;

  beforeEach(() => {
    scraper = new NFZScraper();
    jest.clearAllMocks();
  });

  describe('fetchDocuments', () => {
    it('should fetch documents from NFZ API', async () => {
      const mockResponse = {
        data: {
          DevExtremeDocuments: {
            data: [
              {
                Id: 12345,
                InstitutionId: 4,
                Title: 'Test Document',
                Subject: 'Test Subject',
                Date: '2024-01-15',
                Type: 'Zarządzenie'
              }
            ]
          }
        }
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (scraper as any).client.post = mockPost;

      const docs = await scraper.fetchDocuments({
        pageNumber: 0,
        pageSize: 10
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].Id).toBe(12345);
      expect(mockPost).toHaveBeenCalledWith('/documents/GetDocumentsNewGrid', {
        pageNumber: 0,
        pageSize: 10
      });
    });

    it('should return empty array when no data', async () => {
      const mockResponse = { data: {} };
      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (scraper as any).client.post = mockPost;

      const docs = await scraper.fetchDocuments({});
      expect(docs).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      const mockPost = jest.fn().mockRejectedValue(new Error('API Error'));
      (scraper as any).client.post = mockPost;

      await expect(scraper.fetchDocuments({})).rejects.toThrow('API Error');
    });
  });

  describe('fetchDetails', () => {
    it('should fetch document details', async () => {
      const mockResponse = {
        data: {
          Name: 'Test Document',
          InstitutionId: 4,
          Files: [],
          AmendmentEntries: []
        }
      };

      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      (scraper as any).client.get = mockGet;

      const details = await scraper.fetchDetails(4, 12345);

      expect(details.Name).toBe('Test Document');
      expect(mockGet).toHaveBeenCalledWith('/documents/4/details/12345/null');
    });
  });

  describe('downloadAttachment', () => {
    it('should download regular attachment', async () => {
      const mockBuffer = Buffer.from('test data');
      const mockResponse = { data: mockBuffer };

      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      (scraper as any).client.get = mockGet;

      const buffer = await scraper.downloadAttachment(4, 100, false);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(mockGet).toHaveBeenCalledWith('/file/GetAttachment/4/100', {
        responseType: 'arraybuffer'
      });
    });

    it('should download ZIPX attachment', async () => {
      const mockBuffer = Buffer.from('test zip data');
      const mockResponse = { data: mockBuffer };

      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      (scraper as any).client.get = mockGet;

      const buffer = await scraper.downloadAttachment(4, 100, true);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(mockGet).toHaveBeenCalledWith('/file/GetZipxAttachment/4/100', {
        responseType: 'arraybuffer'
      });
    });
  });

  describe('fetchRecentDocuments', () => {
    it('should fetch documents with default filters', async () => {
      const mockResponse = {
        data: {
          DevExtremeDocuments: {
            data: []
          }
        }
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (scraper as any).client.post = mockPost;

      await scraper.fetchRecentDocuments(24);

      expect(mockPost).toHaveBeenCalledWith('/documents/GetDocumentsNewGrid', {
        pageNumber: 0,
        pageSize: 100,
        SearchForType: 22,
        InstitutionId: 4
      });
    });
  });
});
