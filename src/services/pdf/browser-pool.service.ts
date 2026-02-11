import puppeteer, { type Browser } from 'puppeteer';

let browserInstance: Browser | null = null;
let browserLaunching: Promise<Browser> | null = null;

/**
 * Get a shared Puppeteer browser instance.
 * Lazily launches on first call, then reuses.
 * If the browser disconnects, a new one will be launched.
 */
export async function getBrowser(): Promise<Browser> {
  if (browserInstance?.connected) {
    return browserInstance;
  }

  // Avoid launching multiple browsers concurrently
  if (browserLaunching) {
    return browserLaunching;
  }

  browserLaunching = puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    browserInstance = await browserLaunching;

    // Auto-reconnect on disconnect
    browserInstance.on('disconnected', () => {
      browserInstance = null;
      browserLaunching = null;
    });

    return browserInstance;
  } finally {
    browserLaunching = null;
  }
}

/**
 * Close the shared browser instance.
 * Call this during graceful shutdown.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch {
      // Browser may already be closed
    }
    browserInstance = null;
    browserLaunching = null;
  }
}
