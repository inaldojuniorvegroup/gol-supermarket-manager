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
import { useMemo } from "react";

export default function ProductsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();

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

  // Função para obter os produtos de um distribuidor
  const getDistributorProducts = (distributorId: number) => {
    return products.filter(product => product.distributorId === distributorId);
  };

  // Função para encontrar produtos similares
  const findSimilarProducts = (product: Product) => {
    return products.filter(p => 
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="h-8 w-8" />
          Catálogos
        </h1>
        <CartSheet />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDistributors.map((distributor) => {
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