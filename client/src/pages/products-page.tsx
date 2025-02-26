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

export default function ProductsPage() {
  const [, setLocation] = useLocation();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const { data: distributors = [], isLoading: isLoadingDistributors } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  const filteredDistributors = distributors.filter(distributor => {
    if (user?.role === 'distributor') {
      return distributor.id === user.distributorId;
    }
    return true;
  });

  if (isLoadingDistributors) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Catálogos</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded" />
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredDistributors.map((distributor) => (
          <Card 
            key={distributor.id} 
            className="hover:border-primary cursor-pointer transition-colors"
            onClick={() => setLocation(`/catalogo/${distributor.id}`)}
          >
            <CardHeader className="space-y-1 p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                {distributor.name}
              </CardTitle>
              <CardDescription className="text-xs">Código: {distributor.code}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button variant="outline" size="sm" className="w-full text-sm">
                Ver Catálogo
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}