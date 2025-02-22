import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@shared/schema";
import { Tag, Box, Store, ImageOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductCard({ product, onEdit, isLoading }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset image error state when product changes
    setImageError(false);
  }, [product.imageUrl]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4 mt-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-1/3" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="space-y-2">
          {product.imageUrl && !imageError ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            product.imageUrl && (
              <div className="flex items-center justify-center w-full h-48 rounded-lg bg-muted">
                <ImageOff className="h-12 w-12 text-muted-foreground" />
              </div>
            )
          )}
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="line-clamp-2 text-lg">{product.name}</CardTitle>
            {product.isSpecialOffer && (
              <Badge variant="destructive" className="animate-pulse">
                Special Offer
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            <span>Distributor ID: {product.distributorId}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-primary" />
              <span>Code: {product.itemCode}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Box className="h-4 w-4 text-primary" />
              <span>
                {product.boxQuantity} {product.unit} per box
              </span>
            </div>
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 italic">
                {product.description}
              </p>
            )}
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Unit Price:</span>
                <span className="font-bold text-primary">${product.unitPrice}</span>
              </div>
              {product.boxPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Box Price:</span>
                  <span className="font-bold text-primary">${product.boxPrice}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t pt-4">
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}
          </span>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(product)}
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Edit
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}