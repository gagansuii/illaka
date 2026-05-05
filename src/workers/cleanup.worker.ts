import { clearEventsCache } from '@/lib/events-cache';
import { eventsRepository } from '@/src/modules/events/events.repository';
import { logger } from '@/src/core/logger';

const RETENTION_DAYS = 30;

export async function processCleanup(now = new Date()): Promise<{ deleted: number; cutoff: string }> {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const deleted = await eventsRepository.deleteExpired(cutoff);
  if (deleted > 0) {
    clearEventsCache();
    logger.info('Cleanup: deleted expired events', { deleted, cutoff: cutoff.toISOString() });
  }

  return { deleted, cutoff: cutoff.toISOString() };
}
