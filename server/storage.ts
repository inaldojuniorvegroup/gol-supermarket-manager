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
  // ... rest of the interface remains the same ...
}

export class DatabaseStorage implements IStorage {
  // ... other methods remain the same ...

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
}

export const storage = new DatabaseStorage();