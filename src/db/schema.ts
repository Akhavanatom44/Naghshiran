import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * D1 (SQLite) schema. Table and column names are kept identical to the
 * previous PostgreSQL layout so existing SQL and tooling keep working.
 * SQLite stores integers as 64-bit values, so Toman prices (up to a few
 * billion) and order totals fit without a BIGINT type.
 */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name", { length: 128 }),
  phone: text("phone", { length: 32 }),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .defaultNow(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: integer("code").notNull().unique(),
  name: text("name", { length: 200 }).notNull(),
  description: text("description").notNull().default(""),
  category: text("category", { length: 64 }).notNull().default("سایر"),
  // Prices are stored in Toman. SQLite INTEGER is 64-bit, which is required
  // for the supplied Leica prices.
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  stock: integer("stock").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .defaultNow(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  status: text("status", { length: 16 }).notNull().default("pending"), // pending | approved | rejected
  totalAmount: integer("total_amount").notNull(),
  fullName: text("full_name", { length: 128 }).notNull(),
  phone: text("phone", { length: 32 }).notNull(),
  deliveryMethod: text("delivery_method", { length: 16 }).notNull(), // ship | pickup
  address: text("address"),
  customerNote: text("customer_note"),
  receiptImage: text("receipt_image").notNull(),
  adminNote: text("admin_note"),
  telegramStatus: text("telegram_status", { length: 16 })
    .notNull()
    .default("not_sent"), // not_sent | sent | failed
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .defaultNow(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name", { length: 200 }).notNull(),
  productCode: integer("product_code").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});

/** A committed submission makes network retries safe. */
export const orderSubmissions = sqliteTable("order_submissions", {
  requestKey: text("request_key").primaryKey().notNull(),
  userId: integer("user_id").notNull(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  requestHash: text("request_hash").notNull(),
});
