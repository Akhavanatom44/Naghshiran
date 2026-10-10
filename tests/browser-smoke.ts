import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(await page.locator("#special-offers article").count(), 4);
    await page.getByRole("searchbox").fill("۹۶۰۱۳");
    assert.equal(await page.locator("#shop article").count(), 1);
    await page.locator("#shop article button").click();
    await page.waitForURL("**/login?next=%2F");
    await page.getByRole("button", { name: "ثبت‌نام", exact: true }).click();
    const suffix = Date.now().toString().slice(-8);
    await page.locator("#register-phone").fill("091" + suffix);
    await page.locator("#auth-username").fill("test_" + suffix);
    await page.locator("#auth-password").fill("validpassword123");
    await page
      .getByRole("button", { name: "ثبت‌نام و ادامه خرید", exact: true })
      .click();
    await page.waitForURL(base + "/", { timeout: 30000 });
    await page.getByRole("searchbox").fill("۹۶۰۱۳");
    assert.equal(
      await page.locator("#shop .stepper-pill span").textContent(),
      "۱",
    );
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("searchbox").fill("۹۶۰۱۳");
    assert.equal(
      await page.locator("#shop .stepper-pill span").textContent(),
      "۱",
    );
    const products = await (
      await page.request.get(base + "/api/products")
    ).json();
    const product = products.products.find(
      (p: { code: number }) => p.code === 96013,
    );
    assert.equal(product.price, 1275000);
    const payload = {
      requestKey: crypto.randomUUID(),
      expectedTotal: product.price,
      items: [{ productId: product.id, quantity: 1 }],
      fullName: "کاربر تست",
      phone: "091" + suffix,
      deliveryMethod: "pickup",
      address: null,
      receiptImage:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7WQAAAAASUVORK5CYII=",
    };
    const res = await page.request.post(base + "/api/orders", {
      data: payload,
    });
    assert.equal(res.status(), 200, await res.text());
    const order = await res.json();
    const repeat = await page.request.post(base + "/api/orders", {
      data: payload,
    });
    assert.equal((await repeat.json()).orderId, order.orderId);
    const changed = await page.request.post(base + "/api/orders", {
      data: { ...payload, fullName: "نام متفاوت" },
    });
    assert.equal(changed.status(), 409);
    const after = await (await page.request.get(base + "/api/products")).json();
    assert.equal(
      after.products.find((p: { code: number }) => p.code === 96013).stock,
      product.stock - 1,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: mobile guest + → signup → home quantity 1, reload, discount price, atomic checkout, retry deduplication, no overflow or JS errors",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
