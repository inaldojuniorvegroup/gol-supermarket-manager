import { 
  User, InsertUser, Store, InsertStore,
  Distributor, InsertDistributor, Product, InsertProduct,
  Order, InsertOrder, OrderItem, InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
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
  
  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<Order>): Promise<Order>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private stores = new Map<number, Store>();
  private distributors = new Map<number, Distributor>();
  private products = new Map<number, Product>();
  private orders = new Map<number, Order>();
  private orderItems = new Map<number, OrderItem>();
  private currentId = 1;
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.users.clear();
  }

  private nextId() {
    return this.currentId++;
  }

  // User operations with proper logging
  async getUser(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    console.log("Getting user by ID:", { id, userFound: !!user });
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(u => u.username === username);
    console.log("Getting user by username:", { username, userFound: !!user });
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.nextId();
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    console.log("Created new user:", { id, username: user.username });
    return newUser;
  }

  // Store operations with default values
  async getStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async createStore(store: InsertStore): Promise<Store> {
    const id = this.nextId();
    const newStore = { 
      ...store, 
      id,
      active: store.active ?? true // Set default value for active
    };
    this.stores.set(id, newStore);
    return newStore;
  }

  async updateStore(id: number, store: Partial<Store>): Promise<Store> {
    const existing = await this.getStore(id);
    if (!existing) throw new Error('Store not found');
    const updated = { ...existing, ...store };
    this.stores.set(id, updated);
    return updated;
  }

  // Distributor operations with default values
  async getDistributors(): Promise<Distributor[]> {
    return Array.from(this.distributors.values());
  }

  async getDistributor(id: number): Promise<Distributor | undefined> {
    return this.distributors.get(id);
  }

  async createDistributor(distributor: InsertDistributor): Promise<Distributor> {
    const id = this.nextId();
    const newDistributor = {
      ...distributor,
      id,
      active: distributor.active ?? true // Set default value for active
    };
    this.distributors.set(id, newDistributor);
    return newDistributor;
  }

  async updateDistributor(id: number, distributor: Partial<Distributor>): Promise<Distributor> {
    const existing = await this.getDistributor(id);
    if (!existing) throw new Error('Distributor not found');
    const updated = { ...existing, ...distributor };
    this.distributors.set(id, updated);
    return updated;
  }

  // Product operations with default values
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.nextId();
    const now = new Date();
    const newProduct = {
      ...product,
      id,
      description: product.description ?? null,
      previousUnitPrice: product.previousUnitPrice ?? null,
      boxPrice: product.boxPrice ?? null,
      previousBoxPrice: product.previousBoxPrice ?? null,
      active: product.active ?? true,
      createdAt: product.createdAt ?? now,
      updatedAt: product.updatedAt ?? now
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const existing = await this.getProduct(id);
    if (!existing) throw new Error('Product not found');
    const updated = { ...existing, ...product };
    this.products.set(id, updated);
    return updated;
  }

  // Order operations with default values
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.nextId();
    const now = new Date();
    const newOrder = {
      ...order,
      id,
      status: order.status ?? 'pending',
      createdAt: order.createdAt ?? now
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<Order>): Promise<Order> {
    const existing = await this.getOrder(id);
    if (!existing) throw new Error('Order not found');
    const updated = { ...existing, ...order };
    this.orders.set(id, updated);
    return updated;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const id = this.nextId();
    const newItem = { ...item, id };
    this.orderItems.set(id, newItem);
    return newItem;
  }
}

export const storage = new MemStorage();