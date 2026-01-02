import { NFZScraper } from '../../src/scrapers/nfz-scraper';

// Mock axios and axios-cache-interceptor
jest.mock('axios');
jest.mock('axios-cache-interceptor', () => ({
  setupCache: jest.fn((axiosInstance) => axiosInstance)
}));

const axios = require('axios');

describe('NFZScraper', () => {
  let scraper: NFZScraper;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      create: jest.fn().mockReturnThis(),
      post: jest.fn(),
      get: jest.fn()
    };
    
    axios.create = jest.fn(() => mockAxiosInstance);
    
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

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const docs = await scraper.fetchDocuments({
        pageNumber: 0,
        pageSize: 10
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].Id).toBe(12345);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/documents/GetDocumentsNewGrid', {
        pageNumber: 0,
        pageSize: 10
      });
    });

    it('should return empty array when no data', async () => {
      const mockResponse = { data: {} };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const docs = await scraper.fetchDocuments({});
      expect(docs).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

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

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const details = await scraper.fetchDetails(4, 12345);

      expect(details.Name).toBe('Test Document');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/documents/4/details/12345/null');
    });
  });

  describe('downloadAttachment', () => {
    it('should download regular attachment', async () => {
      const mockBuffer = Buffer.from('test data');
      const mockResponse = { data: mockBuffer };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const buffer = await scraper.downloadAttachment(4, 100, false);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/file/GetAttachment/4/100', {
        responseType: 'arraybuffer'
      });
    });

    it('should download ZIPX attachment', async () => {
      const mockBuffer = Buffer.from('test zip data');
      const mockResponse = { data: mockBuffer };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const buffer = await scraper.downloadAttachment(4, 100, true);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/file/GetZipxAttachment/4/100', {
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

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await scraper.fetchRecentDocuments(24);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/documents/GetDocumentsNewGrid', {
        pageNumber: 0,
        pageSize: 100,
        SearchForType: 22,
        InstitutionId: 4
      });
    });
  });
});
