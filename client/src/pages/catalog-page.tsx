import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product, Distributor } from "@shared/schema";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { CartSheet } from "@/components/cart/cart-sheet";
import { ProductCard } from "@/components/products/product-card";

export default function CatalogPage() {
  const { id } = useParams<{ id: string }>();
  const distributorId = parseInt(id);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();
  const ITEMS_PER_PAGE = 12; 

  const { addToCart } = useCart();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 1000 * 60 * 5, 
    cacheTime: 1000 * 60 * 30, 
  });

  const { data: distributor } = useQuery<Distributor>({
    queryKey: [`/api/distributors/${distributorId}`],
    staleTime: 1000 * 60 * 5,
  });

  const { data: distributors = [] } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
    staleTime: 1000 * 60 * 5,
  });

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesDistributor = product.distributorId === distributorId;
      const matchesSearch = searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDistributor && matchesSearch;
    });
  }, [products, distributorId, searchTerm]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  }, [filteredProducts]);

  const findSimilarProducts = useMemo(() => {
    return (product: Product) => {
      return products.filter(p => 
        p.id !== product.id && 
        p.itemCode === product.itemCode &&
        p.name === product.name
      );
    };
  }, [products]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); 
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/products")}
            className="h-12 w-12"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">{distributor?.name}</h1>
        </div>
        <CartSheet />
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => {
            const similarProducts = findSimilarProducts(product);
            return (
              <ProductCard
                key={product.id}
                product={product}
                similarProducts={similarProducts}
                distributors={distributors}
              />
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="h-12 w-12"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div className="flex items-center gap-2 text-base">
              <span className="font-medium">{page}</span>
              <span className="text-muted-foreground">de</span>
              <span className="font-medium">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="h-12 w-12"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        )}

        <div className="text-center text-muted-foreground">
          {filteredProducts.length} produtos encontrados
        </div>
      </div>
    </div>
  );
}