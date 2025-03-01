import { pgTable, text, serial, integer, decimal, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('distributor'), // 'supermarket' or 'distributor'
  distributorId: integer("distributor_id").references(() => distributors.id),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  phone: text("phone").notNull(),
  active: boolean("active").notNull().default(true),
});

export const distributors = pgTable("distributors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  contact: text("contact").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  active: boolean("active").notNull().default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  distributorId: integer("distributor_id").notNull().references(() => distributors.id),
  itemCode: text("item_code").notNull(),
  supplierCode: text("supplier_code").notNull(),
  barCode: text("bar_code"),
  name: text("name").notNull(),
  description: text("description"),
  grupo: text("grupo"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  previousUnitPrice: decimal("previous_unit_price", { precision: 10, scale: 2 }),
  boxPrice: decimal("box_price", { precision: 10, scale: 2 }),
  previousBoxPrice: decimal("previous_box_price", { precision: 10, scale: 2 }),
  boxQuantity: integer("box_quantity").notNull(),
  unit: text("unit").notNull(),
  imageUrl: text("image_url"),
  isSpecialOffer: boolean("is_special_offer").notNull().default(false),
  expirationDate: timestamp("expiration_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  distributorId: integer("distributor_id").notNull().references(() => distributors.id),
  storeId: integer("store_id").notNull().references(() => stores.id),
  status: text("status").notNull().default('pending'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Zod schemas for product creation/update with proper type coercion
const productInsertSchema = createInsertSchema(products).extend({
  unitPrice: z.number().or(z.string().transform(val => parseFloat(val.replace(',', '.')))),
  boxQuantity: z.number().or(z.string().transform(val => parseInt(val))),
  boxPrice: z.number().nullable().or(z.string().transform(val => parseFloat(val.replace(',', '.')))).nullable(),
});

// Other insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertStoreSchema = createInsertSchema(stores);
export const insertDistributorSchema = createInsertSchema(distributors);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);

// Export the product schema
export const insertProductSchema = productInsertSchema;

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertDistributor = z.infer<typeof insertDistributorSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Distributor = typeof distributors.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;