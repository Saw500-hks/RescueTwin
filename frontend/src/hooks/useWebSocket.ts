import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (jobId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const connect = () => {
      const url = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/progress/${jobId}`;
      ws.current = new WebSocket(url);

      ws.current.onopen = () => setConnected(true);
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      };

      ws.current.onclose = () => {
        setConnected(false);
        // Auto reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [jobId]);

  return { messages, connected };
}
