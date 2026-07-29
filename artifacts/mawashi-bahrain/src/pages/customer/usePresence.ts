import { useEffect, useRef } from 'react';
import { useUpdatePresence } from '@workspace/api-client-react';

export function usePresence(page: string, label: string, customerName?: string) {
  const update = useUpdatePresence();
  const sessionId = useRef(
    sessionStorage.getItem('mawashi-session-id') || 
    `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    sessionStorage.setItem('mawashi-session-id', sessionId.current);
    let interval: ReturnType<typeof setInterval>;

    const sendPresence = () => {
      update.mutate({
        data: {
          sessionId: sessionId.current,
          page,
          label,
          customerName: customerName || sessionStorage.getItem('mawashi-customer-name') || undefined,
        }
      });
    };

    // Send immediately
    sendPresence();

    // Then every 15 seconds
    interval = setInterval(sendPresence, 15000);

    return () => {
      clearInterval(interval);
      // Mark as inactive on leave
      update.mutate({
        data: {
          sessionId: sessionId.current,
          page,
          label: 'غادر',
          active: false,
        }
      });
    };
  }, [page, label, customerName]);
}
