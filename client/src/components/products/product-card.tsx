import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product, Distributor } from "@shared/schema";
import { Package, Tag, ShoppingCart, Barcode, Box, Info, FolderOpen, Folder, Plus, Minus, Scale, PackageOpen, Percent, LayersIcon, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

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

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

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

  const hasSpecialOffer = product.specialOfferPrice && product.specialOfferEndDate && new Date(product.specialOfferEndDate) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative h-full overflow-hidden hover:shadow-lg transition-all duration-200">
        <div className="absolute top-2 left-2 right-2 z-10 flex flex-col gap-1">
          <div className="flex flex-wrap gap-1">
            {product.description && (
              <Badge variant="outline" className="flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                {product.description}
              </Badge>
            )}
            {similarProducts.length > 0 && !isVendorView && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Scale className="h-3 w-3" />
                {similarProducts.length} outros fornecedores
              </Badge>
            )}
            {hasSpecialOffer && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Oferta Especial
              </Badge>
            )}
          </div>
          {product.grupo && (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              <LayersIcon className="h-3 w-3" />
              {product.grupo}
            </Badge>
          )}
        </div>

        <CardHeader className="p-0">
          <div className="flex items-center justify-center w-full h-48 bg-muted">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="object-contain h-full w-full"
              />
            ) : (
              <Package className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4 pt-16">
          <div>
            <div className="flex items-center justify-between">
              <CardTitle className="line-clamp-2 text-base mb-2 flex-1">
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
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-semibold">Informações do Produto</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span>Código: {product.itemCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span>Código Fornecedor: {product.supplierCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Barcode className="h-4 w-4" />
                          <span>EAN: {product.barCode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-semibold">Categoria</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <LayersIcon className="h-4 w-4" />
                          <span>Grupo: {product.grupo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-semibold">Preços e Embalagem</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Preço Unitário: ${Number(product.unitPrice).toFixed(2)}</span>
                        </div>
                        {product.previousUnitPrice && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Preço Anterior: ${Number(product.previousUnitPrice).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <PackageOpen className="h-4 w-4" />
                          <span>Unidade: {product.unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4" />
                          <span>Quantidade por Caixa: {product.boxQuantity} {product.unit}</span>
                        </div>
                        {product.boxPrice && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>Preço da Caixa: ${Number(product.boxPrice).toFixed(2)}</span>
                          </div>
                        )}
                        {product.previousBoxPrice && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Preço Anterior da Caixa: ${Number(product.previousBoxPrice).toFixed(2)}</span>
                          </div>
                        )}
                        {hasSpecialOffer && (
                          <div className="flex items-center gap-2 text-destructive font-medium">
                            <Percent className="h-4 w-4" />
                            <span>Preço Promocional: ${Number(product.specialOfferPrice).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Última atualização {formatDistanceToNow(new Date(product.updatedAt), { 
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {hasSpecialOffer ? (
                  <>
                    <span className="font-semibold text-lg text-destructive">
                      ${Number(product.specialOfferPrice).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${Number(product.unitPrice).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-lg text-primary">
                    ${Number(product.unitPrice).toFixed(2)}
                  </span>
                )}
              </div>
              {product.boxPrice && product.boxQuantity && (
                <div className="text-sm text-muted-foreground">
                  Caixa ({product.boxQuantity} {product.unit}): ${Number(product.boxPrice).toFixed(2)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isVendorView && similarProducts.length > 0 && (
                <PriceComparisonDialog
                  product={product}
                  similarProducts={similarProducts}
                  distributors={distributors}
                />
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