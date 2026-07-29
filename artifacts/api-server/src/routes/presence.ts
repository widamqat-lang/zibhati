import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, presenceTable, visitorsTable } from "@workspace/db";
import { UpdatePresenceBody } from "@workspace/api-zod";

const router = Router();

router.post("/presence", async (req, res, next) => {
  try {
    const body = UpdatePresenceBody.parse(req.body);
    const now = new Date();

    const existing = await db
      .select()
      .from(presenceTable)
      .where(eq(presenceTable.sessionId, body.sessionId));

    if (existing.length > 0) {
      await db
        .update(presenceTable)
        .set({
          page: body.page,
          label: body.label,
          customerName: body.customerName ?? null,
          lastSeenAt: now,
        })
        .where(eq(presenceTable.sessionId, body.sessionId));
    } else {
      await db.insert(presenceTable).values({
        sessionId: body.sessionId,
        page: body.page,
        label: body.label,
        customerName: body.customerName ?? null,
        lastSeenAt: now,
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Update page view by visitorId (accurate page tracking)
router.post("/presence/page", async (req, res, next) => {
  try {
    const { visitorId, page, customerName, orderId } = req.body;
    
    if (!visitorId) {
      return res.status(400).json({ error: "visitorId is required" });
    }

    const now = new Date();

    // Update visitors table
    const existingVisitor = await db
      .select()
      .from(visitorsTable)
      .where(eq(visitorsTable.visitorId, visitorId));

    if (existingVisitor.length > 0) {
      await db
        .update(visitorsTable)
        .set({
          currentPage: page,
          lastVisit: now,
          lastSeenAt: now,
        })
        .where(eq(visitorsTable.visitorId, visitorId));
    } else {
      // Create visitor record if doesn't exist
      await db.insert(visitorsTable).values({
        visitorId,
        currentPage: page,
        lastSeenAt: now,
        lastVisit: now,
      });
    }

    // Also update presence table for real-time tracking
    if (orderId) {
      // Find existing presence by orderId or create by sessionId
      const existingPresence = await db
        .select()
        .from(presenceTable)
        .where(eq(presenceTable.sessionId, `visitor_${visitorId}`));

      if (existingPresence.length > 0) {
        await db
          .update(presenceTable)
          .set({
            page,
            label: page,
            customerName: customerName || null,
            visitorId,
            lastSeenAt: now,
          })
          .where(eq(presenceTable.sessionId, `visitor_${visitorId}`));
      } else {
        await db.insert(presenceTable).values({
          sessionId: `visitor_${visitorId}`,
          page,
          label: page,
          customerName: customerName || null,
          visitorId,
          lastSeenAt: now,
        });
      }
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
