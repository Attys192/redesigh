/**
 * Parser Utilities
 * Shared helper functions for the ParserService
 */

import * as https from 'https';
import { Logger } from '@nestjs/common';

/**
 * Creates an HTTPS agent that ignores certificate errors
 * Required for accessing natk.ru with Ministry of Digital Development certificates
 */
export function createHttpsAgent(): https.Agent {
  return new https.Agent({ rejectUnauthorized: false });
}

/**
 * Standard headers for HTTP requests to avoid being blocked
 */
export function getStandardHeaders(): Record<string, string> {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  };
}

/**
 * Sleep utility for ethical scraping (prevents overwhelming the server)
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Default sleep durations for different operations
 */
export const SLEEP_DURATION = {
  SHORT: 1000,   // 1 second - between quick operations
  MEDIUM: 1500,  // 1.5 seconds - between page requests
  LONG: 2000,    // 2 seconds - after heavy operations
} as const;

/**
 * Cleans document titles by removing common artifacts and formatting
 * @param title - Raw title string
 * @returns Cleaned title
 */
export function cleanDocTitle(title: string): string {
  let clean = title
    .replace(/скачать/gi, '')
    .replace(/по ссылке/gi, '')
    .replace(/ссылке/gi, '')
    .replace(/ЭЦП/g, '')
    .replace(/pdf/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/можно ознакомиться/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[\.\,\:\;]+$/g, '')
    .trim();

  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  
  return clean.length > 120 ? clean.substring(0, 120) + '...' : clean;
}

/**
 * Checks if a URL is a "junk" link that should be ignored
 * @param href - URL to check
 * @returns True if the link should be ignored
 */
export function isJunkLink(href: string): boolean {
  const lowerHref = href.toLowerCase();
  return lowerHref.includes('javascript:') ||
         lowerHref.includes('tel:') ||
         lowerHref.includes('mailto:') ||
         lowerHref.includes('vk.com') ||
         lowerHref.includes('t.me') ||
         lowerHref.includes('ok.ru') ||
         lowerHref.includes('sign') ||
         lowerHref.includes('.sig') ||
         lowerHref.includes('.zip') ||
         lowerHref.includes('.rar');
}

/**
 * Converts a relative URL to absolute
 * @param relativeUrl - The relative URL
 * @param baseUrl - The base domain (default: https://natk.ru)
 * @returns Absolute URL
 */
export function toAbsoluteUrl(relativeUrl: string, baseUrl: string = 'https://natk.ru'): string {
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }
  if (relativeUrl.startsWith('/')) {
    return `${baseUrl}${relativeUrl}`;
  }
  return `${baseUrl}/${relativeUrl}`;
}

/**
 * Converts a small image URL to full size
 * НАТК uses /sm/ for thumbnails, /full/ for full resolution
 * @param imageUrl - The image URL (relative or absolute)
 * @returns Full resolution image URL or null
 */
export function getFullSizeImageUrl(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null;
  
  // Replace /sm/ with /full/ for higher resolution
  const fullSizeUrl = imageUrl.replace('/sm/', '/full/');
  
  // Convert to absolute URL if needed
  if (fullSizeUrl.startsWith('http')) {
    return fullSizeUrl;
  }
  return toAbsoluteUrl(fullSizeUrl);
}

/**
 * Parses Russian date format (e.g., "16 марта 2026 г.") into a Date object
 * @param dateStr - Russian date string
 * @returns Parsed Date or current date if parsing fails
 */
export function parseRussianDate(dateStr: string): Date {
  const months: Record<string, number> = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
    'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
  };
  
  // Expected format: "16 марта 2026 г."
  const cleanStr = dateStr.replace(' г.', '').trim();
  const parts = cleanStr.split(' ');
  
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = months[parts[1].toLowerCase()];
    const year = parseInt(parts[2], 10);
    
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  return new Date(); // Fallback to today
}

/**
 * Regular expressions for common parsing patterns
 */
export const REGEX_PATTERNS = {
  // Matches specialty codes like 09.02.01
  SPECIALTY_CODE: /\d{2}\.\d{2}\.\d{2}/,
  // Matches passing score like 4.65
  PASSING_SCORE: /[3-5]\.\d{2}/,
  // Matches email addresses
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  // Matches image extensions
  IMAGE_EXTENSIONS: /\.(jpg|jpeg|png|gif|webp)$/i,
} as const;

/**
 * Logger wrapper for consistent parser logging
 */
export class ParserLogger {
  private readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  log(message: string): void {
    this.logger.log(message);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  error(message: string, error?: Error): void {
    this.logger.error(`${message}${error ? `: ${error.message}` : ''}`);
  }

  // Common log messages
  startParsing(entity: string): void {
    this.logger.log(`🚀 Начинаем парсинг ${entity}...`);
  }

  endParsing(entity: string, count: number): void {
    this.logger.log(`✅ Парсинг ${entity} завершен! Найдено: ${count}`);
  }

  sleep(duration: number): void {
    this.logger.debug(`⏳ Пауза ${duration}мс...`);
  }
}

/**
 * Batch processor for handling large datasets efficiently
 */
export class BatchProcessor<T> {
  constructor(
    private readonly batchSize: number = 100,
    private readonly sleepBetweenBatches: number = 0
  ) {}

  async process(items: T[], processor: (item: T) => Promise<void>): Promise<void> {
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      await Promise.all(batch.map(processor));
      
      if (this.sleepBetweenBatches > 0 && i + this.batchSize < items.length) {
        await sleep(this.sleepBetweenBatches);
      }
    }
  }
}
