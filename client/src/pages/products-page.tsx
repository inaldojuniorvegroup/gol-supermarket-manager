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
import { Truck, Package } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { CartSheet } from "@/components/cart/cart-sheet";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery<{
    data: Product[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: ["/api/products", page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/products?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
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

  // Função para obter os produtos de um distribuidor
  const getDistributorProducts = (distributorId: number) => {
    if (!productsResponse?.data) return [];
    return productsResponse.data.filter(product => product.distributorId === distributorId);
  };

  // Função para encontrar produtos similares
  const findSimilarProducts = (product: Product) => {
    if (!productsResponse?.data) return [];
    return productsResponse.data.filter(p => 
      p.id !== product.id && 
      p.barCode === product.barCode && 
      p.name === product.name 
    );
  };

  if (isLoadingDistributors || isLoadingProducts) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Catálogos</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40" />
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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Catálogos
        </h1>
        <CartSheet />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDistributors.map((distributor) => {
          const distributorProducts = getDistributorProducts(distributor.id);

          return (
            <Card 
              key={distributor.id} 
              className="hover:border-primary cursor-pointer transition-colors"
              onClick={() => setLocation(`/catalogo/${distributor.id}`)}
            >
              <CardHeader className="space-y-2 pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {distributor.name}
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>Código: {distributor.code}</span>
                  <span>{distributorProducts.length} produtos</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {distributorProducts.slice(0, 4).map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-muted rounded-lg p-2 text-xs space-y-1"
                    >
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-muted-foreground truncate">
                        Código: {product.itemCode}
                      </div>
                      {findSimilarProducts(product).length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          Disponível em outros distribuidores
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Ver Catálogo Completo
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {productsResponse?.pagination && productsResponse.pagination.totalPages > 1 && (
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
            onClick={() => setPage(p => Math.min(productsResponse.pagination.totalPages, p + 1))}
            disabled={page === productsResponse.pagination.totalPages}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}