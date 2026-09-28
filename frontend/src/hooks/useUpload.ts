import { useState } from 'react';
import axios from 'axios';
import { ProcessingJob } from '../types';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (endpoint: string, files: Record<string, File | File[]>): Promise<ProcessingJob | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);
    
    const formData = new FormData();
    Object.entries(files).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(f => formData.append(key, f));
      } else {
        formData.append(key, value);
      }
    });

    try {
      const res = await axios.post(`/api/v1${endpoint}`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });
      return res.data;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFiles, uploading, progress, error };
}
