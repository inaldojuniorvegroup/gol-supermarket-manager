import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product, InsertProduct, insertProductSchema, Distributor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Truck } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { CartSheet } from "@/components/cart/cart-sheet";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/products/product-card";

export default function ProductsPage() {
  const [open, setOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: distributors = [] } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  // Filtra os produtos baseado nos critérios
  const filteredProducts = products?.filter(product => {
    if (user?.role === 'distributor') {
      return product.distributorId === user.distributorId;
    }

    const matchesDistributor = selectedDistributor === "all" || product.distributorId === parseInt(selectedDistributor);
    const matchesDepartment = selectedDepartment === "all" || product.description === selectedDepartment;
    const matchesSearch = searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDistributor && matchesDepartment && matchesSearch;
  });

  // Primeiro agrupa por distribuidor
  const groupedByDistributor = filteredProducts.reduce((acc, product) => {
    if (!acc[product.distributorId]) {
      acc[product.distributorId] = [];
    }
    acc[product.distributorId].push(product);
    return acc;
  }, {} as Record<number, Product[]>);

  // Depois, para cada distribuidor, agrupa por subcategoria
  const organizedProducts = Object.entries(groupedByDistributor).map(([distributorId, products]) => {
    const distributor = distributors.find(d => d.id === parseInt(distributorId));
    const groupedBySubcategory = products.reduce((acc, product) => {
      const subcategory = product.description || "Outros";
      if (!acc[subcategory]) {
        acc[subcategory] = [];
      }
      acc[subcategory].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    return {
      distributor,
      categories: groupedBySubcategory
    };
  });

  // Get unique departments for filter
  const departments = Array.from(new Set(products?.map(p => p.description).filter(Boolean) || []));

  // Form setup for product creation
  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      itemCode: "",
      supplierCode: "",
      barCode: "",
      name: "",
      description: "",
      unitPrice: "0",
      boxQuantity: 1,
      unit: "UN",
      isSpecialOffer: false,
      imageUrl: "",
      distributorId: user?.distributorId || 0
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Produto criado",
        description: "O produto foi adicionado ao catálogo com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoadingProducts) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Produtos</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <ProductCard key={i} product={null} isLoading={true} onAddToCart={() => {}} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Catálogo de Produtos
          </h1>
          <div className="flex gap-2">
            {user?.role === 'distributor' && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Produto</DialogTitle>
                    <DialogDescription>
                      Preencha os dados abaixo para cadastrar um novo produto.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit((data) => createMutation.mutate({
                        ...data,
                        distributorId: user.distributorId!
                      }))}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="itemCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Code</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="supplierCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier Code</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="barCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bar Code</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Image URL</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="url"
                                  placeholder="https://example.com/image.jpg"
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} placeholder="Enter department name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} value={field.value || "0"} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="boxQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Box Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} value={field.value || "1"} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="distributorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Distributor</FormLabel>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a distributor" />
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
                        Criar Produto
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            <CartSheet />
          </div>
        </div>

        {user?.role === 'supermarket' && (
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department || ""}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedDistributor}
              onValueChange={setSelectedDistributor}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por distribuidor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Distribuidores</SelectItem>
                {distributors?.map((distributor) => (
                  <SelectItem key={distributor.id} value={distributor.id.toString()}>
                    {distributor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-12">
        {organizedProducts.map(({ distributor, categories }) => (
          <div key={distributor?.id} className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <Truck className="h-6 w-6" />
              <h2 className="text-2xl font-bold">{distributor?.name}</h2>
            </div>

            <div className="space-y-8">
              {Object.entries(categories).map(([subcategory, products]) => (
                <div key={subcategory} className="space-y-4">
                  <h3 className="text-xl font-semibold">{subcategory}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={() => addToCart(product)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}