import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product, Distributor } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Truck, Package, Search } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { CartSheet } from "@/components/cart/cart-sheet";
import { ProductCard } from "@/components/products/product-card";

export default function ProductsPage() {
  const [selectedDistributor, setSelectedDistributor] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { addToCart } = useCart();
  const { user } = useAuth();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: distributors = [], isLoading: isLoadingDistributors } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  const filteredDistributors = distributors.filter(distributor => {
    if (user?.role === 'distributor') {
      return distributor.id === user.distributorId;
    }
    return true;
  });

  // Obter produtos do distribuidor selecionado
  const getDistributorProducts = (distributorId: number) => {
    return products.filter(product => {
      const matchesDistributor = product.distributorId === distributorId;
      const matchesSearch = searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDistributor && matchesSearch;
    });
  };

  // Agrupar produtos por subcategoria
  const getGroupedProducts = (products: Product[]) => {
    return products.reduce((acc, product) => {
      const subcategory = product.description || "Outros";
      if (!acc[subcategory]) {
        acc[subcategory] = [];
      }
      acc[subcategory].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  };

  if (isLoadingProducts || isLoadingDistributors) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Catálogos</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-muted rounded" />
              </CardContent>
            </Card>
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
            Catálogos
          </h1>
          <CartSheet />
        </div>

        {selectedDistributor === null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDistributors.map((distributor) => (
              <Card 
                key={distributor.id} 
                className="hover:border-primary cursor-pointer transition-colors"
                onClick={() => setSelectedDistributor(distributor.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    {distributor.name}
                  </CardTitle>
                  <CardDescription>Código: {distributor.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Ver Catálogo
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Dialog open={selectedDistributor !== null} onOpenChange={() => setSelectedDistributor(null)}>
            <DialogContent className="max-w-7xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Truck className="h-6 w-6" />
                  Catálogo - {distributors.find(d => d.id === selectedDistributor)?.name}
                </DialogTitle>
                <DialogDescription>
                  Visualize e gerencie os produtos deste distribuidor
                </DialogDescription>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-8 max-h-[70vh] overflow-y-auto">
                {Object.entries(getGroupedProducts(getDistributorProducts(selectedDistributor))).map(([subcategory, products]) => (
                  <div key={subcategory} className="space-y-4">
                    <h3 className="text-xl font-semibold">{subcategory}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}