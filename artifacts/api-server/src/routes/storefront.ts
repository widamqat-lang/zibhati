import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db, productsTable, siteContentTable } from "@workspace/db";
import { mapProductRow, mapSiteContentRow } from "./utils";

const router = Router();

const defaultContent = {
  brandName: "مواشي البحرين",
  heroTitle: "",
  heroText: "",
  heroImageUrl: "",
  navLinks: [] as string[],
};

router.get("/storefront", async (_req, res, next) => {
  try {
    const [content] = await db
      .select({
        brandName: siteContentTable.brandName,
        heroTitle: siteContentTable.heroTitle,
        heroText: siteContentTable.heroText,
        heroImageUrl: siteContentTable.heroImageUrl,
        navLinks: siteContentTable.navLinks,
      })
      .from(siteContentTable)
      .limit(1);

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

    res.json({
      content: content ? mapSiteContentRow(content) : defaultContent,
      products: products.map(mapProductRow),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
