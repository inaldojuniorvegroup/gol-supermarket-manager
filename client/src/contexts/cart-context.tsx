import { createContext, useContext, useState, ReactNode } from "react";
import { Product, Distributor } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
  isBoxUnit: boolean;
}

interface DistributorCart {
  distributorId: number;
  items: CartItem[];
}

interface CartContextType {
  carts: DistributorCart[];
  addToCart: (product: Product, quantity?: number, isBoxUnit?: boolean) => void;
  removeFromCart: (productId: number, distributorId: number) => void;
  updateQuantity: (productId: number, distributorId: number, quantity: number, isBoxUnit: boolean) => void;
  clearCart: (distributorId?: number) => void;
  getCartTotal: (distributorId: number) => number;
  getDistributorCart: (distributorId: number) => CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Função para formatar preços mantendo exatamente 2 casas decimais sem arredondamento
const formatPrice = (price: number): string => {
  return (Math.floor(price * 100) / 100).toFixed(2);
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [carts, setCarts] = useState<DistributorCart[]>([]);

  // Modificando a função addToCart para aceitar produtos sem preço
  const addToCart = (product: Product, quantity = 1, isBoxUnit = true) => {
    setCarts(currentCarts => {
      const distributorCartIndex = currentCarts.findIndex(
        cart => cart.distributorId === product.distributorId
      );

      if (distributorCartIndex === -1) {
        // Create new cart for distributor
        return [...currentCarts, {
          distributorId: product.distributorId,
          items: [{ product, quantity, isBoxUnit }]
        }];
      }

      const updatedCarts = [...currentCarts];
      const existingItemIndex = updatedCarts[distributorCartIndex].items.findIndex(
        item => item.product.id === product.id && item.isBoxUnit === isBoxUnit
      );

      if (existingItemIndex === -1) {
        updatedCarts[distributorCartIndex].items.push({ product, quantity, isBoxUnit });
      } else {
        updatedCarts[distributorCartIndex].items[existingItemIndex].quantity += quantity;
      }

      return updatedCarts;
    });
  };

  const removeFromCart = (productId: number, distributorId: number) => {
    setCarts(currentCarts => {
      const updatedCarts = currentCarts.map(cart => {
        if (cart.distributorId === distributorId) {
          return {
            ...cart,
            items: cart.items.filter(item => item.product.id !== productId)
          };
        }
        return cart;
      }).filter(cart => cart.items.length > 0); // Remove empty carts

      return updatedCarts;
    });
  };

  const updateQuantity = (productId: number, distributorId: number, quantity: number, isBoxUnit: boolean) => {
    if (quantity <= 0) {
      removeFromCart(productId, distributorId);
      return;
    }

    setCarts(currentCarts =>
      currentCarts.map(cart => {
        if (cart.distributorId === distributorId) {
          return {
            ...cart,
            items: cart.items.map(item =>
              item.product.id === productId && item.isBoxUnit === isBoxUnit
                ? { ...item, quantity }
                : item
            )
          };
        }
        return cart;
      })
    );
  };

  const clearCart = (distributorId?: number) => {
    if (distributorId) {
      setCarts(currentCarts => currentCarts.filter(cart => cart.distributorId !== distributorId));
    } else {
      setCarts([]);
    }
  };

  // Atualizando o cálculo do total do carrinho para lidar com preços zerados ou nulos
  const getCartTotal = (distributorId: number): number => {
    const cart = carts.find(cart => cart.distributorId === distributorId);
    if (!cart) return 0;

    return cart.items.reduce((sum, item) => {
      if (item.isBoxUnit) {
        if (!item.product.boxPrice || Number(item.product.boxPrice) === 0) return sum;
        return sum + (Number(item.product.boxPrice) * item.quantity);
      }
      if (!item.product.unitPrice || Number(item.product.unitPrice) === 0) return sum;
      return sum + (Number(item.product.unitPrice) * item.quantity);
    }, 0);
  };

  const getDistributorCart = (distributorId: number): CartItem[] => {
    const cart = carts.find(cart => cart.distributorId === distributorId);
    return cart?.items || [];
  };

  return (
    <CartContext.Provider
      value={{
        carts,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getDistributorCart
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