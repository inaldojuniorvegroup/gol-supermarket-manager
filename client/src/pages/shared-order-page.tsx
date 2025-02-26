import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useParams, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ShoppingCart,
  Store as StoreIcon,
  Package,
  Clock,
  Barcode,
  CalendarDays,
  Building2,
  DollarSign,
  Tag,
  FileText,
  ClipboardList,
  BookOpen
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";


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
  const searchParams = new URLSearchParams(search);
  const isVendorView = searchParams.get('view') === 'vendor';
  const showInternalCode = searchParams.get('showInternal') === 'true';
  const { user } = useAuth();
  const [editedItems, setEditedItems] = useState<{[key: number]: { quantity: string; price: string }}>({});
  const [viewMode, setViewMode] = useState<'supplier' | 'internal'>('supplier');
  const [orderTotal, setOrderTotal] = useState("0");

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

  const updateOrderItemMutation = useMutation({
    mutationFn: async ({ itemId, price }: { itemId: number; price: string }) => {
      const res = await apiRequest("PATCH", `/api/order-items/${itemId}`, {
        price
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/share/${orderId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar item do pedido",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleUpdateProduct = async (productId: number, price: string, itemId: number) => {
    try {
      await updateProductMutation.mutateAsync({ productId, price });
      await updateOrderItemMutation.mutateAsync({ itemId, price });
      setEditedItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          price
        }
      }));
      toast({
        title: "Preço atualizado",
        description: "O preço foi atualizado com sucesso no produto e no pedido",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar preço",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    try {
      await updateStatusMutation.mutateAsync(newStatus);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleEdit = (itemId: number, field: 'quantity' | 'price', value: string) => {
    const numValue = Math.max(0, Number(value) || 0);

    setEditedItems(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { quantity: "0", price: "0" }),
        [field]: numValue.toString()
      }
    }));
  };

  const calculateTotal = (items: OrderWithDetails['items'], editedItems: {[key: number]: { quantity: string; price: string }}) => {
    if (!items) return "0";

    return items.reduce((acc, item) => {
      const editedItem = editedItems[item.id] || {
        quantity: item.quantity || "0",
        price: item.price || "0"
      };

      const quantity = Math.max(0, Number(editedItem.quantity) || 0);
      const price = Math.max(0, Number(editedItem.price) || 0);

      return acc + (quantity * price);
    }, 0).toFixed(2);
  };

  useEffect(() => {
    if (order?.items) {
      const newTotal = calculateTotal(order.items, editedItems);
      setOrderTotal(newTotal);
    }
  }, [order?.items, editedItems]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Card className="animate-pulse">
          <CardContent className="p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order || (user?.role === 'distributor' && order.distributorId !== user.distributorId)) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
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
    <div className="container mx-auto p-6 max-w-5xl">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ClipboardList className="h-6 w-6 text-primary" />
                Pedido #{order.id}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Criado em {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm")}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
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
                  className="h-9 px-4 text-sm"
                >
                  {orderStatuses[order.status as keyof typeof orderStatuses]?.label || order.status}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última atualização: {format(new Date(order.updatedAt || order.createdAt), "dd/MM HH:mm")}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <div className="font-medium flex items-center gap-2 text-primary">
                <Building2 className="h-4 w-4" />
                Informações da Loja
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Nome</div>
                    <div className="font-medium">{order.store?.name}</div>
                  </div>
                  {order.store?.code && (
                    <div>
                      <div className="text-sm text-muted-foreground">Código</div>
                      <div className="font-medium">{order.store.code}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium flex items-center gap-2 text-primary">
                <Package className="h-4 w-4" />
                Informações do Distribuidor
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Nome</div>
                    <div className="font-medium">{order.distributor?.name}</div>
                  </div>
                  {order.distributor?.code && (
                    <div>
                      <div className="text-sm text-muted-foreground">Código</div>
                      <div className="font-medium">{order.distributor.code}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {user?.role === 'supermarket' && !isVendorView && (
            <div className="mb-6">
              <Tabs defaultValue="supplier" className="w-full" onValueChange={(value) => setViewMode(value as 'supplier' | 'internal')}>
                <TabsList>
                  <TabsTrigger value="supplier" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Código Fornecedor
                  </TabsTrigger>
                  <TabsTrigger value="internal" className="flex items-center gap-2">
                    <Barcode className="h-4 w-4" />
                    Código Interno
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" />
                Itens do Pedido
              </div>
              <div className="text-2xl font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {orderTotal}
              </div>
            </div>

            <div className="space-y-3">
              {order.items?.map((item) => {
                const editedItem = editedItems[item.id] || {
                  quantity: item.quantity || "0",
                  price: item.price || "0"
                };
                const quantity = Math.max(0, Number(editedItem.quantity) || 0);
                const price = Math.max(0, Number(editedItem.price) || 0);
                const total = quantity * price;

                return (
                  <div key={item.id} className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.product?.name || "Produto não encontrado"}</span>
                          <span className="font-semibold">${total.toFixed(2)}</span>
                        </div>

                        {isVendorView ? (
                          <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                            {showInternalCode ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  Código Interno: {item.product?.itemCode}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Barcode className="h-3 w-3" />
                                  EAN: {item.product?.barCode}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  Código Fornecedor: {item.product?.supplierCode}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Barcode className="h-3 w-3" />
                                  EAN: {item.product?.barCode}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                            {viewMode === 'supplier' ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  Código Fornecedor: {item.product?.supplierCode}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Barcode className="h-3 w-3" />
                                  EAN: {item.product?.barCode}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  Código Interno: {item.product?.itemCode}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Barcode className="h-3 w-3" />
                                  EAN: {item.product?.barCode}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editedItem.quantity}
                          onChange={(e) => handleEdit(item.id, 'quantity', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editedItem.price}
                          onChange={(e) => handleEdit(item.id, 'price', e.target.value)}
                          className="w-24"
                        />
                        {item.product && editedItem.price !== item.price && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateProduct(item.product!.id, editedItem.price, item.id)}
                            disabled={updateProductMutation.isPending || updateOrderItemMutation.isPending}
                          >
                            Atualizar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}