import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertStoreSchema, insertDistributorSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Stores
  app.get("/api/stores", async (_req, res) => {
    const stores = await storage.getStores();
    res.json(stores);
  });

  app.post("/api/stores", async (req, res) => {
    const parsed = insertStoreSchema.parse(req.body);
    const store = await storage.createStore(parsed);
    res.status(201).json(store);
  });

  app.patch("/api/stores/:id", async (req, res) => {
    const store = await storage.updateStore(Number(req.params.id), req.body);
    res.json(store);
  });

  // Distributors
  app.get("/api/distributors", async (_req, res) => {
    const distributors = await storage.getDistributors();
    res.json(distributors);
  });

  app.post("/api/distributors", async (req, res) => {
    const parsed = insertDistributorSchema.parse(req.body);
    const distributor = await storage.createDistributor(parsed);
    res.status(201).json(distributor);
  });

  app.patch("/api/distributors/:id", async (req, res) => {
    const distributor = await storage.updateDistributor(Number(req.params.id), req.body);
    res.json(distributor);
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const parsed = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(parsed);
    res.status(201).json(product);
  });

  app.post("/api/products/import", async (req, res) => {
    try {
      const products = req.body;
      const importedProducts = [];

      for (const product of products) {
        const productData = {
          name: product.Description || product['Item Description'],
          itemCode: product['Item Code'] || product.Code,
          supplierCode: product['Supplier Code'] || '',
          distributorId: 1, // Assuming EB EXPRESS is the first distributor
          unitPrice: product['Unit Price']?.toString() || '0',
          boxPrice: product['Box Price']?.toString() || null,
          boxQuantity: parseInt(product['Box Quantity'] || '1'),
          unit: product['Unit'] || 'un',
          description: product['Notes'] || null
        };

        const parsed = insertProductSchema.parse(productData);
        const savedProduct = await storage.createProduct(parsed);
        importedProducts.push(savedProduct);
      }

      res.status(201).json(importedProducts);
    } catch (error) {
      console.error('Error importing products:', error);
      res.status(400).json({ error: 'Failed to import products' });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  });

  // Orders
  app.get("/api/orders", async (_req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    const parsed = insertOrderSchema.parse(req.body);
    const order = await storage.createOrder(parsed);
    res.status(201).json(order);
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const order = await storage.updateOrder(Number(req.params.id), req.body);
    res.json(order);
  });

  app.get("/api/orders/:id/items", async (req, res) => {
    const items = await storage.getOrderItems(Number(req.params.id));
    res.json(items);
  });

  app.post("/api/orders/:id/items", async (req, res) => {
    const parsed = insertOrderItemSchema.parse(req.body);
    const item = await storage.createOrderItem(parsed);
    res.status(201).json(item);
  });

  const httpServer = createServer(app);
  return httpServer;
}