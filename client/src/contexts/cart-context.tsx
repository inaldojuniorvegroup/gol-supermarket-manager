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
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number, isBoxUnit: boolean) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Função para formatar preços mantendo exatamente 2 casas decimais sem arredondamento
const formatPrice = (price: number): string => {
  return (Math.floor(price * 100) / 100).toFixed(2);
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity = 1, isBoxUnit = false) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(
        item => item.product.id === product.id && item.isBoxUnit === isBoxUnit
      );

      if (existingItem) {
        return currentItems.map(item =>
          item.product.id === product.id && item.isBoxUnit === isBoxUnit
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...currentItems, { product, quantity, isBoxUnit }];
    });
  };

  const removeFromCart = (productId: number) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number, isBoxUnit: boolean) => {
    if (quantity <= 0) {
      removeFromCart(productId);
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

  const total = items.reduce((sum, item) => {
    const unitPrice = item.isBoxUnit 
      ? (item.product.boxPrice || (item.product.unitPrice * item.product.boxQuantity))
      : item.product.unitPrice;
    return sum + Number(formatPrice(unitPrice)) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}
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