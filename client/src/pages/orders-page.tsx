import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Order, InsertOrder, insertOrderSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OrderPDF from "@/components/pdf/order-pdf";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
import {
  FileText,
  Plus,
  ShoppingCart,
  Store as StoreIcon,
  Package,
  Share2,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const orderStatuses = {
  'pending': { label: 'Pendente', color: 'default' },
  'processing': { label: 'Em Processamento', color: 'warning' },
  'shipped': { label: 'Enviado', color: 'info' },
  'delivered': { label: 'Entregue', color: 'success' },
  'cancelled': { label: 'Cancelado', color: 'destructive' }
} as const;

export default function OrdersPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const handleShareOrder = async (orderId: number) => {
    const shareUrl = `${window.location.origin}/orders/share/${orderId}?view=vendor`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado",
        description: "Link para visualização do vendedor foi copiado.",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  const { data: orders = [], isLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: 1,
    onSuccess: (data) => {
      // Filtra os pedidos baseado no papel do usuário
      if (user?.role === 'distributor') {
        return data.filter(order => order.distributorId === user?.distributorId);
      }
      return data;
    },
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

  const filteredOrders = user?.role === 'distributor'
    ? orders.filter(order => order.distributorId === user?.distributorId)
    : orders;

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pedidos</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Pedidos
        </h1>
        {user?.role === 'supermarket' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
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
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders?.map((order) => (
          <Card key={order.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">Pedido #{order.id}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                  </CardDescription>
                </div>
                <Badge variant={orderStatuses[order.status as keyof typeof orderStatuses]?.color || 'default'}>
                  {orderStatuses[order.status as keyof typeof orderStatuses]?.label || order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <StoreIcon className="h-3 w-3" />
                  <span className="truncate">{order.store?.name}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span className="truncate">{order.distributor?.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="font-medium">Total: ${Number(order.total).toFixed(2)}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleShareOrder(order.id)}
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
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={loading}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}