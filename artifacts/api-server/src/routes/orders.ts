import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, productsTable, adminDevicesTable } from "@workspace/db";
import { CreateOrderBody } from "@workspace/api-zod";
import { sendPushNotification } from "../lib/firebase-admin";

// Dynamic import to avoid circular dependency
let presenceManager: any = null;
async function getPresenceManager() {
  if (!presenceManager) {
    try {
      const module = await import("../websocket/manager");
      presenceManager = module.presenceManager;
    } catch (e) {
      console.error("Failed to load presence manager:", e);
    }
  }
  return presenceManager;
}

// Send push notification to all admin devices
async function notifyAdminsOfNewOrder(order: any) {
  try {
    const devices = await db
      .select()
      .from(adminDevicesTable)
      .where(eq(adminDevicesTable.isActive, true));

    const preparationLabel = order.preparationType === 'slaughtered' ? 'مذبوح مقطع' : 
                           order.preparationType === 'live' ? 'حي بدون ذبح' : '';

    for (const device of devices) {
      await sendPushNotification(device.fcmToken, {
        title: "🆕 طلب جديد!",
        body: `${order.customerName} - ${order.productName} (${order.quantity}) ${preparationLabel ? `- ${preparationLabel}` : ''}`,
        tag: `order-${order.id}`,
        data: {
          type: "new_order",
          orderId: order.id.toString(),
          customerName: order.customerName,
          phone: order.phone,
          productName: order.productName,
          quantity: order.quantity.toString(),
          timestamp: order.createdAt.toISOString(),
        },
      });
    }

    console.log(`[PUSH] Sent notifications to ${devices.length} admin devices`);
  } catch (error) {
    console.error("[PUSH] Error sending notifications:", error);
  }
}

const router = Router();

router.post("/orders", async (req, res, next) => {
  try {
    const body = CreateOrderBody.parse(req.body);

    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
      })
      .from(productsTable)
      .where(eq(productsTable.id, body.productId));

    const product = products[0];
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const paymentStatus =
      body.paymentStatus ??
      (body.paymentMethod === "pay_now" ? "pending" : "not_required");

    const [order] = await db
      .insert(ordersTable)
      .values({
        productId: body.productId,
        productName: product.name,
        quantity: body.quantity,
        customerName: body.customerName,
        phone: body.phone,
        address: body.address,
        pickupDate: body.pickupDate.toISOString().slice(0, 10),
        preparationType: body.preparationType,
        paymentMethod: body.paymentMethod,
        paymentStatus,
        status: "new",
        visitorId: body.visitorId,
      })
      .returning();

    // Broadcast new order to all admin clients for real-time updates
    const pm = await getPresenceManager();
    if (pm) {
      pm.broadcastToAdmins({
        type: "new_order",
        order: {
          id: order.id,
          customerName: order.customerName,
          phone: order.phone,
          productName: order.productName,
          createdAt: order.createdAt.toISOString(),
        },
      });
    }

    // Send push notifications to all admin devices (async, don't wait)
    notifyAdminsOfNewOrder(order);

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

export default router;
