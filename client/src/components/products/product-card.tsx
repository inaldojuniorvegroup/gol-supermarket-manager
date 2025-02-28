import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product, Distributor } from "@shared/schema";
import { Package, Tag, ShoppingCart, Barcode, Box, Info, FolderOpen, Plus, Minus, Scale, PackageOpen, LayersIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative h-full overflow-hidden hover:shadow-lg transition-all duration-200">
        {/* Badges */}
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
          </div>
          {product.grupo && (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              <LayersIcon className="h-3 w-3" />
              {product.grupo}
            </Badge>
          )}
        </div>

        {/* Product Image */}
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

        {/* Product Details */}
        <CardContent className="p-4 space-y-4 pt-16">
          {/* Product Name and Info Button */}
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
                  {/* Códigos Section */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Códigos</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            <span>Interno: {product.itemCode}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            <span>Fornecedor: {product.supplierCode}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Barcode className="h-4 w-4" />
                            <span>EAN: {product.barCode}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PackageOpen className="h-4 w-4" />
                            <span>Unidade: {product.unit}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Embalagem Section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Informações da Caixa</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4" />
                          <span>Quantidade: {product.boxQuantity} {product.unit}</span>
                        </div>
                        {product.boxPrice && (
                          <div className="flex items-center gap-2">
                            <span>Preço Caixa: ${Number(product.boxPrice).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Preços Section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Histórico de Preços</h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Atual:</span>
                          <span className="font-medium">${Number(product.unitPrice).toFixed(2)}</span>
                        </div>
                        {product.previousUnitPrice && (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Anterior:</span>
                            <span>${Number(product.previousUnitPrice).toFixed(2)}</span>
                          </div>
                        )}
                        {product.boxPrice && (
                          <>
                            <div className="flex items-center justify-between mt-2">
                              <span>Caixa Atual:</span>
                              <span className="font-medium">${Number(product.boxPrice).toFixed(2)}</span>
                            </div>
                            {product.previousBoxPrice && (
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>Caixa Anterior:</span>
                                <span>${Number(product.previousBoxPrice).toFixed(2)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Última Atualização */}
                    <div className="text-xs text-muted-foreground">
                      Última atualização {formatDistanceToNow(new Date(product.updatedAt), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

          {/* Main Product Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>Cód: {product.itemCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                <span>EAN: {product.barCode}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                <span>Qtd/Cx: {product.boxQuantity}</span>
              </div>
              <div className="flex items-center gap-2">
                <PackageOpen className="h-4 w-4" />
                <span>{product.unit}</span>
              </div>
            </div>
          </div>

          {/* Price Information */}
          <div className="flex flex-col gap-2">
            {/* Unit Price */}
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-lg text-primary">
                ${Number(product.unitPrice).toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">/ unidade</span>
            </div>

            {/* Box Price */}
            {(product.boxPrice || product.boxQuantity) && (
              <div className="bg-muted p-2 rounded-lg">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    <span className="text-sm">Caixa com {product.boxQuantity} {product.unit}</span>
                  </div>
                  <span className="font-medium text-lg text-primary">
                    ${((product.boxPrice || (product.unitPrice * product.boxQuantity))).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground text-right mt-1">
                  (${((product.boxPrice || (product.unitPrice * product.boxQuantity)) / product.boxQuantity).toFixed(2)} por unidade)
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 justify-end pt-2">
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
        </CardContent>
      </Card>
    </motion.div>
  );
}