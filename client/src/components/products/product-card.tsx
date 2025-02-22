import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@shared/schema";
import { Tag, Box } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="line-clamp-2">{product.name}</CardTitle>
          {product.isSpecialOffer && (
            <Badge variant="destructive">Special Offer</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-4 w-4" />
            <span>Code: {product.itemCode}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Box className="h-4 w-4" />
            <span>
              {product.boxQuantity} {product.unit} per box
            </span>
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">Unit Price:</span>
              <span className="font-bold">${product.unitPrice}</span>
            </div>
            {product.boxPrice && (
              <div className="flex justify-between">
                <span className="font-medium">Box Price:</span>
                <span className="font-bold">${product.boxPrice}</span>
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
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
            Edit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
