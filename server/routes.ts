import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertStoreSchema, insertDistributorSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import * as express from 'express';

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Aumentar limite do body-parser para arquivos muito grandes
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  // Adicionar rota pública para compartilhamento de pedidos
  app.get("/api/orders/share/:id", async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Buscar detalhes adicionais do pedido
      const store = await storage.getStore(order.storeId);
      const distributor = await storage.getDistributor(order.distributorId);
      const items = await storage.getOrderItems(order.id);

      // Buscar detalhes dos produtos para cada item
      const itemsWithProducts = await Promise.all(items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return { ...item, product };
      }));

      // Retornar pedido completo com todos os detalhes
      const orderWithDetails = {
        ...order,
        store,
        distributor,
        items: itemsWithProducts
      };

      res.json(orderWithDetails);
    } catch (error) {
      console.error('Error fetching shared order:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
      const existingDistributors = await storage.getDistributors();
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

      let created = 0;
      let skipped = 0;

      for (const dist of distributors) {
        // Verifica se já existe um distribuidor com o mesmo código
        const exists = existingDistributors.some(d => d.code === dist.code);

        if (!exists) {
          const parsed = insertDistributorSchema.parse(dist);
          await storage.createDistributor(parsed);
          created++;
        } else {
          skipped++;
        }
      }

      res.status(201).json({
        message: `Distribuidores processados: ${created} criados, ${skipped} já existiam.`
      });
    } catch (error) {
      console.error('Error creating distributors:', error);
      res.status(500).json({ error: 'Failed to create distributors' });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const distributorId = req.query.distributorId ? Number(req.query.distributorId) : undefined;
      const products = await storage.getProducts(distributorId);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    const parsed = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(parsed);
    res.status(201).json(product);
  });

  app.post("/api/products/import", async (req, res) => {
    try {
      const products = req.body;
      console.log('Recebendo requisição de importação:', {
        totalProducts: products.length,
        sampleProduct: products[0]
      });

      // Log do primeiro produto para debug
      if (products.length > 0) {
        console.log('Estrutura do primeiro produto:', JSON.stringify(products[0], null, 2));
      }

      const importedProducts = [];
      const batchSize = 50; // Processar em lotes de 50 produtos
      const errors = [];

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        console.log(`Processando lote ${i/batchSize + 1} de ${Math.ceil(products.length/batchSize)}`);

        for (const product of batch) {
          try {
            // Verificar dados obrigatórios
            if (!product.name || !product.itemCode || !product.distributorId) {
              const error = `Produto ignorado - dados obrigatórios faltando: ${JSON.stringify(product)}`;
              console.log(error);
              errors.push(error);
              continue;
            }

            // Garantir que os tipos estejam corretos
            const productData = {
              name: String(product.name).trim(),
              itemCode: String(product.itemCode).trim(),
              supplierCode: product.supplierCode ? String(product.supplierCode).trim() : '',
              barCode: product.barCode ? String(product.barCode).trim() : '',
              distributorId: Number(product.distributorId),
              unitPrice: typeof product.unitPrice === 'number' ? product.unitPrice : 0,
              boxPrice: null,
              boxQuantity: typeof product.boxQuantity === 'number' ? product.boxQuantity : 1,
              unit: product.unit ? String(product.unit).trim() : 'un',
              description: product.description ? String(product.description).trim() : '',
              imageUrl: null,
              isSpecialOffer: false
            };

            console.log('Tentando inserir produto:', productData);

            const parsed = insertProductSchema.parse(productData);
            const savedProduct = await storage.createProduct(parsed);
            importedProducts.push(savedProduct);
            console.log('Produto importado com sucesso:', savedProduct.id);
          } catch (error) {
            const errorMsg = `Erro ao importar produto: ${JSON.stringify(product)}, Error: ${error.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      res.status(201).json({
        message: `${importedProducts.length} produtos importados com sucesso`,
        productsImported: importedProducts.length,
        totalProducts: products.length,
        errors: errors,
        success: importedProducts.map(p => p.id)
      });
    } catch (error) {
      console.error('Erro geral na importação:', error);
      res.status(400).json({ 
        error: 'Falha ao importar produtos',
        message: error.message,
        details: error instanceof Error ? error.stack : null
      });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  });

  // Orders
  app.get("/api/orders", async (_req, res) => {
    try {
      console.log('Fetching orders...');
      const orders = await storage.getOrders();
      console.log('Orders fetched:', orders);

      const ordersWithDetails = await Promise.all(orders.map(async (order) => {
        try {
          console.log('Fetching details for order:', order.id);
          const store = await storage.getStore(order.storeId);
          const distributor = await storage.getDistributor(order.distributorId);
          const items = await storage.getOrderItems(order.id);

          console.log('Fetching products for order items...');
          const itemsWithProducts = await Promise.all(items.map(async (item) => {
            const product = await storage.getProduct(item.productId);
            return { ...item, product };
          }));

          return {
            ...order,
            store,
            distributor,
            items: itemsWithProducts
          };
        } catch (error) {
          console.error('Error fetching details for order:', order.id, error);
          // Return order with minimal information if details fetch fails
          return {
            ...order,
            store: null,
            distributor: null,
            items: []
          };
        }
      }));

      console.log('Sending response with orders...');
      res.json(ordersWithDetails);
    } catch (error) {
      console.error('Error in /api/orders:', error);
      res.status(500).json({ error: 'Internal server error fetching orders' });
    }
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