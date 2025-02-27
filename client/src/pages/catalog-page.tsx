import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product, Distributor } from "@shared/schema";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { CartSheet } from "@/components/cart/cart-sheet";
import { ProductCard } from "@/components/products/product-card";

export default function CatalogPage() {
  const { id } = useParams<{ id: string }>();
  const distributorId = parseInt(id);
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();

  const { addToCart } = useCart();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: distributors = [] } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  // Filtra os produtos do distribuidor
  const distributorProducts = products.filter(product => {
    const matchesDistributor = product.distributorId === distributorId;
    const matchesSearch = searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDistributor && matchesSearch;
  });

  // Encontrar produtos similares
  const findSimilarProducts = (product: Product) => {
    return products.filter(p => 
      p.id !== product.id && 
      p.itemCode === product.itemCode && 
      p.name === product.name
    );
  };

  // Agrupa por subcategoria
  const groupedProducts = distributorProducts.reduce((acc, product) => {
    const subcategory = product.description || "Outros";
    if (!acc[subcategory]) {
      acc[subcategory] = [];
    }
    acc[subcategory].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  const handleAddToCart = (product: Product, quantity: number) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/products")}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">
            {distributors.find(d => d.id === distributorId)?.name}
          </h1>
        </div>
        <CartSheet />
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-8">
        {Object.entries(groupedProducts).map(([subcategory, products]) => (
          <div key={subcategory} className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">{subcategory}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  similarProducts={findSimilarProducts(product)}
                  distributors={distributors}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}