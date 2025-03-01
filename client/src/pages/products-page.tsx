import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Truck, Package, Image } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { CartSheet } from "@/components/cart/cart-sheet";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ProductsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Otimizar queries com staleTime e cacheTime apropriados
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 30, // 30 minutos
  });

  const { data: distributors = [], isLoading: isLoadingDistributors } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 30, // 30 minutos
  });

  // Mutation para atualizar imagens dos produtos
  const updateImagesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/products/update-images");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Imagens atualizadas",
        description: `${data.updatedCount} produtos foram atualizados com imagens.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar imagens",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Memorizar o filtro de distribuidores
  const filteredDistributors = useMemo(() => {
    return distributors.filter(distributor => {
      if (user?.role === 'distributor') {
        return distributor.id === user.distributorId;
      }
      return true;
    });
  }, [distributors, user?.role, user?.distributorId]);

  // Memorizar a função getDistributorProducts
  const getDistributorProducts = useMemo(() => {
    return (distributorId: number) => {
      return products.filter(product => product.distributorId === distributorId);
    };
  }, [products]);

  // Memorizar a função findSimilarProducts
  const findSimilarProducts = useMemo(() => {
    return (product: Product) => {
      return products.filter(p => 
        p.id !== product.id && 
        p.barCode === product.barCode && 
        p.name === product.name 
      );
    };
  }, [products]);

  if (isLoadingDistributors || isLoadingProducts) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Catálogos</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2 p-5">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-40 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Limitar o número de distribuidores mostrados por vez
  const displayedDistributors = filteredDistributors.slice(0, 8);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="h-8 w-8" />
          Catálogos
        </h1>
        <CartSheet />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedDistributors.map((distributor) => {
          const distributorProducts = getDistributorProducts(distributor.id);

          return (
            <Card 
              key={distributor.id} 
              className="hover:border-primary active:scale-[0.99] cursor-pointer transition-all p-1"
              onClick={() => setLocation(`/catalogo/${distributor.id}`)}
            >
              <CardHeader className="space-y-3 pb-3 p-5">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Truck className="h-6 w-6" />
                  {distributor.name}
                </CardTitle>
                <CardDescription className="flex items-center justify-between text-base">
                  <span>Código: {distributor.code}</span>
                  <span>{distributorProducts.length} produtos</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-5">
                <div className="grid grid-cols-2 gap-3">
                  {distributorProducts.slice(0, 4).map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-muted rounded-lg p-4 text-sm space-y-2"
                    >
                      <div className="font-medium truncate text-base">{product.name}</div>
                      <div className="text-muted-foreground truncate">
                        Código: {product.itemCode}
                      </div>
                      {findSimilarProducts(product).length > 0 && (
                        <Badge variant="secondary" className="text-sm">
                          Disponível em outros distribuidores
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-5">
                <Button variant="outline" className="w-full h-12 text-base">
                  Ver Catálogo Completo
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}