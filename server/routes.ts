import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertStoreSchema, insertDistributorSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import * as express from 'express';

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Aumentar limite do body-parser para arquivos grandes
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

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

  // Initialize distributors
  app.post("/api/distributors/init", async (_req, res) => {
    try {
      const distributors = [
        { name: "E B EXPRESS PROVISIONS INC", code: "EB-EXP", contact: "Contact", phone: "(123) 456-7890", email: "contact@ebexpress.com" },
        { name: "PANAMERICAN FOODS CORP", code: "PAN-FOODS", contact: "Contact", phone: "(123) 456-7890", email: "contact@panamerican.com" },
        { name: "JULINA FOODS", code: "JULINA", contact: "Contact", phone: "(123) 456-7890", email: "contact@julina.com" },
        { name: "LEBLON FOOD INC.", code: "LEBLON", contact: "Contact", phone: "(123) 456-7890", email: "contact@leblon.com" },
        { name: "MASTER FOODS", code: "MASTER", contact: "Contact", phone: "(123) 456-7890", email: "contact@masterfoods.com" },
        { name: "MINAS TRADING", code: "MINAS", contact: "Contact", phone: "(123) 456-7890", email: "contact@minastrading.com" },
        { name: "PANAMERICAN FOODS OF FLORIDA", code: "PAN-FL", contact: "Contact", phone: "(123) 456-7890", email: "contact@panamericanfl.com" },
        { name: "PRIME NORTH DISTRIBUITION", code: "PRIME", contact: "Contact", phone: "(123) 456-7890", email: "contact@primenorth.com" },
        { name: "SEM FRONTEIRAS WHOLESALE", code: "SEM-FRONT", contact: "Contact", phone: "(123) 456-7890", email: "contact@semfronteiras.com" },
        { name: "ZAP FOODS LLC", code: "ZAP", contact: "Contact", phone: "(123) 456-7890", email: "contact@zapfoods.com" },
        { name: "UNLIMITED BAG & SUPPLY CO", code: "UNLIM", contact: "Contact", phone: "(123) 456-7890", email: "contact@unlimited.com" },
        { name: "DISCOVER SUPPLY", code: "DISCOVER", contact: "Contact", phone: "(123) 456-7890", email: "contact@discover.com" }
      ];

      for (const dist of distributors) {
        const parsed = insertDistributorSchema.parse(dist);
        await storage.createDistributor(parsed);
      }

      res.status(201).json({ message: "Distribuidores criados com sucesso" });
    } catch (error) {
      console.error('Error creating distributors:', error);
      res.status(500).json({ error: 'Failed to create distributors' });
    }
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
      const batchSize = 50; // Processar em lotes de 50 produtos

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        for (const product of batch) {
          try {
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
          } catch (error) {
            console.error('Error importing product:', product, error);
            // Continue with next product even if one fails
          }
        }
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