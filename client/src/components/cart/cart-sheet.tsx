import { ShoppingCart, X, Plus, Minus, Box, Truck } from "lucide-react";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Product, Distributor } from "@shared/schema";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const formatPrice = (price: number): string => {
  return (Math.floor(price * 100) / 100).toFixed(2);
};

export function CartSheet() {
  const { carts, removeFromCart, updateQuantity, clearCart, getCartTotal, getDistributorCart } = useCart();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [open, setOpen] = useState(false);

  // Buscar lojas disponíveis
  const { data: stores = [] } = useQuery<Store[]>({
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
      <SheetContent className="flex flex-col h-full" side="right">
        <SheetHeader>
          <SheetTitle>Carrinho de Compras</SheetTitle>
          <SheetDescription>
            Gerencie seus itens e finalize seus pedidos
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden my-4">
          <ScrollArea className="h-full">
            {carts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2" />
                <p>Seu carrinho está vazio</p>
              </div>
            ) : (
              <>
                {!selectedStore && (
                  <div className="mb-4">
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
                  </div>
                )}
                <Accordion type="single" collapsible className="space-y-4 pr-4">
                  {carts.map((cart) => {
                    const distributorName = getDistributorName(cart.distributorId);
                    const cartTotal = getCartTotal(cart.distributorId);

                    return (
                      <AccordionItem 
                        key={cart.distributorId} 
                        value={cart.distributorId.toString()}
                        className="border rounded-lg p-2"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <div className="text-left">
                              <div className="font-medium">{distributorName}</div>
                              <div className="text-sm text-muted-foreground">
                                {cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'} - Total: ${formatPrice(cartTotal)}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 mt-4">
                            {cart.items.map((item) => {
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
                                        onClick={() => removeFromCart(item.product.id, cart.distributorId)}
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
                                          onClick={() => updateQuantity(item.product.id, cart.distributorId, item.quantity - 1, item.isBoxUnit)}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => updateQuantity(item.product.id, cart.distributorId, item.quantity + 1, item.isBoxUnit)}
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
                            <div className="flex justify-between items-center pt-4 border-t">
                              <div className="font-medium">
                                Total do Distribuidor: ${formatPrice(cartTotal)}
                              </div>
                              <Button 
                                onClick={() => createOrderMutation.mutate({ distributorId: cart.distributorId })}
                                disabled={createOrderMutation.isPending || !selectedStore}
                              >
                                Finalizar Pedido
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total Geral:</span>
                    <span>
                      ${formatPrice(carts.reduce((sum, cart) => sum + getCartTotal(cart.distributorId), 0))}
                    </span>
                  </div>
                </div>
              </>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}