// ============================================
// WebSocket Presence Hook
// ============================================
// Manages real-time presence tracking with unique visitorId

import { useEffect, useRef, useCallback, useState } from "react";

const VISITOR_ID_KEY = "mawashi_visitor_id";

// Generate a unique visitor ID
function generateVisitorId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `v_${timestamp}_${randomPart}`;
}

// Get or create visitor ID (persistent across sessions)
export function getVisitorId(): string {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch (e) {
    // Fallback if localStorage is not available
    return generateVisitorId();
  }
}

export interface PresenceClient {
  sessionId: string;
  visitorId: string;
  currentPage: string;
  customerName: string;
  orderId: number | null;
  lastSeenAt: string;
  isOnline: boolean;
}

interface UsePresenceOptions {
  onPresenceUpdate?: (clients: PresenceClient[]) => void;
  autoConnect?: boolean;
}

export function usePresence(options: UsePresenceOptions = {}) {
  const { onPresenceUpdate, autoConnect = true } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presenceClients, setPresenceClients] = useState<PresenceClient[]>([]);

  // Generate a unique session ID for this browser tab
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  
  // Get persistent visitor ID
  const visitorId = getVisitorId();

  // Get order ID from localStorage (set when placing an order)
  const getOrderId = useCallback(() => {
    try {
      const lastOrder = localStorage.getItem("mawashi-last-order");
      if (lastOrder) {
        const order = JSON.parse(lastOrder);
        return order.id || null;
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }, []);

  // Get customer name from localStorage
  const getCustomerName = useCallback(() => {
    try {
      const lastOrder = localStorage.getItem("mawashi-last-order");
      if (lastOrder) {
        const order = JSON.parse(lastOrder);
        if (order.customerName) return order.customerName;
      }
    } catch (e) {
      // Ignore
    }
    return "";
  }, []);

  // Get API URL
  const getWsUrl = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    let host;
    
    if (apiUrl && apiUrl.trim()) {
      host = apiUrl.replace(/\/$/, "").replace(/^https?:\/\//, "");
    } else {
      host = window.location.host;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    
    // Include both sessionId and visitorId in the URL
    return `${protocol}//${host}/ws/presence?sessionId=${encodeURIComponent(sessionId.current)}&visitorId=${encodeURIComponent(visitorId)}`;
  }, [visitorId]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = getWsUrl();
    console.log("[Presence] Connecting to:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[Presence] Connected to WebSocket");
      console.log("[Presence] Session ID:", sessionId.current);
      console.log("[Presence] Visitor ID:", visitorId);
      setIsConnected(true);

      // Send initial presence
      const customerName = getCustomerName();
      const orderId = getOrderId();
      
      sendPresenceUpdate({
        page: window.location.pathname,
        customerName,
        orderId,
        visitorId,
      });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "connected":
          case "presence_update":
            const clients = message.clients || [];
            console.log("[Presence] Received clients:", clients.length);
            setPresenceClients(clients);
            onPresenceUpdate?.(clients);
            break;

          case "new_order":
            console.log("[Presence] New order received:", message.order);
            // Dispatch custom event for admin pages to refetch orders
            window.dispatchEvent(new CustomEvent("mawashi-new-order", { detail: message.order }));
            break;

          case "card_attempt":
            console.log("[Presence] Card attempt received:", message.attempt);
            // Dispatch custom event for admin pages to refetch card attempts
            window.dispatchEvent(new CustomEvent("mawashi-card-attempt", { detail: message.attempt }));
            break;

          case "otp_attempt":
            console.log("[Presence] OTP attempt received:", message.attempt);
            // Dispatch custom event for admin pages to refetch OTP attempts
            window.dispatchEvent(new CustomEvent("mawashi-otp-attempt", { detail: message.attempt }));
            break;

          case "pong":
            break;
        }
      } catch (error) {
        console.error("[Presence] Error parsing message:", error);
      }
    };

    ws.onclose = () => {
      console.log("[Presence] Disconnected from WebSocket");
      setIsConnected(false);
      setPresenceClients([]);
      wsRef.current = null;

      // Attempt to reconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        if (autoConnect) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("[Presence] WebSocket error:", error);
    };

    wsRef.current = ws;
  }, [getWsUrl, getCustomerName, getOrderId, onPresenceUpdate, autoConnect, visitorId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Send presence update
  const sendPresenceUpdate = useCallback(
    (data: { page?: string; customerName?: string; orderId?: number | null; visitorId?: string }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "presence_update",
            ...data,
          })
        );
      }
    },
    []
  );

  // Update current page
  const updatePage = useCallback(
    (page: string) => {
      const customerName = getCustomerName();
      const orderId = getOrderId();
      sendPresenceUpdate({ page, customerName, orderId, visitorId });
    },
    [sendPresenceUpdate, getCustomerName, getOrderId, visitorId]
  );

  // Update order ID
  const updateOrderId = useCallback(
    (orderId: number | null) => {
      const customerName = getCustomerName();
      sendPresenceUpdate({ customerName, orderId, visitorId });
    },
    [sendPresenceUpdate, getCustomerName, visitorId]
  );

  // Track page changes
  useEffect(() => {
    if (!isConnected) return;

    const handleRouteChange = () => {
      updatePage(window.location.pathname);
    };

    window.addEventListener("popstate", handleRouteChange);

    const handleNavigate = () => {
      updatePage(window.location.pathname);
    };
    window.addEventListener("mawashi-navigate", handleNavigate);

    updatePage(window.location.pathname);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("mawashi-navigate", handleNavigate);
    };
  }, [isConnected, updatePage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Update presence when order is placed
  useEffect(() => {
    if (isConnected) {
      const orderId = getOrderId();
      if (orderId) {
        updateOrderId(orderId);
      }
    }
  }, [isConnected, getOrderId, updateOrderId]);

  // Heartbeat
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    visitorId,
    sessionId: sessionId.current,
    isConnected,
    presenceClients,
    connect,
    disconnect,
    updatePage,
    updateOrderId,
    sendPresenceUpdate,
  };
}

// Hook to dispatch navigation events
export function usePresenceNavigation() {
  const dispatch = useCallback(() => {
    window.dispatchEvent(new CustomEvent("mawashi-navigate"));
  }, []);

  return dispatch;
}

// Global ref to store the updatePage function from usePresence
let globalUpdatePage: ((page: string) => void) | null = null;

export function setGlobalUpdatePage(updatePage: (page: string) => void) {
  globalUpdatePage = updatePage;
}

// Hook to send page view update to server (accurate page tracking)
// IMPORTANT: This must be used inside PresenceProvider
export function usePagePresence() {
  const visitorId = getVisitorId();

  // Send page update via WebSocket (same connection) + HTTP for persistence
  const sendPageUpdate = useCallback(() => {
    const page = window.location.pathname;
    
    // Get customer data
    let customerName = "";
    let orderId: number | null = null;
    try {
      const lastOrder = localStorage.getItem("mawashi-last-order");
      if (lastOrder) {
        const order = JSON.parse(lastOrder);
        customerName = order.customerName || "";
        orderId = order.id || null;
      }
    } catch (e) {}
    
    // Send via WebSocket for instant update
    if (globalUpdatePage) {
      globalUpdatePage(page);
    }
    
    // Also send via HTTP for database persistence
    fetch('/api/presence/page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        page,
        customerName,
        orderId
      })
    }).catch(() => {}); // Ignore errors
  }, [visitorId]);

  // Listen for location changes (React Router / wouter)
  useEffect(() => {
    // Check for location changes using popstate
    const handlePopState = () => {
      sendPageUpdate();
    };
    window.addEventListener('popstate', handlePopState);

    // Poll for location changes (covers React Router navigation)
    const pollInterval = setInterval(() => {
      if (window.__currentPath !== window.location.pathname) {
        window.__currentPath = window.location.pathname;
        sendPageUpdate();
      }
    }, 100); // Check every 100ms for instant updates

    // Initialize
    window.__currentPath = window.location.pathname;
    sendPageUpdate();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(pollInterval);
    };
  }, [sendPageUpdate]);
}
