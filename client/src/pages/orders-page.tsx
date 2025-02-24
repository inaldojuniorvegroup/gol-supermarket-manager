import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Order, InsertOrder, insertOrderSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OrderPDF from "@/components/pdf/order-pdf";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, Plus, ShoppingCart, Store as StoreIcon, 
  Package, Share2 
} from "lucide-react";

// Interface para os dados do pedido
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

export default function OrdersPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleShareOrder = async (orderId: number) => {
    const shareUrl = `${window.location.origin}/orders/share/${orderId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
    retry: 1,
    onError: () => {
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar a lista de pedidos. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const { data: distributors = [] } = useQuery({
    queryKey: ["/api/distributors"],
  });

  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      total: "0",
      status: "pending"
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Pedido criado",
        description: "O pedido foi criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar pedido",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (ordersError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h1 className="text-3xl font-bold text-destructive">Erro ao carregar pedidos</h1>
        <p className="text-muted-foreground">
          Ocorreu um erro ao carregar os pedidos. Por favor, tente novamente mais tarde.
        </p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/orders"] })}
          variant="outline"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (ordersLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pedidos</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Pedido</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para criar um novo pedido.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="storeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loja</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma loja" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stores?.map((store) => (
                            <SelectItem key={store.id} value={store.id.toString()}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="distributorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distribuidor</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um distribuidor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {distributors?.map((distributor) => (
                            <SelectItem
                              key={distributor.id}
                              value={distributor.id.toString()}
                            >
                              {distributor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Pedido"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders?.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Pedido #{order.id}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShareOrder(order.id)}
                    title="Share order"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {order.store && order.distributor && order.items && (
                    <PDFDownloadLink
                      document={
                        <OrderPDF
                          order={order}
                          items={order.items}
                          store={order.store}
                          distributor={order.distributor}
                        />
                      }
                      fileName={`pedido-${order.id}.pdf`}
                    >
                      {({ loading }) => (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          disabled={loading}
                          title="Download PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
              <div className="space-y-2">
                <p className="text-sm font-medium">Itens:</p>
                <div className="space-y-1">
                  {order.items?.map((item) => (
                    <div key={item.id} className="text-sm text-muted-foreground flex justify-between">
                      <span>{item.product?.name || "Produto não encontrado"} x{item.quantity}</span>
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
        ))}
      </div>
    </div>
  );
}