import { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
  isBoxUnit: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, isBoxUnit?: boolean) => void;
  removeFromCart: (productId: number, isBoxUnit: boolean) => void;
  updateQuantity: (productId: number, quantity: number, isBoxUnit: boolean) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity = 1, isBoxUnit = false) => {
    // Verificar se tem preço de caixa quando isBoxUnit é true
    if (isBoxUnit && !product.boxPrice) {
      console.warn("Tentativa de adicionar produto sem preço de caixa como caixa");
      return;
    }

    setItems(currentItems => {
      // Encontrar item existente com mesmo ID e mesmo tipo (caixa/unidade)
      const existingItemIndex = currentItems.findIndex(
        item => item.product.id === product.id && item.isBoxUnit === isBoxUnit
      );

      if (existingItemIndex >= 0) {
        // Atualizar quantidade se o item já existe
        return currentItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // Adicionar novo item com a flag isBoxUnit
      return [...currentItems, { 
        product, 
        quantity, 
        isBoxUnit 
      }];
    });
  };

  const removeFromCart = (productId: number, isBoxUnit: boolean) => {
    setItems(currentItems => 
      currentItems.filter(item => 
        !(item.product.id === productId && item.isBoxUnit === isBoxUnit)
      )
    );
  };

  const updateQuantity = (productId: number, quantity: number, isBoxUnit: boolean) => {
    if (quantity <= 0) {
      removeFromCart(productId, isBoxUnit);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId && item.isBoxUnit === isBoxUnit
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calcular o total usando o preço correto (caixa ou unidade)
  const total = items.reduce((sum, item) => {
    const price = item.isBoxUnit 
      ? Number(item.product.boxPrice || 0)
      : Number(item.product.unitPrice || 0);

    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider
      value={{ 
        items, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        total 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}