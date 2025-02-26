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
  CardFooter,
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
  Clock,
  CalendarDays,
  DollarSign,
  Tag,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

const orderStatuses = {
  'pending': { label: 'Pendente', color: 'default' },
  'processing': { label: 'Em Processamento', color: 'warning' },
  'shipped': { label: 'Enviado', color: 'info' },
  'delivered': { label: 'Entregue', color: 'success' },
  'cancelled': { label: 'Cancelado', color: 'destructive' }
} as const;

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
  const { user } = useAuth();

  const handleShareOrder = async (orderId: number) => {
    const shareUrl = `${window.location.origin}/orders/share/${orderId}?view=vendor`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado",
        description: "Link para visualização do vendedor foi copiado para a área de transferência.",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link para a área de transferência",
        variant: "destructive",
      });
    }
  };

  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<OrderWithDetails[]>({
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

  // Get only the orders for this distributor if logged in as distributor
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

  if (ordersLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pedidos</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Pedidos</h1>
        </div>
        {user?.role === 'supermarket' && (
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
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders?.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      Pedido #{order.id}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={orderStatuses[order.status as keyof typeof orderStatuses]?.color || 'default'}>
                  {orderStatuses[order.status as keyof typeof orderStatuses]?.label || order.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <StoreIcon className="h-4 w-4" />
                      Loja
                    </div>
                    <div className="font-medium">{order.store?.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Distribuidor
                    </div>
                    <div className="font-medium">{order.distributor?.name}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Itens do Pedido
                    </span>
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total: ${Number(order.total).toFixed(2)}
                    </span>
                  </div>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div key={item.id} className="text-sm flex justify-between items-center py-1">
                          <div className="flex-1">
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-muted-foreground">
                              {item.quantity}x • ${Number(item.price).toFixed(2)} cada
                            </div>
                          </div>
                          <div className="font-medium">
                            ${Number(item.total).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-muted/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Atualizado {format(new Date(order.updatedAt || order.createdAt), "dd/MM HH:mm")}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleShareOrder(order.id)}
                  title="Compartilhar pedido"
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
                        disabled={loading}
                        title="Baixar PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  Ver Detalhes
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}