import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useParams, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Store as StoreIcon, Package, Clock, Barcode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderWithDetails extends Order {
  store?: {
    id: number;
    name: string;
    code: string;
  } | null;
  distributor?: {
    id: number;
    name: string;
    code: string;
  } | null;
  items?: Array<{
    id: number;
    quantity: string;
    price: string;
    total: string;
    product?: {
      id: number;
      name: string;
      itemCode: string;
      supplierCode: string;
      barCode: string;
      boxQuantity: number;
    } | null;
  }> | null;
}

const orderStatuses = {
  'pending': { label: 'Pendente', color: 'default' },
  'processing': { label: 'Em Processamento', color: 'warning' },
  'shipped': { label: 'Enviado', color: 'info' },
  'delivered': { label: 'Entregue', color: 'success' },
  'cancelled': { label: 'Cancelado', color: 'destructive' }
} as const;

export default function SharedOrderPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id);
  const { toast } = useToast();
  const search = useSearch();
  const isVendorView = new URLSearchParams(search).get('view') === 'vendor';
  const { user } = useAuth();
  const [editedItems, setEditedItems] = useState<{[key: number]: { quantity: string; price: string }}>({});
  const [viewMode, setViewMode] = useState<'supplier' | 'internal'>('supplier');

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: [`/api/orders/share/${orderId}`],
    retry: 1,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      try {
        const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { 
          status: newStatus,
          updatedBy: user?.role
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Falha ao atualizar o status do pedido');
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error('Erro desconhecido ao atualizar status');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/share/${orderId}`] });
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status do pedido.",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    try {
      await updateStatusMutation.mutateAsync(newStatus);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, price }: { productId: number; price: string }) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, {
        unitPrice: price
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto atualizado",
        description: "O preço do produto foi atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEdit = (itemId: number, field: 'quantity' | 'price', value: string) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { quantity: "0", price: "0" }),
        [field]: value
      }
    }));
  };

  const handleUpdateProduct = async (productId: number, price: string) => {
    await updateProductMutation.mutate({ productId, price });
  };

  const calculateTotal = (quantity: string, price: string) => {
    return (Number(quantity || 0) * Number(price || 0)).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Card className="animate-pulse">
          <CardContent className="p-6 space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order || (user?.role === 'distributor' && order.distributorId !== user.distributorId)) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <h2 className="text-2xl font-bold">Pedido não encontrado</h2>
              <p>Você não tem permissão para ver este pedido ou ele não existe.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canUpdateStatus = user?.role === 'distributor' || user?.role === 'supermarket';

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pedido #{order.id}
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              {canUpdateStatus ? (
                <Select
                  value={order.status}
                  onValueChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(orderStatuses).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge 
                  variant={orderStatuses[order.status as keyof typeof orderStatuses]?.color as any || 'default'}
                >
                  {orderStatuses[order.status as keyof typeof orderStatuses]?.label || order.status}
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Última atualização: {new Date(order.updatedAt || order.createdAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StoreIcon className="h-4 w-4" />
            {order.store?.name || "Loja não encontrada"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {order.distributor?.name || "Distribuidor não encontrado"}
          </div>

          {user?.role === 'supermarket' && (
            <Tabs defaultValue="supplier" className="w-full" onValueChange={(value) => setViewMode(value as 'supplier' | 'internal')}>
              <TabsList className="mb-4">
                <TabsTrigger value="supplier" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Código Fornecedor
                </TabsTrigger>
                <TabsTrigger value="internal" className="flex items-center gap-2">
                  <Barcode className="h-4 w-4" />
                  Código Interno
                </TabsTrigger>
              </TabsList>
              {/* <TabsContent value="supplier">
              </TabsContent>
              <TabsContent value="internal">
              </TabsContent> */}
            </Tabs>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Itens:</p>
            <div className="space-y-2">
              {order.items?.map((item) => {
                const editedItem = editedItems[item.id] || { 
                  quantity: item.quantity || "0", 
                  price: item.price || "0" 
                };
                const total = calculateTotal(editedItem.quantity, editedItem.price);

                return (
                  <div key={item.id} className="flex items-center gap-4 p-2 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name || "Produto não encontrado"}</p>
                      {user?.role === 'supermarket' ? (
                        <div className="text-sm text-muted-foreground space-y-1">
                          {viewMode === 'supplier' ? (
                            <>
                              <p>Código do Fornecedor: {item.product?.supplierCode}</p>
                              <p>Código de Barras: {item.product?.barCode}</p>
                            </>
                          ) : (
                            <>
                              <p>Código Interno: {item.product?.itemCode}</p>
                              <p>Código de Barras: {item.product?.barCode}</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Código do Fornecedor: {item.product?.supplierCode}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editedItem.quantity}
                        onChange={(e) => handleEdit(item.id, 'quantity', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        value={editedItem.price}
                        onChange={(e) => handleEdit(item.id, 'price', e.target.value)}
                        className="w-24"
                      />
                      <div className="w-24 text-right">${total}</div>
                      {item.product && editedItem.price !== item.price && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateProduct(item.product!.id, editedItem.price)}
                          disabled={updateProductMutation.isPending}
                        >
                          Atualizar Preço
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 font-semibold pt-2 border-t">
            Total: ${order.items?.reduce((acc, item) => {
              const editedItem = editedItems[item.id] || { 
                quantity: item.quantity || "0", 
                price: item.price || "0" 
              };
              return acc + Number(calculateTotal(editedItem.quantity, editedItem.price));
            }, 0).toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}