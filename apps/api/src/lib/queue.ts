import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from './redis';

const connection = redis;

// Queue Names
export const QUEUES = {
  VERIFICATION: 'verification-queue',
  BREACH_SCAN: 'breach-scan-queue',
  AI_ENRICH: 'ai-enrich-queue',
  EMAIL: 'email-queue',
  REPORT: 'report-queue',
} as const;

// Queues
export const verificationQueue = new Queue(QUEUES.VERIFICATION, { connection });
export const breachScanQueue = new Queue(QUEUES.BREACH_SCAN, { connection });
export const aiEnrichQueue = new Queue(QUEUES.AI_ENRICH, { connection });
export const emailQueue = new Queue(QUEUES.EMAIL, { connection });
export const reportQueue = new Queue(QUEUES.REPORT, { connection });

// Optional: Queue Events for logging
const logQueueEvents = (queueName: string) => {
  const events = new QueueEvents(queueName, { connection });
  events.on('completed', ({ jobId }) => {
    // console.log(`[${queueName}] Job ${jobId} completed.`);
  });
  events.on('failed', ({ jobId, failedReason }) => {
    console.error(`[${queueName}] Job ${jobId} failed: ${failedReason}`);
  });
};

logQueueEvents(QUEUES.VERIFICATION);
logQueueEvents(QUEUES.BREACH_SCAN);
logQueueEvents(QUEUES.AI_ENRICH);
logQueueEvents(QUEUES.EMAIL);
logQueueEvents(QUEUES.REPORT);
