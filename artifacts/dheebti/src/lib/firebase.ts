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
    console.log("[FCM] Checking if messaging is supported...");
    const supported = await isSupported();
    console.log("[FCM] Browser support for FCM:", supported);
    
    if (supported) {
      console.log("[FCM] Initializing Firebase Messaging...");
      console.log("[FCM] Firebase Config:", {
        apiKey: firebaseConfig.apiKey?.substring(0, 20) + "...",
        projectId: firebaseConfig.projectId,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId?.substring(0, 20) + "..."
      });
      
      try {
        messaging = getMessaging(app);
        console.log("[FCM] Firebase Messaging initialized successfully");
      } catch (initError: any) {
        console.error("[FCM] Failed to initialize messaging:", initError);
      }
    } else {
      console.error("[FCM] Messaging is not supported in this browser");
    }
  }
  return messaging;
}

// VAPID Key - Firebase Cloud Messaging
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BEl3uHdVKg8DgD6jP3MkgIAKIAc9-qIxoN5sAjZudbLh0YjThu20J33crEBrlez6RaLsIsFxL7vvVPu65CJQ54U";

export { app };

// Request permission and get FCM token
export async function requestNotificationPermission(): Promise<{ 
  success: boolean; 
  token?: string; 
  error?: string;
  errorCode?: string;
}> {
  try {
    console.log("[FCM] Starting notification permission request...");
    console.log("[FCM] VAPID Key:", VAPID_KEY ? `${VAPID_KEY.substring(0, 20)}...` : "NOT SET");
    
    const msg = await getMessagingInstance();
    if (!msg) {
      console.error("[FCM] Error: Messaging not supported by browser");
      return { 
        success: false, 
        error: "المتصفح لا يدعم الإشعارات",
        errorCode: "UNSUPPORTED_BROWSER"
      };
    }

    console.log("[FCM] Requesting notification permission from user...");
    const permission = await Notification.requestPermission();
    console.log("[FCM] Permission result:", permission);
    
    if (permission === 'granted') {
      console.log("[FCM] Permission granted, waiting for Service Worker to be ready...");
      
      // Wait for Service Worker to be ready
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log("[FCM] Service Worker ready:", registration.active?.state || "unknown");
        
        // Small delay to ensure SW is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("[FCM] Getting FCM token...");
        const token = await getToken(msg, { vapidKey: VAPID_KEY });
        console.log("[FCM] Success! Got token:", token ? `${token.substring(0, 30)}...` : "EMPTY");
        if (token) {
          return { success: true, token };
        } else {
          console.error("[FCM] Error: Got empty token");
          return { 
            success: false, 
            error: "فشل في الحصول على رمز الجهاز",
            errorCode: "TOKEN_ERROR"
          };
        }
      } catch (tokenError: any) {
        console.error("[FCM] Token request failed with error:", tokenError);
        console.error("[FCM] Error code:", tokenError.code);
        console.error("[FCM] Error message:", tokenError.message);
        
        // Handle specific Service Worker errors
        if (tokenError.name === 'AbortError' || tokenError.message?.includes('no active Service Worker')) {
          return {
            success: false,
            error: "Service Worker غير جاهز. يرجى إعادة المحاولة بعد لحظة.",
            errorCode: "SW_NOT_READY"
          };
        }
        
        // Check for specific 401 error
        if (tokenError.message?.includes('401') || tokenError.message?.includes('Unauthorized')) {
          return {
            success: false,
            error: "خطأ 401: Firebase يرفض الطلب. تأكد من:\n1. تفعيل Firebase Cloud Messaging API في Google Cloud Console\n2. صحة VAPID Key\n3. صحة Firebase API Key في الإعدادات",
            errorCode: "FCM_401_ERROR"
          };
        }
        
        if (tokenError.code === 'messaging/registration-keys-not-found') {
          return {
            success: false,
            error: "خطأ: مفتاح VAPID غير موجود في Firebase Console. اذهب إلى:\nFirebase Console → Project Settings → Cloud Messaging → Web Push certificates",
            errorCode: "VAPID_KEY_NOT_FOUND"
          };
        }
        
        return {
          success: false,
          error: `خطأ في Firebase: ${tokenError.message}`,
          errorCode: tokenError.code || "TOKEN_REQUEST_FAILED"
        };
      }
    } else if (permission === 'denied') {
      console.error("[FCM] Permission denied by user");
      return { 
        success: false, 
        error: "تم رفض الإذن من المتصفح. يرجى تفعيل الإشعارات من إعدادات المتصفح.",
        errorCode: "PERMISSION_DENIED"
      };
    } else {
      console.error("[FCM] Permission default (not granted or denied)");
      return { 
        success: false, 
        error: "لم يتم السماح بالإشعارات",
        errorCode: "PERMISSION_DEFAULT"
      };
    }
  } catch (error: any) {
    console.error("[FCM] Unexpected error:", error);
    console.error("[FCM] Error code:", error.code);
    console.error("[FCM] Error message:", error.message);
    
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
