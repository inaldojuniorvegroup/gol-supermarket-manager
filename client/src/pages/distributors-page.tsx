import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Distributor, Product, insertDistributorSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import * as XLSX from 'xlsx';
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
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, Plus, Truck, Share2 } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { useLocation, useSearch } from "wouter";
import ImportExcel from "@/components/products/import-excel";

export default function DistributorsPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const { user } = useAuth();

  // Buscar distribuidores
  const { data: distributors = [], isLoading } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  // Filtrar distribuidores baseado no papel do usuário
  const filteredDistributors = distributors.filter(distributor => {
    if (user?.role === 'distributor') {
      return distributor.id === user.distributorId;
    }
    return true;
  });

  // Buscar produtos apenas para o distribuidor selecionado
  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedDistributor],
    enabled: selectedDistributor !== null,
  });

  const form = useForm({
    resolver: zodResolver(insertDistributorSchema),
    defaultValues: {
      name: "",
      code: "",
      contact: "",
      phone: "",
      email: "",
      active: true
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof insertDistributorSchema._type) => {
      const res = await apiRequest("POST", "/api/distributors", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/distributors"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Distribuidor criado",
        description: "O distribuidor foi adicionado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar distribuidor",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getDistributorProducts = (distributorId: number) => {
    if (!products) return [];
    return products.filter(product => product.distributorId === distributorId);
  };

  const getPaginatedProducts = (products: Product[]) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return products.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const [, setLocation] = useLocation();
  const search = useSearch();
  const isVendorView = new URLSearchParams(search).get('view') === 'vendor';

  const getShareableLink = (distributorId: number) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/distributors?view=vendor&distributor=${distributorId}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Distribuidores</h1>
        {user?.role === 'supermarket' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Distribuidor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Distribuidor</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para cadastrar um novo distribuidor.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código do Distribuidor</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contato</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    Criar Distribuidor
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDistributors.map((distributor) => (
          <Card key={distributor.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {distributor.name}
              </CardTitle>
              <CardDescription>Código: {distributor.code}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {distributor.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {distributor.email}
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedDistributor(distributor.id);
                        setPage(1);
                      }}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Ver Catálogo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <DialogTitle>Catálogo de Produtos - {distributor.name}</DialogTitle>
                          <DialogDescription>
                            Gerencie os produtos deste distribuidor e importe novos itens.
                          </DialogDescription>
                        </div>
                        {!isVendorView && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(getShareableLink(distributor.id));
                              toast({
                                title: "Link copiado",
                                description: "Link para visualização do vendedor foi copiado para a área de transferência.",
                              });
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartilhar com Vendedor
                          </Button>
                        )}
                      </div>
                    </DialogHeader>

                    {/* Componente de importação */}
                    {!isVendorView && <ImportExcel distributorId={distributor.id} />}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                      {loadingProducts ? (
                        [...Array(4)].map((_, i) => (
                          <Card key={i} className="animate-pulse">
                            <CardContent className="p-4 space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4" />
                              <div className="h-4 bg-muted rounded w-1/2" />
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        getPaginatedProducts(getDistributorProducts(distributor.id)).map((product) => {
                          // Encontrar produtos similares
                          const similarProducts = products.filter(p =>
                            p.id !== product.id &&
                            p.barCode === product.barCode &&
                            p.name === product.name
                          );

                          return (
                            <ProductCard
                              key={product.id}
                              product={product}
                              isVendorView={isVendorView}
                              similarProducts={similarProducts}
                              distributors={distributors}
                            />
                          );
                        })
                      )}
                    </div>

                    {getDistributorProducts(distributor.id).length > ITEMS_PER_PAGE && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => p + 1)}
                          disabled={page * ITEMS_PER_PAGE >= getDistributorProducts(distributor.id).length}
                        >
                          Próximo
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}