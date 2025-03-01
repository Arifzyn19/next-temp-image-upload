import cron from 'node-cron';
import { cleanupExpiredFiles } from '../actions';

let isInitialized = false;

export function initScheduler() {
  if (isInitialized) {
    return;
  }
  
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled cleanup task:', new Date().toISOString());
    try {
      const result = await cleanupExpiredFiles();
      console.log('Cleanup result:', result);
    } catch (error) {
      console.error('Error in scheduled cleanup task:', error);
    }
  });
  
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cleanup task:', new Date().toISOString());
    try {
      const result = await cleanupExpiredFiles();
      console.log('Daily cleanup result:', result);
    } catch (error) {
      console.error('Error in daily cleanup task:', error);
    }
  });
  
  isInitialized = true;
  console.log('Cleanup scheduler initialized');
} 