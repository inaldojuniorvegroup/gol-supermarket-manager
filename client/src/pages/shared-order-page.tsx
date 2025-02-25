import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useParams, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Store as StoreIcon, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
    productId: number;
    product?: {
      id: number;
      name: string;
      itemCode: string;
      supplierCode: string;
      barCode: string;
    } | null;
  }> | null;
}

export default function SharedOrderPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id);
  const { toast } = useToast();
  const search = useSearch();
  const isVendorView = new URLSearchParams(search).get('view') === 'vendor';
  const [editedItems, setEditedItems] = useState<{[key: number]: { quantity: string; price: string }}>({});

  const { data: order, isLoading, error } = useQuery<OrderWithDetails>({
    queryKey: [`/api/orders/share/${orderId}`],
    retry: 1,
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, price }: { productId: number; price: string }) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, {
        unitPrice: price
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product updated",
        description: "Product price has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating product",
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

  if (error || !order) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <h2 className="text-2xl font-bold">Order not found</h2>
              <p>This order might have been deleted or is not available for sharing.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order #{order.id}
          </CardTitle>
          <CardDescription>
            Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StoreIcon className="h-4 w-4" />
            {order.store?.name || "Store not found"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {order.distributor?.name || "Distributor not found"}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Items:</p>
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
                      <p className="font-medium">{item.product?.name || "Product not found"}</p>
                      {isVendorView ? (
                        <p className="text-sm text-muted-foreground">
                          Código do Fornecedor: {item.product?.supplierCode}
                        </p>
                      ) : (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Código: {item.product?.itemCode}</p>
                          <p>Código do Fornecedor: {item.product?.supplierCode}</p>
                          <p>Código de Barras: {item.product?.barCode}</p>
                        </div>
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
                          Update Price
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