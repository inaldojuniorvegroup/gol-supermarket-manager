import { ShoppingCart, X, Plus, Minus, Box, Truck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/cart-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store as StoreType, Product, Distributor } from "@shared/schema";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const formatPrice = (price: number): string => {
  return (Math.floor(price * 100) / 100).toFixed(2);
};

export function CartSheet() {
  const { carts, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [open, setOpen] = useState(false);

  // Buscar lojas disponíveis
  const { data: stores = [] } = useQuery<StoreType[]>({
    queryKey: ["/api/stores"],
  });

  // Buscar distribuidores
  const { data: distributors = [] } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  const getDistributorName = (distributorId: number) => {
    return distributors.find(d => d.id === distributorId)?.name || "Distribuidor";
  };

  // Mutation para criar pedido individual
  const createOrderMutation = useMutation({
    mutationFn: async ({ distributorId }: { distributorId: number }) => {
      if (!selectedStore) {
        throw new Error("Selecione uma loja para finalizar o pedido");
      }

      const cart = carts.find(c => c.distributorId === distributorId);
      if (!cart) throw new Error("Carrinho não encontrado");

      const orderTotal = getCartTotal(distributorId);

      // Criar o pedido
      const order = await apiRequest("POST", "/api/orders", {
        distributorId: distributorId,
        storeId: Number(selectedStore),
        status: "pending",
        total: formatPrice(orderTotal)
      });

      const orderData = await order.json();

      // Adicionar os itens ao pedido
      const itemPromises = cart.items.map(item => {
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
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      clearCart(variables.distributorId);
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

  const totalItems = carts.reduce((sum, cart) => sum + cart.items.length, 0);
  const totalGeral = carts.reduce((sum, cart) => sum + getCartTotal(cart.distributorId), 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {totalItems}
            </span>
          )}
          <span className="sr-only">Carrinho de Compras</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full w-full sm:max-w-xl">
        <SheetHeader className="space-y-4 pb-4">
          <SheetTitle className="text-2xl">Carrinho de Compras</SheetTitle>
          {carts.length > 0 && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span className="font-medium">Selecione a Loja para Entrega</span>
                </div>
                <Select
                  value={selectedStore}
                  onValueChange={setSelectedStore}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Escolha uma loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {carts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mb-2" />
              <p>Seu carrinho está vazio</p>
            </div>
          ) : (
            <div className="space-y-6">
              {carts.map((cart) => {
                const distributorName = getDistributorName(cart.distributorId);
                const cartTotal = getCartTotal(cart.distributorId);

                return (
                  <div key={cart.distributorId} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{distributorName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-base">
                          Total: ${formatPrice(cartTotal)}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {cart.items.map((item) => {
                        const price = item.isBoxUnit ? item.product.boxPrice : item.product.unitPrice;
                        const total = Number(price) * item.quantity;

                        return (
                          <div key={`${item.product.id}-${item.isBoxUnit}`} className="flex items-start gap-4 py-4 border-b last:border-0">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{item.product.name}</h4>
                              <div className="text-sm text-muted-foreground space-y-1">
                                {item.isBoxUnit ? (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <Box className="h-3 w-3" />
                                      <span>Caixa com {item.product.boxQuantity} unidades</span>
                                    </div>
                                    <div>${formatPrice(Number(item.product.boxPrice))} /cx</div>
                                  </>
                                ) : (
                                  <div>${formatPrice(Number(item.product.unitPrice))} /un</div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeFromCart(item.product.id, cart.distributorId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.product.id, cart.distributorId, item.quantity - 1, item.isBoxUnit)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.product.id, cart.distributorId, item.quantity + 1, item.isBoxUnit)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-sm font-medium">
                                ${formatPrice(total)}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="pt-4">
                        <Button
                          className="w-full"
                          onClick={() => createOrderMutation.mutate({ distributorId: cart.distributorId })}
                          disabled={createOrderMutation.isPending || !selectedStore}
                        >
                          {createOrderMutation.isPending ? "Processando..." : "Finalizar Pedido"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {carts.length > 0 && (
          <div className="border-t mt-6 pt-6">
            <div className="flex items-center justify-between text-lg font-medium">
              <span>Total Geral</span>
              <span>${formatPrice(totalGeral)}</span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}