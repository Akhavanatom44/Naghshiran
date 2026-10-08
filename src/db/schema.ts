import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: integer("code").notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 64 }).notNull().default("سایر"),
  // Prices are stored in Toman. BIGINT is required for the supplied Leica prices.
  price: bigint("price", { mode: "number" }).notNull(),
  imageUrl: text("image_url").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  stock: integer("stock").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | approved | rejected
  totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
  fullName: varchar("full_name", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  deliveryMethod: varchar("delivery_method", { length: 16 }).notNull(), // ship | pickup
  address: text("address"),
  receiptImage: text("receipt_image").notNull(),
  adminNote: text("admin_note"),
  telegramStatus: varchar("telegram_status", { length: 16 }).notNull().default("not_sent"), // not_sent | sent | failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: varchar("product_name", { length: 200 }).notNull(),
  productCode: integer("product_code").notNull(),
  unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
  quantity: integer("quantity").notNull(),
});
