import { logger } from '../utils/logger';
import { fetchAndStorePublicCrime, getLastFetchTime } from './publicCrimeService';

const REFRESH_INTERVAL_MS = 45 * 60 * 1000;  // 45 minutes

let cronHandle: NodeJS.Timeout | null = null;

async function runFetch() {
  try {
    logger.info('[Cron] Running public crime news refresh...');
    const count = await fetchAndStorePublicCrime();
    logger.info(`[Cron] Refresh complete — ${count} new incidents stored`);
  } catch (err) {
    logger.error('[Cron] Public crime refresh failed', { err: String(err).substring(0, 200) });
  }
}

export async function startCronService(): Promise<void> {
  // On startup: check if last fetch was over 45 min ago, if so run immediately
  const lastFetch = await getLastFetchTime();
  const stale = !lastFetch || (Date.now() - lastFetch.getTime()) > REFRESH_INTERVAL_MS;

  if (stale) {
    // Run after 10s delay to let server fully boot first
    setTimeout(() => { runFetch(); }, 10000);
  } else {
    const nextIn = REFRESH_INTERVAL_MS - (Date.now() - lastFetch!.getTime());
    logger.info(`[Cron] Last fetch was recent. Next refresh in ${Math.round(nextIn / 60000)} min`);
  }

  // Schedule recurring refresh
  cronHandle = setInterval(runFetch, REFRESH_INTERVAL_MS);
  logger.info(`[Cron] Public crime news scheduler started (every ${REFRESH_INTERVAL_MS / 60000} min)`);
}

export function stopCronService(): void {
  if (cronHandle) { clearInterval(cronHandle); cronHandle = null; }
}
