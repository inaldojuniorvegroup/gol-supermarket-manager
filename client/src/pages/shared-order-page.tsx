import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Store as StoreIcon, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    } | null;
  }> | null;
}

export default function SharedOrderPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id);

  const { data: order, isLoading, error } = useQuery<OrderWithDetails>({
    queryKey: [`/api/orders/share/${orderId}`],
    retry: 1,
  });

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
            <div className="space-y-1">
              {order.items?.map((item) => (
                <div key={item.id} className="text-sm text-muted-foreground flex justify-between">
                  <span>{item.product?.name || "Product not found"} x{item.quantity}</span>
                  <span>${Number(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 font-semibold pt-2 border-t">
            Total: ${Number(order.total).toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
