import assert from "node:assert/strict";
import { test } from "node:test";
import { productSchema } from "../src/lib/seller-products";
import { STORE_CARD_NUMBER, STORE_ADDRESS } from "../src/lib/format";
import { readFileSync } from "node:fs";
const product = {
  code: 900,
  name: "محصول آزمایشی",
  description: "توضیحات",
  category: "ابزار",
  price: 1000,
  stock: 2,
  discountPercent: 20,
  isActive: true,
  imageUrl: "https://example.com/p.jpg",
};
test("seller input rejects bad codes, prices, discounts and unsafe images", () => {
  assert.equal(productSchema.safeParse(product).success, true);
  for (const patch of [
    { code: -1 },
    { code: 2.5 },
    { price: -10 },
    { stock: -1 },
    { discountPercent: 100 },
    { discountPercent: -1 },
    { imageUrl: "javascript:alert(1)" },
    { imageUrl: "data:image/svg+xml,<svg/>" },
    { imageUrl: "//evil.test/image" },
    { name: " " },
    { description: "" },
  ]) {
    assert.equal(
      productSchema.safeParse({ ...product, ...patch }).success,
      false,
      JSON.stringify(patch),
    );
  }
  assert.equal(
    productSchema.safeParse({
      ...product,
      imageUrl: "/api/product-images/abc-123",
    }).success,
    true,
  );
});
test("payment illustration and copy value use the exact merchant card", () => {
  assert.equal(STORE_CARD_NUMBER, "6037997327623303");
  assert.ok(
    readFileSync("public/images/payment/melli-card.svg", "utf8").includes(
      "6037 9973 2762 3303",
    ),
  );
  assert.ok(STORE_ADDRESS.includes("فروشگاه مهندسی نقشیران"));
});
test("no public credential form or footer admin link remains", () => {
  assert.ok(
    !readFileSync("src/components/Footer.tsx", "utf8").includes(
      'href="/admin"',
    ),
  );
  assert.ok(
    !readFileSync("src/lib/admin-credentials.ts", "utf8").includes("12341234"),
  );
  const page = readFileSync("src/app/admin/page.tsx", "utf8");
  assert.ok(page.includes("!user.isAdmin"));
});
