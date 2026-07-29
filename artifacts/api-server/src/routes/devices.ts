import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, adminDevicesTable } from "@workspace/db";
import { sendTestNotification } from "../lib/firebase-admin";

const router = Router();

// Save or update FCM token for admin device
router.post("/admin/devices", async (req, res, next) => {
  try {
    const { fcmToken, deviceName, deviceType, browser, os } = req.body;

    if (!fcmToken) {
      res.status(400).json({ error: "FCM token is required" });
      return;
    }

    // Check if token already exists
    const existing = await db
      .select()
      .from(adminDevicesTable)
      .where(eq(adminDevicesTable.fcmToken, fcmToken))
      .limit(1);

    if (existing.length > 0) {
      // Update last used time
      await db
        .update(adminDevicesTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(adminDevicesTable.id, existing[0].id));

      res.status(200).json({ 
        success: true, 
        message: "تم تحديث بيانات الجهاز",
        deviceId: existing[0].id,
        isNew: false
      });
      return;
    }

    // Deactivate any existing devices with same browser and OS to avoid duplicates
    if (browser && os) {
      await db
        .update(adminDevicesTable)
        .set({ isActive: false })
        .where(and(
          eq(adminDevicesTable.browser, browser),
          eq(adminDevicesTable.os, os),
          eq(adminDevicesTable.isActive, true)
        ));
      console.log(`[Devices] Deactivated old devices for ${browser} on ${os}`);
    }

    // Insert new device
    const [newDevice] = await db
      .insert(adminDevicesTable)
      .values({
        fcmToken,
        deviceName: deviceName || `${browser || "Unknown"} on ${os || "Unknown"}`,
        deviceType: deviceType || "desktop",
        browser: browser || "Unknown",
        os: os || "Unknown",
        isActive: true,
      })
      .returning();

    console.log(`[Devices] Registered new device: ${newDevice.deviceName} (${newDevice.id})`);

    res.status(201).json({ 
      success: true, 
      message: "تم تسجيل الجهاز بنجاح",
      deviceId: newDevice.id,
      isNew: true
    });
  } catch (error: any) {
    console.error("Error saving device:", error);
    
    // Handle PostgreSQL unique constraint violation
    if (error.code === "23505") {
      res.status(409).json({ 
        success: false, 
        error: "هذا الجهاز مسجل بالفعل",
        errorCode: "DUPLICATE_DEVICE"
      });
      return;
    }
    
    next(error);
  }
});

// Remove device (logout from notifications)
router.delete("/admin/devices/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    await db
      .delete(adminDevicesTable)
      .where(eq(adminDevicesTable.fcmToken, token));

    res.status(200).json({ 
      success: true, 
      message: "تم إلغاء تسجيل الجهاز" 
    });
  } catch (error) {
    next(error);
  }
});

// Get all registered devices
router.get("/admin/devices", async (req, res, next) => {
  try {
    const devices = await db
      .select()
      .from(adminDevicesTable)
      .where(eq(adminDevicesTable.isActive, true));

    res.status(200).json(devices);
  } catch (error) {
    next(error);
  }
});

// Send test notification to a specific device
router.post("/admin/devices/test/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    const adminName = req.body.adminName || "المدير";

    const result = await sendTestNotification(token, adminName);

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: "تم إرسال الإشعار التجريبي بنجاح",
        messageId: result.messageId
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error || "فشل إرسال الإشعار"
      });
    }
  } catch (error) {
    next(error);
  }
});

// Check device status
router.get("/admin/devices/check/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const device = await db
      .select()
      .from(adminDevicesTable)
      .where(and(
        eq(adminDevicesTable.fcmToken, token),
        eq(adminDevicesTable.isActive, true)
      ))
      .limit(1);

    if (device.length > 0) {
      res.status(200).json({ 
        registered: true, 
        device: device[0] 
      });
    } else {
      res.status(404).json({ 
        registered: false 
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
