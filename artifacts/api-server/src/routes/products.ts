import { Router } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { mapProductRow } from "./utils";

const router = Router();

router.get("/products", async (_req, res, next) => {
  try {
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        imageUrl: productsTable.imageUrl,
        image: productsTable.image,
        maxQuantity: productsTable.maxQuantity,
        price: productsTable.price,
        active: productsTable.active,
      })
      .from(productsTable)
      .where(eq(productsTable.active, true))
      .orderBy(desc(productsTable.id));

    res.json(products.map(mapProductRow));
  } catch (error) {
    next(error);
  }
});

export default router;
