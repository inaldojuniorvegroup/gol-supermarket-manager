import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, StoreProduct } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/products/product-card";
import { Search, Package, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

export default function StoreCatalogPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  // Buscar produtos da loja principal (Hyannis)
  const { data: storeProducts = [], isLoading } = useQuery<StoreProduct[]>({
    queryKey: ["/api/store-products"],
  });

  // Buscar todos os produtos disponíveis para adicionar ao catálogo
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Mutation para adicionar produto ao catálogo da loja
  const addToStoreCatalogMutation = useMutation({
    mutationFn: async (product: Product) => {
      const res = await apiRequest("POST", "/api/store-products", {
        productId: product.id,
        storeId: user?.storeId,
        unitPrice: product.unitPrice,
        boxPrice: product.boxPrice,
        stock: 0,
        minStock: 10,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products"] });
      toast({
        title: "Produto adicionado",
        description: "Produto adicionado ao catálogo com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar estoque
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const res = await apiRequest("PATCH", `/api/store-products/${id}/stock`, {
        quantity,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products"] });
      toast({
        title: "Estoque atualizado",
        description: "O estoque foi atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar produtos com base na busca
  const filteredProducts = storeProducts.filter((product) =>
    product.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Produtos disponíveis para adicionar (que ainda não estão no catálogo)
  const availableProducts = allProducts.filter(
    (product) => !storeProducts.some((sp) => sp.productId === product.id)
  );

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Catálogo da Loja
        </h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Produto ao Catálogo</DialogTitle>
              <DialogDescription>
                Selecione os produtos que deseja adicionar ao catálogo da loja
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Código: {product.itemCode}
                    </p>
                  </div>
                  <Button
                    onClick={() => addToStoreCatalogMutation.mutate(product)}
                    disabled={addToStoreCatalogMutation.isPending}
                  >
                    Adicionar
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((storeProduct) => (
          <div key={storeProduct.id} className="space-y-4">
            <ProductCard
              product={allProducts.find((p) => p.id === storeProduct.productId)}
              isLoading={isLoading}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateStockMutation.mutate({
                    id: storeProduct.id,
                    quantity: -1,
                  })
                }
              >
                -
              </Button>
              <span className="flex-1 text-center">
                Estoque: {storeProduct.stock}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateStockMutation.mutate({
                    id: storeProduct.id,
                    quantity: 1,
                  })
                }
              >
                +
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
