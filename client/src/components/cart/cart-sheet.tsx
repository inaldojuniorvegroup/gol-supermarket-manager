import { ShoppingCart, X, Plus, Minus, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/cart-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Store, Product } from "@shared/schema";
import { useState } from "react";

// Função para formatar preços mantendo exatamente 2 casas decimais sem arredondamento
const formatPrice = (price: number): string => {
  return (Math.floor(price * 100) / 100).toFixed(2);
};

export function CartSheet() {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [open, setOpen] = useState(false);

  // Buscar lojas disponíveis
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  // Mutation para criar pedido
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStore) {
        throw new Error("Selecione uma loja para finalizar o pedido");
      }

      // Agrupar itens por distribuidor
      const itemsByDistributor = items.reduce((acc, item) => {
        const distributorId = item.product.distributorId;
        if (!acc[distributorId]) {
          acc[distributorId] = [];
        }
        acc[distributorId].push(item);
        return acc;
      }, {} as Record<number, typeof items>);

      // Criar um pedido para cada distribuidor
      const orderPromises = Object.entries(itemsByDistributor).map(async ([distributorId, items]) => {
        const orderTotal = items.reduce((sum, item) => {
          if (item.isBoxUnit) {
            if (!item.product.boxPrice) return sum;
            return sum + (Number(item.product.boxPrice) * item.quantity);
          }
          return sum + (Number(item.product.unitPrice) * item.quantity);
        }, 0);

        // Criar o pedido
        const order = await apiRequest("POST", "/api/orders", {
          distributorId: Number(distributorId),
          storeId: Number(selectedStore),
          status: "pending",
          total: formatPrice(orderTotal)
        });

        const orderData = await order.json();

        // Adicionar os itens ao pedido
        const itemPromises = items.map(item => {
          const price = item.isBoxUnit ? item.product.boxPrice : item.product.unitPrice;
          const total = Number(price) * item.quantity;

          return apiRequest("POST", `/api/orders/${orderData.id}/items`, {
            orderId: orderData.id,
            productId: item.product.id,
            quantity: item.quantity.toString(),
            price: formatPrice(Number(price)),
            total: formatPrice(total),
            isBoxUnit: item.isBoxUnit
          });
        });

        await Promise.all(itemPromises);
        return orderData;
      });

      const orders = await Promise.all(orderPromises);
      return orders;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      clearCart();
      setOpen(false);
      toast({
        title: "Pedido criado com sucesso!",
        description: "Seu pedido foi enviado para processamento."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar pedido",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {items.length}
            </span>
          )}
          <span className="sr-only">Carrinho de Compras</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full" side="right">
        <SheetHeader>
          <SheetTitle>Carrinho de Compras</SheetTitle>
          <SheetDescription>
            Gerencie seus itens e finalize seu pedido
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden my-4">
          <ScrollArea className="h-full">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2" />
                <p>Seu carrinho está vazio</p>
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {items.map((item) => {
                  const price = item.isBoxUnit ? item.product.boxPrice : item.product.unitPrice;
                  const total = Number(price) * item.quantity;

                  return (
                    <div key={`${item.product.id}-${item.isBoxUnit}`} className="bg-muted/30 p-4 rounded-lg">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <div className="text-sm text-muted-foreground">
                              {item.isBoxUnit ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Box className="h-3 w-3" />
                                    <span>Caixa com {item.product.boxQuantity} unidades</span>
                                  </div>
                                  <div>Preço por caixa: ${formatPrice(Number(item.product.boxPrice))}</div>
                                </>
                              ) : (
                                <div>Preço por unidade: ${formatPrice(Number(item.product.unitPrice))}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.isBoxUnit)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.isBoxUnit)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="font-medium">
                            Total: ${formatPrice(total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 mt-auto space-y-4">
            <Select
              value={selectedStore}
              onValueChange={setSelectedStore}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>${formatPrice(total)}</span>
            </div>
            <Button 
              className="w-full" 
              onClick={() => createOrderMutation.mutate()}
              disabled={createOrderMutation.isPending || !selectedStore}
            >
              {createOrderMutation.isPending ? "Processando..." : "Finalizar Pedido"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}