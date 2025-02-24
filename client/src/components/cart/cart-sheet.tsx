import { ShoppingCart, X, Plus, Minus } from "lucide-react";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Store } from "@shared/schema";
import { useState } from "react";

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
        const orderTotal = items.reduce((sum, item) => 
          sum + (Number(item.product.unitPrice) * item.quantity), 0
        );

        // Criar o pedido
        const order = await apiRequest("POST", "/api/orders", {
          distributorId: Number(distributorId),
          storeId: Number(selectedStore),
          status: "pending",
          total: orderTotal.toString()
        });

        const orderData = await order.json();

        // Adicionar os itens ao pedido
        const itemPromises = items.map(item =>
          apiRequest("POST", `/api/orders/${orderData.id}/items`, {
            orderId: orderData.id,
            productId: item.product.id,
            quantity: item.quantity.toString(),
            price: item.product.unitPrice,
            total: (Number(item.product.unitPrice) * item.quantity).toString()
          })
        );

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
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full" side="right">
        <SheetHeader>
          <SheetTitle>Carrinho de Compras</SheetTitle>
          <SheetDescription>
            Gerencie os itens do seu carrinho e finalize seu pedido
          </SheetDescription>
        </SheetHeader>

        {/* Área de rolagem com altura dinâmica */}
        <div className="flex-1 overflow-hidden my-4">
          <ScrollArea className="h-full">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2" />
                <p>Seu carrinho está vazio</p>
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.product.unitPrice} por unidade
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer fixo com seleção de loja e botão de checkout */}
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
              <span>${total.toFixed(2)}</span>
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