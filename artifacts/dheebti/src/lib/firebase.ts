import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBdNnIO4o1apFPBo8IaSYVHUuKKLtJ3Ln0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zabihte.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zabihte",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zabihte.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "57398094197",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:57398094197:web:944c6d0482009f48b0cb3c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Messaging
let messaging: ReturnType<typeof getMessaging> | null = null;

export async function getMessagingInstance() {
  if (!messaging) {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
    }
  }
  return messaging;
}

// VAPID Key - you need to add this to your Firebase project
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BCFjGGJYBtNJrdyXswF-tD3rMiAIPeyYmoxABN74Fx1rMPdQGEZxrj8chSjlk3Ogc2AzzvVMCx_wOtLquKh8Yi8Wu4e-viNQz89O85ACf0UaL1Y40voyf3oznCARueTZKo";

export { app };

// Request permission and get FCM token
export async function requestNotificationPermission(): Promise<{ 
  success: boolean; 
  token?: string; 
  error?: string;
  errorCode?: string;
}> {
  try {
    const msg = await getMessagingInstance();
    if (!msg) {
      return { 
        success: false, 
        error: "المتصفح لا يدعم الإشعارات",
        errorCode: "UNSUPPORTED_BROWSER"
      };
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(msg, { vapidKey: VAPID_KEY });
      if (token) {
        return { success: true, token };
      } else {
        return { 
          success: false, 
          error: "فشل في الحصول على رمز الجهاز",
          errorCode: "TOKEN_ERROR"
        };
      }
    } else if (permission === 'denied') {
      return { 
        success: false, 
        error: "تم رفض الإذن من المتصفح. يرجى تفعيل الإشعارات من إعدادات المتصفح.",
        errorCode: "PERMISSION_DENIED"
      };
    } else {
      return { 
        success: false, 
        error: "لم يتم السماح بالإشعارات",
        errorCode: "PERMISSION_DEFAULT"
      };
    }
  } catch (error: any) {
    console.error("Firebase Error:", error);
    
    // Handle specific Firebase errors
    if (error.code === 'messaging/registration-keys-not-found') {
      return {
        success: false,
        error: "خطأ في إعدادات Firebase: مفتاح VAPID غير موجود. يرجى مراجعة إعدادات Firebase Cloud Messaging.",
        errorCode: "VAPID_KEY_NOT_FOUND"
      };
    }
    if (error.code === 'messaging/push-subscription-change') {
      return {
        success: false,
        error: "تم تغيير اشتراك الإشعارات. يرجى المحاولة مرة أخرى.",
        errorCode: "SUBSCRIPTION_CHANGE"
      };
    }
    if (error.code === 'messaging/token-subscribe-failed') {
      return {
        success: false,
        error: "فشل في الاشتراك في الإشعارات. قد يكون المفتاح غير صحيح أو منتهي الصلاحية.",
        errorCode: "TOKEN_SUBSCRIBE_FAILED"
      };
    }
    
    return { 
      success: false, 
      error: error.message || "حدث خطأ غير متوقع",
      errorCode: error.code || "UNKNOWN_ERROR"
    };
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  getMessagingInstance().then(msg => {
    if (msg) {
      onMessage(msg, callback);
    }
  });
}

// Check if notifications are supported
export async function isNotificationSupported(): Promise<boolean> {
  return await isSupported();
}

// Check current permission status
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
