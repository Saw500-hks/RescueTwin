import { useState, useEffect } from 'react';
import { getJobStatus } from '../api/client';
import { ProcessingJob } from '../types';

export const useJobStatus = (jobId: string | null) => {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let intervalId: ReturnType<typeof setInterval>;

    const fetchStatus = async () => {
      try {
        const currentStatus = await getJobStatus(jobId);
        setJob(currentStatus);
        
        if (currentStatus.status === 'completed' || currentStatus.status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (err: any) {
        setError(err.message);
        clearInterval(intervalId);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 2000);

    return () => clearInterval(intervalId);
  }, [jobId]);

  return { job, error };
}
