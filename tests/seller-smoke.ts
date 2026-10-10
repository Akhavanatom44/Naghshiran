/** Destructive test data is confined to a local development database. */
import assert from "node:assert/strict";
import { chromium, request, type APIRequestContext } from "@playwright/test";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Run seller smoke tests against a LOCAL database only");
const suffix = Date.now().toString().slice(-8);
const receipt =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7WQAAAAASUVORK5CYII=";
async function post(
  ctx: APIRequestContext,
  url: string,
  data: unknown,
  expected = 200,
) {
  const res = await ctx.post(url, { data });
  assert.equal(res.status(), expected, await res.text());
  return res.json();
}
async function main() {
  const guest = await request.newContext({ baseURL: base });
  const admin = await request.newContext({ baseURL: base });
  const customer = await request.newContext({ baseURL: base });
  const other = await request.newContext({ baseURL: base });
  const customerData = {
    username: `seller_test_${suffix}`,
    password: "test-customer-password",
    fullName: "خریدار آزمایشی",
    phone: `091${suffix}`,
  };
  try {
    const response = await guest.get("/admin");
    assert.ok(response.url().endsWith("/login"));
    assert.ok(!(await response.text()).includes("12341234"));
    await post(customer, "/api/auth/register", customerData, 200);
    await post(
      other,
      "/api/auth/register",
      { ...customerData, username: `other_${suffix}`, phone: `092${suffix}` },
      200,
    );
    for (const ctx of [guest, customer]) {
      for (const route of [
        "/api/admin/products",
        "/api/admin/messages",
        "/api/admin/images",
        "/api/admin/password",
      ]) {
        assert.equal(
          (await ctx.post(route, { data: {} })).status(),
          403,
          route,
        );
      }
      assert.equal(
        (await ctx.patch("/api/admin/products", { data: {} })).status(),
        403,
      );
      assert.equal(
        (await ctx.delete("/api/admin/products", { data: { id: 1 } })).status(),
        403,
      );
      assert.equal((await ctx.get("/api/admin/products")).status(), 403);
      assert.equal((await ctx.get("/api/admin/messages")).status(), 403);
      assert.equal((await ctx.get("/api/admin/orders")).status(), 401);
      assert.equal((await ctx.get("/api/admin/orders/1")).status(), 401);
    }
    await post(admin, "/api/auth/login", {
      username: "admin",
      password: process.env.TEST_ADMIN_PASSWORD ?? "12341234",
    });
    assert.equal((await admin.get("/api/auth/me")).status(), 200);
    const foreign = await admin.post("/api/admin/products", {
      headers: { Origin: "https://evil.example" },
      data: {},
    });
    assert.equal(foreign.status(), 403);
    const image = await post(
      admin,
      "/api/admin/images",
      { image: receipt },
      201,
    );
    assert.equal(
      (await guest.get(image.imageUrl)).headers()["content-type"],
      "image/png",
    );
    await post(
      admin,
      "/api/admin/images",
      { image: "data:image/svg+xml;base64,PHN2Zz4=" },
      400,
    );
    const draft = {
      code: 100000000 + Number(suffix),
      name: "محصول تست فروشنده",
      description: "جزئیات قابل ویرایش",
      category: "آزمایشی",
      imageUrl: image.imageUrl,
      price: 10000,
      stock: 8,
      isActive: true,
      discountPercent: 20,
    };
    let { product } = await post(admin, "/api/admin/products", draft, 201);
    await post(admin, "/api/admin/products", draft, 409);
    const publicProducts = async () =>
      (await (await guest.get("/api/products")).json()).products;
    assert.equal(
      (await publicProducts()).find((p: { id: number }) => p.id === product.id)
        .price,
      8000,
    );
    const update = {
      ...draft,
      id: product.id,
      expectedStock: product.stock,
      expectedUpdatedAt: product.updatedAt,
      name: "نام ویرایش‌شده",
      price: 12000,
      discountPercent: 25,
    };
    let res = await admin.patch("/api/admin/products", { data: update });
    assert.equal(res.status(), 200, await res.text());
    product = (await res.json()).product;
    assert.equal(
      (await admin.patch("/api/admin/products", { data: update })).status(),
      409,
      "stale product editor must not overwrite newer data",
    );
    assert.equal(
      (await publicProducts()).find((p: { id: number }) => p.id === product.id)
        .price,
      9000,
    );
    const payload = {
      requestKey: crypto.randomUUID(),
      expectedTotal: 9000,
      items: [{ productId: product.id, quantity: 1 }],
      fullName: customerData.fullName,
      phone: customerData.phone,
      deliveryMethod: "pickup",
      receiptImage: receipt,
      customerNote: "",
    };
    await post(customer, "/api/orders", { ...payload, phone: "" }, 400);
    await post(
      customer,
      "/api/orders",
      { ...payload, deliveryMethod: "ship", address: "خیابان تست", phone: "" },
      400,
    );
    await post(customer, "/api/orders", { ...payload, expectedTotal: 1 }, 409);
    const order = await post(customer, "/api/orders", payload);
    assert.equal(
      (await post(customer, "/api/orders", payload)).orderId,
      order.orderId,
    );
    const orderDetail = await (
      await admin.get(`/api/admin/orders/${order.orderId}`)
    ).json();
    assert.equal(orderDetail.order.phone, customerData.phone);
    assert.equal(orderDetail.order.fullName, customerData.fullName);
    await post(
      admin,
      "/api/admin/messages",
      {
        username: customerData.username,
        body: "ممنون از خرید شما. سفارش به‌زودی ارسال می‌شود.",
      },
      201,
    );
    const inbox = await (await customer.get("/api/messages")).json();
    assert.equal(inbox.unread, 1);
    const message = inbox.messages[0];
    assert.equal(
      (await (await other.get("/api/messages")).json()).messages.length,
      0,
    );
    assert.equal(
      (
        await other.patch("/api/messages", { data: { id: message.id } })
      ).status(),
      404,
    );
    assert.equal(
      (
        await customer.patch("/api/messages", { data: { id: message.id } })
      ).status(),
      200,
    );
    assert.equal(
      (await (await customer.get("/api/messages?count=1")).json()).unread,
      0,
    );
    assert.equal(
      (
        await customer.post("/api/admin/messages", {
          data: { username: customerData.username, body: "forged" },
        })
      ).status(),
      403,
    );
    assert.equal(
      (
        await admin.delete("/api/admin/products", { data: { id: product.id } })
      ).status(),
      200,
    );
    assert.ok(
      !(await publicProducts()).some(
        (p: { id: number }) => p.id === product.id,
      ),
    );
    await post(
      customer,
      "/api/orders",
      { ...payload, requestKey: crypto.randomUUID() },
      409,
    );
    assert.equal(
      (await admin.get(`/api/admin/orders/${order.orderId}`)).status(),
      200,
      "archiving preserves order history",
    );
    const archived = (
      await (await admin.get(`/api/admin/products?code=${draft.code}`)).json()
    ).products[0];
    res = await admin.patch("/api/admin/products", {
      data: {
        ...archived,
        isActive: true,
        discountPercent: 0,
        expectedUpdatedAt: archived.updatedAt,
        expectedStock: archived.stock,
      },
    });
    assert.equal(res.status(), 200, await res.text());
    assert.equal(
      (await publicProducts()).find((p: { id: number }) => p.id === product.id)
        .price,
      12000,
    );
    // Browser checks use the same authenticated cookies as the API assertions.
    const browser = await chromium.launch({
      headless: true,
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
    });
    try {
      const context = await browser.newContext({
        storageState: await admin.storageState(),
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(base, { waitUntil: "networkidle" });
      await page
        .getByRole("link", { name: "پنل فروشگاه", exact: true })
        .click();
      await page
        .getByRole("button", { name: "مدیریت محصولات", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "جست‌وجوی محصول با کد یا نام" })
        .fill(String(draft.code));
      await page.getByRole("button", { name: "ویرایش", exact: true }).click();
      await page
        .getByLabel("نام محصول *", { exact: true })
        .fill("ویرایش با مرورگر");
      await page
        .getByRole("button", { name: "ثبت محصول", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "محصول ذخیره شد" })
        .waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await page.screenshot({
        path: ".arena/seller-mobile.png",
        fullPage: true,
      });
      await page.goto(base + "/", { waitUntil: "networkidle" });
      const customerContext = await browser.newContext({
        storageState: await customer.storageState(),
        viewport: { width: 390, height: 844 },
      });
      const shop = await customerContext.newPage();
      shop.on("pageerror", (e) => errors.push(e.message));
      await shop.goto(base, { waitUntil: "networkidle" });
      assert.equal(
        await shop
          .getByRole("link", { name: "پنل فروشگاه", exact: true })
          .count(),
        0,
      );
      await shop.getByRole("searchbox").fill(String(draft.code));
      const card = shop.locator("#shop article");
      await card.getByRole("button", { name: /خرید محصول/ }).click();
      await card.getByRole("button", { name: /افزودن یک عدد/ }).click();
      assert.equal(
        await card.locator('[aria-live="polite"]').textContent(),
        "۲",
      );
      await card.getByRole("button", { name: /کاهش یک عدد/ }).click();
      await card.getByRole("button", { name: /کاهش یک عدد/ }).click();
      await card.getByRole("button", { name: /خرید محصول/ }).waitFor();
      await card.getByRole("button", { name: /خرید محصول/ }).click();
      await shop
        .getByRole("link", { name: "مشاهده سبد خرید", exact: true })
        .click();
      await shop.goto(base + "/checkout", { waitUntil: "networkidle" });
      assert.equal(
        await shop.locator("#recipient-name").inputValue(),
        customerData.fullName,
      );
      assert.equal(
        await shop.locator("#recipient-phone").inputValue(),
        customerData.phone,
      );
      assert.equal(
        await shop.locator("#seller-card").inputValue(),
        "6037997327623303",
      );
      await shop
        .getByRole("button", { name: "تحویل حضوری", exact: false })
        .click();
      assert.ok(
        (await shop.locator("#recipient-phone").getAttribute("required")) !==
          null,
      );
      assert.ok(
        await shop.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await shop.screenshot({
        path: ".arena/checkout-mobile.png",
        fullPage: true,
      });
      await shop.goto(base + "/messages", { waitUntil: "networkidle" });
      await shop.getByRole("button", { name: /فروشنده نقشیران/ }).click();
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
    await admin.delete("/api/admin/products", { data: { id: product.id } });
    console.log(
      "PASS: guest/customer admin denial; CSRF; image upload; product CRUD/discounts/conflicts; checkout identity/pricing/idempotency; message isolation/read status; mobile seller editor/purchase stepper/checkout/inbox",
    );
  } finally {
    await Promise.all([
      guest.dispose(),
      admin.dispose(),
      customer.dispose(),
      other.dispose(),
    ]);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
