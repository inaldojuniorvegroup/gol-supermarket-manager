import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product, Distributor } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Package, Truck } from "lucide-react";
import { CartSheet } from "@/components/cart/cart-sheet";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/cart-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProductsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [selectedDistributor, setSelectedDistributor] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12; // Aumentado para melhor uso do espaço em tablets

  // Otimizar queries com staleTime e cacheTime apropriados
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 30, // 30 minutos
  });

  const { data: distributors = [], isLoading: isLoadingDistributors } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
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

  // Memorizar a função getPaginatedProducts
  const getPaginatedProducts = useMemo(() => {
    return (products: Product[]) => {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      return products.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    };
  }, [page, ITEMS_PER_PAGE]);

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
                  {/* Mostrar apenas 4 produtos no preview */}
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
                <Dialog>
                  <Button variant="outline" className="w-full h-12 text-base" asChild>
                    <DialogTrigger onClick={() => {
                      setSelectedDistributor(distributor.id);
                      setPage(1);
                    }}>
                      Ver Catálogo Completo
                    </DialogTrigger>
                  </Button>
                  <DialogContent className="w-[95%] max-w-5xl h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>Catálogo de Produtos - {distributor.name}</DialogTitle>
                      <DialogDescription>
                        Total de {distributorProducts.length} produtos
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[calc(90vh-12rem)] overflow-y-auto">
                      {getPaginatedProducts(distributorProducts).map((product) => (
                        <Card key={product.id} className="hover:border-primary">
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <CardDescription>Código: {product.itemCode}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="text-base">
                                Preço: ${Number(product.unitPrice).toFixed(2)}
                              </div>
                              {product.boxPrice && (
                                <div className="text-sm text-muted-foreground">
                                  Caixa: ${Number(product.boxPrice).toFixed(2)} ({product.boxQuantity} unidades)
                                </div>
                              )}
                              {findSimilarProducts(product).length > 0 && (
                                <Badge variant="secondary" className="text-sm">
                                  Disponível em outros distribuidores
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {distributorProducts.length > ITEMS_PER_PAGE && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="h-12 px-6"
                        >
                          Anterior
                        </Button>
                        <div className="flex items-center px-4 text-base">
                          Página {page} de {Math.ceil(distributorProducts.length / ITEMS_PER_PAGE)}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.min(Math.ceil(distributorProducts.length / ITEMS_PER_PAGE), p + 1))}
                          disabled={page >= Math.ceil(distributorProducts.length / ITEMS_PER_PAGE)}
                          className="h-12 px-6"
                        >
                          Próxima
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}