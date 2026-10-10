import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import sharp from "sharp";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProductCatalog from "../src/components/ProductCatalog";
import ProductImage from "../src/components/ProductImage";
import { RECEIPT_MAX_CHARS } from "../src/lib/receipt-image";
import {
  addCartItem,
  setCartQuantity,
  sanitizeCart,
  reconcileCart,
} from "../src/lib/cart-utils";
import { safeNextPath } from "../src/lib/safe-next-path";
import { sellingPrice, presentProduct } from "../src/lib/product-pricing";
import { checkoutSchema, checkoutHash } from "../src/lib/checkout";
import {
  pendingProductCode,
  savePendingCartProduct,
} from "../src/lib/cart-storage";
import { resolveSessionSecret } from "../src/lib/auth";
import { CATALOG_PRODUCTS } from "../src/data/catalog";
import { faNum } from "../src/lib/format";

const product = {
  productId: 1,
  code: 212,
  name: "متر",
  price: 1500000,
  stock: 3,
  imageUrl: "/images/catalog/212.webp",
};
test("adding increments exactly one and never exceeds stock", () => {
  let cart = addCartItem([], product);
  assert.equal(cart[0].quantity, 1);
  cart = addCartItem(cart, product);
  assert.equal(cart[0].quantity, 2);
  cart = addCartItem(cart, product, 9);
  assert.equal(cart[0].quantity, 3);
  assert.equal(addCartItem([], { ...product, stock: 0 }).length, 0);
  assert.deepEqual(addCartItem(cart, product, -1), cart);
});
test("invalid/duplicate stored rows are discarded and quantities clamped", () => {
  const item = { ...product, quantity: 999 };
  assert.deepEqual(sanitizeCart([null, item, item, { ...item, price: NaN }]), [
    { ...item, quantity: 3 },
  ]);
  assert.deepEqual(setCartQuantity([{ ...product, quantity: 1 }], 1, 0), []);
  assert.equal(
    setCartQuantity([{ ...product, quantity: 1 }], 1, 2.5)[0].quantity,
    1,
  );
});
test("cart refresh uses product code, current DB ID, selling price and stock", () => {
  const cart = [{ ...product, quantity: 3 }];
  const next = reconcileCart(cart, [
    { ...product, productId: 8, price: 1275000, stock: 2 },
  ]);
  assert.equal(next[0].productId, 8);
  assert.equal(next[0].price, 1275000);
  assert.equal(next[0].quantity, 2);
  assert.equal(reconcileCart(cart, []).length, 0);
});
test("safe return navigation blocks open redirects and auth loops", () => {
  for (const path of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%5cevil.test",
    "/login",
    "/register",
    "/cart\n",
  ]) {
    assert.equal(safeNextPath(path), "/");
  }
  assert.equal(
    safeNextPath("/orders/12?submitted=1"),
    "/orders/12?submitted=1",
  );
  assert.equal(safeNextPath("/checkout"), "/checkout");
});
test("catalog, cart and checkout share the real discount price", () => {
  const p = presentProduct({
    code: 212,
    price: 1500000,
    imageUrl: "/images/catalog/212.svg",
  });
  assert.equal(p.price, 1275000);
  assert.equal(p.price, sellingPrice(p.code, 1500000));
  assert.equal(p.originalPrice, 1500000);
  assert.equal(p.imageUrl, "/images/catalog/212.webp");
  assert.equal(
    presentProduct({ code: 212, price: 1000, imageUrl: "/custom.jpg" })
      .imageUrl,
    "/custom.jpg",
  );
});
const input = {
  requestKey: crypto.randomUUID(),
  expectedTotal: 1275000,
  items: [{ productId: 1, quantity: 1 }],
  fullName: "کاربر تست",
  phone: "۰۹۱۳۱۱۴۷۸۹۷",
  deliveryMethod: "pickup",
  address: null,
  receiptImage: "data:image/png;base64,aGVsbG8=",
};
test("checkout rejects duplicate rows, SVG receipts, bad phones and missing address", () => {
  const valid = checkoutSchema.parse(input);
  assert.equal(valid.phone, "09131147897");
  assert.equal(
    checkoutSchema.safeParse({
      ...input,
      items: [input.items[0], input.items[0]],
    }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({
      ...input,
      receiptImage: "data:image/svg+xml;base64,aGVsbG8=",
    }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({ ...input, phone: "123" }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({ ...input, deliveryMethod: "ship" }).success,
    false,
  );
});
test("retry fingerprint ignores request key, not changed details", async () => {
  const valid = checkoutSchema.parse(input);
  assert.equal(
    await checkoutHash(valid),
    await checkoutHash({ ...valid, requestKey: crypto.randomUUID() }),
  );
  assert.notEqual(
    await checkoutHash(valid),
    await checkoutHash({ ...valid, fullName: "نام جدید" }),
  );
});
test("catalog codes are consecutive from 200 and live in descriptions, not images", () => {
  assert.deepEqual(
    CATALOG_PRODUCTS.map((item) => item.code),
    Array.from({ length: 50 }, (_, index) => 200 + index),
  );
  for (const item of CATALOG_PRODUCTS) {
    assert.ok(
      item.description.includes(`کد محصول: ${faNum(item.code)}`),
      `Code is missing from description ${item.code}`,
    );
    assert.notEqual(item.imageUrl, "/images/catalog/placeholder.svg");
    const fallback = readFileSync(
      `public/images/catalog/${item.code}.svg`,
      "utf8",
    );
    assert.ok(!fallback.includes(`NR-${item.code}`));
  }
});

test("every catalog code resolves to a real, decodable local image", async () => {
  const images = JSON.parse(
    readFileSync("src/data/catalog-images.json", "utf8"),
  );
  const catalog = JSON.parse(readFileSync("src/data/catalog.json", "utf8"));
  assert.equal(catalog.length, 50);
  for (const p of catalog) {
    const imagePath = `public${images[p.code]}`;
    assert.ok(existsSync(imagePath), `Missing ${p.code}`);
    const metadata = await sharp(imagePath).metadata();
    assert.equal(metadata.format, "webp", `Unexpected format for ${p.code}`);
    assert.ok(metadata.width && metadata.height, `Unreadable image ${p.code}`);
    assert.equal(
      metadata.width,
      metadata.height,
      `Image is not square: ${p.code}`,
    );
  }
});
test("pending guest click is tab scoped, expires and tolerates blocked storage", () => {
  const values = new Map<string, string>();
  const storage = {
    setItem: (k: string, v: string) => values.set(k, v),
    getItem: (k: string) => values.get(k),
    removeItem: (k: string) => values.delete(k),
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: storage, localStorage: storage },
  });
  assert.equal(savePendingCartProduct(product), true);
  assert.equal(pendingProductCode(), 212);
  values.set(
    "naghshiran-pending-cart-item",
    JSON.stringify({ code: 212, createdAt: Date.now() - 31 * 60000 }),
  );
  assert.equal(pendingProductCode(), null);
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      get sessionStorage() {
        throw new Error("blocked");
      },
      localStorage: storage,
    },
  });
  assert.equal(savePendingCartProduct(product), false);
  assert.equal(pendingProductCode(), null);
});

test("catalog introduction remains first even without offers or products", () => {
  const markup = renderToStaticMarkup(
    createElement(ProductCatalog, { products: [] }),
  );
  const introIndex = markup.indexOf('id="catalog-intro"');
  const shopIndex = markup.indexOf('id="shop"');
  assert.ok(introIndex >= 0 && introIndex < shopIndex);
  assert.ok(!markup.includes('id="special-offers"'));
  assert.equal((markup.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(markup.includes('id="products-title"'));
  assert.ok(markup.includes("فروشگاه تخصصی تجهیزات نقشه‌برداری نقشیران"));
  assert.ok(markup.includes("کلیه محصولات"));
});

test("missing image URL starts with the optimized catalog photo", () => {
  const markup = renderToStaticMarkup(
    createElement(ProductImage, {
      code: 223,
      name: "باتری",
      imageUrl: "  ",
    }),
  );
  assert.ok(markup.includes('src="/images/catalog/223.webp"'));
});

test("new studio images and every SVG fallback are decodable", async () => {
  const codes = Array.from({ length: 30 }, (_, i) => 220 + i);
  for (const code of codes) {
    const photo = await sharp(`public/images/catalog/${code}.jpg`).metadata();
    assert.equal(photo.format, "jpeg");
    assert.ok(photo.width && photo.height);
    const optimized = await sharp(
      `public/images/catalog/${code}.webp`,
    ).metadata();
    assert.equal(optimized.width, 640);
    assert.equal(optimized.height, 640);
  }
  const catalog = JSON.parse(readFileSync("src/data/catalog.json", "utf8"));
  for (const { code } of catalog) {
    // Every product must have a real photo source now (not just SVG art).
    assert.ok(
      existsSync(`public/images/catalog/${code}.jpg`),
      `Missing photo source for ${code}`,
    );
    const fallback = await sharp(
      `public/images/catalog/${code}.svg`,
    ).metadata();
    assert.equal(fallback.format, "svg");
    assert.ok(fallback.width && fallback.height);
  }
});

test("session secret resolves without configuration (login must not 503)", async () => {
  const previous = process.env.SESSION_SECRET;
  const encoder = new TextEncoder();
  try {
    delete process.env.SESSION_SECRET;
    const fallback = await resolveSessionSecret();
    assert.ok(
      fallback instanceof Uint8Array && fallback.length > 0,
      "unconfigured secret must still resolve",
    );
    assert.deepEqual(
      await resolveSessionSecret(),
      fallback,
      "secret is stable",
    );

    process.env.SESSION_SECRET = "configured-secret-with-more-than-32-chars!";
    assert.deepEqual(
      await resolveSessionSecret(),
      encoder.encode("configured-secret-with-more-than-32-chars!"),
    );

    // A too-short configured value is ignored instead of breaking login.
    process.env.SESSION_SECRET = "too-short";
    const resilient = await resolveSessionSecret();
    assert.ok(resilient instanceof Uint8Array && resilient.length > 0);
  } finally {
    if (previous === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previous;
  }
});
test("receipt limit stays under D1's 2 MB per-row cap", () => {
  assert.ok(RECEIPT_MAX_CHARS < 2_000_000);
  const tooLarge = `data:image/jpeg;base64,${"A".repeat(RECEIPT_MAX_CHARS)}`;
  assert.equal(
    checkoutSchema.safeParse({ ...input, receiptImage: tooLarge }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({
      ...input,
      receiptImage: `data:image/jpeg;base64,${"A".repeat(1000)}`,
    }).success,
    true,
  );
});

test("merchant discounts override legacy offers including explicit removal", () => {
  assert.equal(sellingPrice(212, 1000, 25), 750);
  assert.equal(sellingPrice(212, 1000, 0), 1000);
  assert.equal(sellingPrice(999999, 999, 17), 829);
  const product = presentProduct({
    code: 212,
    price: 1000,
    imageUrl: "/api/product-images/custom",
    discountPercent: 0,
  });
  assert.equal(product.price, 1000);
  assert.equal(product.originalPrice, undefined);
  assert.equal(product.imageUrl, "/api/product-images/custom");
});

test("both pickup and courier require recipient identity and phone", () => {
  for (const deliveryMethod of ["pickup", "ship"] as const) {
    const data = {
      ...input,
      deliveryMethod,
      address: "اصفهان، خیابان استانداری",
    };
    assert.equal(
      checkoutSchema.safeParse({ ...data, phone: "" }).success,
      false,
    );
    assert.equal(
      checkoutSchema.safeParse({ ...data, fullName: "" }).success,
      false,
    );
    assert.equal(
      checkoutSchema.safeParse({ ...data, phone: "۱۲۳۴" }).success,
      false,
    );
    assert.equal(
      checkoutSchema.safeParse({ ...data, customerNote: null }).success,
      true,
    );
  }
});
