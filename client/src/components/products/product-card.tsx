import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product, Distributor } from "@shared/schema";
import { Package, Tag, DollarSign, ShoppingCart, Barcode, FileImage, Box, Info, FolderOpen, Folder, Plus, Minus, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { formatDistanceToNow } from "date-fns";
import { PriceComparisonDialog } from "./price-comparison-dialog";

interface ProductCardProps {
  product: Product | null;
  isLoading?: boolean;
  onAddToCart?: (product: Product, quantity: number) => void;
  similarProducts?: Product[];
  distributors?: Distributor[];
  isVendorView?: boolean;
}

export function ProductCard({ 
  product, 
  isLoading, 
  onAddToCart, 
  similarProducts = [], 
  distributors = [],
  isVendorView = false 
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setImageError(false);
  }, [product?.imageUrl]);

  const handleAddToCart = () => {
    if (product && onAddToCart) {
      onAddToCart(product, quantity);
      toast({
        title: "Adicionado ao carrinho",
        description: `${quantity}x ${product.name} foi adicionado ao seu carrinho.`
      });
      setQuantity(1); 
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  if (isLoading || !product) {
    return (
      <Card className="h-full">
        <CardHeader className="space-y-2">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative h-full overflow-hidden hover:shadow-lg transition-all duration-200">
        <div className="absolute top-2 left-2 right-2 z-10 flex flex-col gap-1">
          <div className="flex justify-between items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              {product.description}
            </Badge>
            {similarProducts.length > 0 && !isVendorView && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Scale className="h-3 w-3" />
                {similarProducts.length} outros fornecedores
              </Badge>
            )}
          </div>
          {product.grupo && (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              <Folder className="h-3 w-3" />
              {product.grupo}
            </Badge>
          )}
        </div>

        <CardHeader className="p-0">
          {product.imageUrl && !imageError ? (
            <div className="relative w-full h-48 overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-48 bg-muted">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <CardTitle className="line-clamp-2 text-base mb-2">
                {product.name}
              </CardTitle>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4" />
                      <span>Item Code: {product.itemCode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4" />
                      <span>Supplier Code: {product.supplierCode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FolderOpen className="h-4 w-4" />
                      <span>Departamento: {product.description}</span>
                    </div>
                    {product.grupo && (
                      <div className="flex items-center gap-2 text-sm">
                        <Folder className="h-4 w-4" />
                        <span>Grupo: {product.grupo}</span>
                      </div>
                    )}
                    {product.barCode && (
                      <div className="flex items-center gap-2 text-sm">
                        <Barcode className="h-4 w-4" />
                        <span>Bar Code: {product.barCode}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Box className="h-4 w-4" />
                      <span>Box Quantity: {product.boxQuantity} {product.unit}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Última atualização {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span>Código: {product.itemCode}</span>
              </div>
              <div className="flex items-center gap-1">
                <Barcode className="h-4 w-4" />
                <span>EAN: {product.barCode}</span>
              </div>
              <div className="flex items-center gap-1">
                <Box className="h-4 w-4" />
                <span>Qtd: {product.boxQuantity} {product.unit}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold text-lg">
                {Number(product.unitPrice).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isVendorView && similarProducts.length > 0 && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => {}}>
                  <Scale className="h-4 w-4" />
                  Comparar Preços
                </Button>
              )}
              {onAddToCart && (
                <>
                  <div className="flex items-center bg-muted rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={decrementQuantity}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={incrementQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddToCart}
                    className="flex items-center"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}