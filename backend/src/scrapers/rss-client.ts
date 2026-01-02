import axios, { AxiosInstance } from 'axios';
import { parseStringPromise } from 'xml2js';
import { logger } from '../utils/logger';
import { RSSItem } from '../types';

export class RSSClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });
    
    logger.info('RSS Client initialized');
  }

  /**
   * Parse RSS feed from URL
   * @param url - RSS feed URL
   * @returns Array of RSS items
   */
  async parseFeed(url: string): Promise<RSSItem[]> {
    try {
      logger.info('Parsing RSS feed', { url });
      
      const response = await this.client.get(url);
      const xml = response.data;
      
      const result = await parseStringPromise(xml);
      
      // Extract items from RSS feed
      const items = result?.rss?.channel?.[0]?.item || [];
      
      const parsedItems: RSSItem[] = items.map((item: any) => ({
        title: item.title?.[0] || '',
        link: item.link?.[0] || '',
        pubDate: item.pubDate?.[0] || '',
        description: item.description?.[0] || '',
        guid: item.guid?.[0]?._ || item.guid?.[0] || item.link?.[0] || ''
      }));
      
      logger.info(`Parsed ${parsedItems.length} items from RSS feed`);
      return parsedItems;
    } catch (error) {
      logger.error('Error parsing RSS feed', { error, url });
      return [];
    }
  }

  /**
   * Fetch items from ZUS RSS feed
   * @returns Array of ZUS RSS items
   */
  async fetchZUSFeed(): Promise<RSSItem[]> {
    const zusUrl = 'https://www.zus.pl/rss';
    return this.parseFeed(zusUrl);
  }

  /**
   * Fetch items from CEZ RSS feed
   * @returns Array of CEZ RSS items
   */
  async fetchCEZFeed(): Promise<RSSItem[]> {
    // CEZ (Centralna Ewidencja i Informacja o Działalności Gospodarczej)
    const cezUrl = 'https://prod.ceidg.gov.pl/rss';
    return this.parseFeed(cezUrl);
  }

  /**
   * Fetch items from multiple RSS feeds
   * @param urls - Array of RSS feed URLs
   * @returns Combined array of RSS items
   */
  async fetchMultipleFeeds(urls: string[]): Promise<RSSItem[]> {
    try {
      const results = await Promise.allSettled(
        urls.map(url => this.parseFeed(url))
      );

      const allItems: RSSItem[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
        } else {
          logger.warn(`Failed to fetch RSS feed at index ${index}`, { 
            error: result.reason 
          });
        }
      });

      return allItems;
    } catch (error) {
      logger.error('Error fetching multiple RSS feeds', { error });
      return [];
    }
  }

  /**
   * Fetch recent items from RSS feed (within last N days)
   * @param url - RSS feed URL
   * @param days - Number of days to look back
   * @returns Array of recent RSS items
   */
  async fetchRecentItems(url: string, days: number = 7): Promise<RSSItem[]> {
    const items = await this.parseFeed(url);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return items.filter(item => {
      const pubDate = new Date(item.pubDate);
      return pubDate >= cutoffDate;
    });
  }
}
