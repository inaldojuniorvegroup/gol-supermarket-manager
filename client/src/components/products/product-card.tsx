import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";
import { Package, Tag, DollarSign, ShoppingCart, Barcode, FileImage, Box, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { formatDistanceToNow } from "date-fns";

interface ProductCardProps {
  product: Product | null;
  isLoading?: boolean;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, isLoading, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setImageError(false);
  }, [product?.imageUrl]);

  const handleAddToCart = () => {
    if (product) {
      onAddToCart(product);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`
      });
    }
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
        {/* Badges no topo do card */}
        <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-center gap-2">
          {product.grupo && (
            <Badge variant="secondary" className="flex-shrink-0">
              {product.grupo}
            </Badge>
          )}
          {product.isSpecialOffer && (
            <Badge variant="destructive" className="flex-shrink-0">
              Special Offer
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
                    {product.grupo && (
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Package className="h-4 w-4" />
                        <span>Grupo: {product.grupo}</span>
                      </div>
                    )}
                    {product.description && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileImage className="h-4 w-4" />
                        <span>Department: {product.description}</span>
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
                        Last updated {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

          <div className="space-y-2">
            {product.grupo && (
              <p className="text-sm font-medium text-primary">
                Grupo: {product.grupo}
              </p>
            )}
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold text-lg">
                {Number(product.unitPrice).toFixed(2)}
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}