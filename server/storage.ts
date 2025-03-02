import { 
  users, stores, distributors, products, orders, orderItems,
  type User, type InsertUser, type Store, type InsertStore,
  type Distributor, type InsertDistributor, type Product, type InsertProduct,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

// Função para validar números decimais
function validateDecimal(value: any, defaultValue = "0.00"): string {
  if (value === undefined || value === null) return defaultValue;

  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(numValue) || numValue < 0) return defaultValue;

  return numValue.toFixed(2);
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Store operations
  getStores(): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<Store>): Promise<Store>;

  // Distributor operations
  getDistributors(): Promise<Distributor[]>;
  getDistributor(id: number): Promise<Distributor | undefined>;
  createDistributor(distributor: InsertDistributor): Promise<Distributor>;
  updateDistributor(id: number, distributor: Partial<Distributor>): Promise<Distributor>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  getProductsByDistributor(distributorId: number): Promise<Product[]>;

  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<Order>): Promise<Order>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, item: Partial<OrderItem>): Promise<OrderItem>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Store operations
  async getStores(): Promise<Store[]> {
    return await db.select().from(stores);
  }

  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  async updateStore(id: number, store: Partial<Store>): Promise<Store> {
    const [updatedStore] = await db
      .update(stores)
      .set(store)
      .where(eq(stores.id, id))
      .returning();
    return updatedStore;
  }

  // Distributor operations
  async getDistributors(): Promise<Distributor[]> {
    return await db.select().from(distributors);
  }

  async getDistributor(id: number): Promise<Distributor | undefined> {
    const [distributor] = await db.select().from(distributors).where(eq(distributors.id, id));
    return distributor;
  }

  async createDistributor(distributor: InsertDistributor): Promise<Distributor> {
    const [newDistributor] = await db.insert(distributors).values(distributor).returning();
    return newDistributor;
  }

  async updateDistributor(id: number, distributor: Partial<Distributor>): Promise<Distributor> {
    const [updatedDistributor] = await db
      .update(distributors)
      .set(distributor)
      .where(eq(distributors.id, id))
      .returning();
    return updatedDistributor;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async getProductsByDistributor(distributorId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.distributorId, distributorId));
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<Order>): Promise<Order> {
    const updateData: Partial<Order> = {
      ...order,
      updatedAt: new Date()
    };

    // Validar e processar datas
    if (order.receivedAt) {
      try {
        updateData.receivedAt = new Date(order.receivedAt);
      } catch (error) {
        updateData.receivedAt = new Date();
      }
    }

    // Validar status
    if (order.status) {
      const validStatuses = [
        'pending', 'processing', 'shipped', 'delivered', 
        'cancelled', 'receiving', 'received', 'partially_received'
      ];
      updateData.status = validStatuses.includes(order.status) ? order.status : 'pending';
    }

    // Validar campos numéricos
    if (order.total !== undefined) {
      updateData.total = validateDecimal(order.total);
    }

    // Limitar tamanho das notas
    if (order.receivingNotes) {
      updateData.receivingNotes = order.receivingNotes.slice(0, 1000);
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    return updatedOrder;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  async updateOrderItem(id: number, item: Partial<OrderItem>): Promise<OrderItem> {
    const updateData: Record<string, any> = {};

    // Validar e processar campos numéricos com precisão
    if (item.receivedQuantity !== undefined) {
      updateData.receivedQuantity = validateDecimal(item.receivedQuantity);
    }

    if (item.missingQuantity !== undefined) {
      updateData.missingQuantity = validateDecimal(item.missingQuantity);
    }

    if (item.quantity !== undefined) {
      updateData.quantity = validateDecimal(item.quantity);
    }

    if (item.price !== undefined) {
      updateData.price = validateDecimal(item.price);
    }

    if (item.total !== undefined) {
      updateData.total = validateDecimal(item.total);
    }

    // Processar campos não numéricos
    if (item.receivingStatus !== undefined) {
      updateData.receivingStatus = ['pending', 'received', 'partial', 'missing'].includes(item.receivingStatus)
        ? item.receivingStatus
        : 'pending';
    }

    if (item.receivingNotes !== undefined) {
      updateData.receivingNotes = item.receivingNotes.slice(0, 500); // Limitar tamanho da nota
    }

    // Atualizar o item no banco de dados
    const [updatedItem] = await db
      .update(orderItems)
      .set(updateData)
      .where(eq(orderItems.id, id))
      .returning();

    return updatedItem;
  }
}

export const storage = new DatabaseStorage();