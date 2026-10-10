import { chromium, expect, type Page } from "@playwright/test";
import assert from "node:assert/strict";
import type { ProductForCard } from "../src/components/ProductCard";
import { CART_STORAGE_KEY } from "../src/lib/cart-storage";

const introDescription =
  "مدل موردنظرتان را جست‌وجو کنید یا دسته‌بندی را انتخاب کنید؛ برای افزودن به سبد، وارد حساب شوید یا ثبت‌نام کنید.";

async function assertSectionOrder(page: Page) {
  assert.deepEqual(
    await page.locator("main > header, main > section").evaluateAll((elements) =>
      elements.map((element) => element.id),
    ),
    ["catalog-intro", "special-offers", "shop"],
  );
  assert.equal(await page.locator("main h1").count(), 1);
  await expect(page.locator("#catalog-title")).toHaveText("محصولات نقشه‌برداری");
  await expect(page.locator("#catalog-intro > p").first()).toHaveText(
    "فروشگاه تخصصی تجهیزات نقشه‌برداری نقشیران",
  );
  await expect(page.locator("#catalog-intro > p").last()).toHaveText(introDescription);
  await expect(page.locator("#offers-title")).toHaveText("محصولات تخفیف‌دار");
  await expect(page.locator("#products-title")).toHaveText("کلیه محصولات");

  // Measure together in document coordinates; focusing the search field may
  // still be smoothly scrolling the viewport between individual tool reads.
  const [intro, offers, shop] = await page
    .locator("#catalog-intro, #special-offers, #shop")
    .evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top + scrollY, bottom: rect.bottom + scrollY };
    }));
  assert.ok(intro.bottom <= offers.top);
  assert.ok(offers.bottom <= shop.top);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    "catalog must not overflow the viewport",
  );
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  try {
    const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    for (const viewport of [
      { width: 320, height: 740 },
      { width: 390, height: 844 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(base, { waitUntil: "networkidle" });
      await assertSectionOrder(page);
      await expect(page.locator("#special-offers article")).toHaveCount(4);
      await expect(page.locator("#shop article")).toHaveCount(50);
      await page.getByRole("searchbox").fill("۹۶۰۲۴");
      await expect(page.locator("#shop article")).toHaveCount(1);
      await expect(page.locator("#special-offers article")).toHaveCount(4);
      await assertSectionOrder(page);
      await page.getByRole("searchbox").fill("no-matching-model");
      await expect(page.locator("#shop article")).toHaveCount(0);
      await assertSectionOrder(page);
      await page.getByRole("button", { name: "نمایش همه محصولات" }).click();
      await expect(page.locator("#shop article")).toHaveCount(50);
    }

    const response = await page.request.get(base + "/api/products");
    assert.ok(response.ok());
    const data = await response.json();
    const products: ProductForCard[] = data.products;
    const battery = products.find((product) => product.code === 96024);
    assert.ok(battery?.category);
    await page.getByRole("button", { name: battery.category, exact: true }).click();
    await expect(page.locator("#shop article")).toHaveCount(
      products.filter((product) => product.category === battery.category).length,
    );
    await expect(page.locator("#special-offers article")).toHaveCount(4);
    await assertSectionOrder(page);
    await page.getByRole("button", { name: "کلیه محصولات", exact: true }).click();
    await page.locator("#catalog-sort").selectOption("price-ascending");
    assert.deepEqual(
      await page.locator("#shop article h3").allTextContents(),
      [...products].sort((a, b) => a.price - b.price).map((product) => product.name),
    );
    await assertSectionOrder(page);

    // Isolated cart fixture: no account, order, or merchant data is changed.
    const cartPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    cartPage.on("pageerror", (error) => errors.push(error.message));
    const staleBattery = { ...battery, imageUrl: "/missing-merchant-photo.jpg" };
    await cartPage.route("**/api/products", (route) =>
      route.fulfill({ json: { ...data, products: [staleBattery] } }),
    );
    await cartPage.route("**/missing-merchant-photo.jpg", (route) =>
      route.fulfill({ status: 404, body: "" }),
    );
    await cartPage.addInitScript(
      ({ key, product }) => {
        localStorage.setItem(key, JSON.stringify([
          { ...product, productId: product.id, quantity: 1 },
        ]));
      },
      { key: CART_STORAGE_KEY, product: staleBattery },
    );
    await cartPage.goto(base + "/cart", { waitUntil: "networkidle" });
    const cartImage = cartPage.locator("main .product-stage img");
    await expect(cartImage).toHaveAttribute("src", "/images/catalog/96024.webp");
    await expect.poll(() => cartImage.evaluate((image) => (image as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);

    await cartPage.route("**/images/catalog/96024.webp", (route) =>
      route.fulfill({ status: 404, body: "" }),
    );
    await cartPage.reload({ waitUntil: "networkidle" });
    await expect(cartImage).toHaveAttribute("src", "/images/catalog/96024.svg");
    await expect.poll(() => cartImage.evaluate((image) => (image as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await cartPage.close();

    const imageResponses = await Promise.all(products.map((product) =>
      page.request.get(base + product.imageUrl),
    ));
    assert.ok(imageResponses.every((imageResponse) => imageResponse.ok()));
    assert.deepEqual(errors, []);
    console.log(
      "PASS: exact introduction → discounted products → all products at 320/390/1440px, independent search/category/sort, all 50 images, stale photo → catalog WebP → SVG fallback, no JS errors",
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
