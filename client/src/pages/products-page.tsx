import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product, InsertProduct, insertProductSchema, Distributor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Package, Plus } from "lucide-react";
import ImportExcel from "@/components/products/import-excel";
import { useCart } from "@/contexts/cart-context";
import { CartSheet } from "@/components/cart/cart-sheet";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/products/product-card";

export default function ProductsPage() {
  // 1. Todos os useState hooks
  const [open, setOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // 2. Todos os hooks de contexto
  const { addToCart } = useCart();
  const { toast } = useToast();

  // 3. Todos os useQuery hooks
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: distributors = [] } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  // 4. useForm hook
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
      distributorId: 0
    }
  });

  // 5. useMutation hook
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

  // Extrair departamentos únicos dos produtos
  const departments = Array.from(new Set(products?.map(p => p.description).filter(Boolean) || []));

  // Filtra produtos por distribuidor, departamento e termo de busca
  const filteredProducts = products?.filter(product => {
    const matchesDistributor = selectedDistributor === "all" || product.distributorId === parseInt(selectedDistributor);
    const matchesDepartment = selectedDepartment === "all" || product.description === selectedDepartment;
    const matchesSearch = searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDistributor && matchesDepartment && matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`
    });
  };

  if (isLoadingProducts) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Products</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <ProductCard key={i} product={null} isLoading={true} />
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
            Products
          </h1>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
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
                          <FormLabel>Name</FormLabel>
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
                        name="itemCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="barCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bar Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <Textarea {...field} placeholder="Enter department name" />
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
                              <Input type="number" step="0.01" {...field} />
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
                              <Input type="number" {...field} />
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
                      Create Product
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <CartSheet />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search products..."
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
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
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
              <SelectValue placeholder="Filter by distributor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Distributors</SelectItem>
              {distributors?.map((distributor) => (
                <SelectItem key={distributor.id} value={distributor.id.toString()}>
                  {distributor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            handleAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}