import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product, Distributor } from "@shared/schema";
import { Package, Tag, ShoppingCart, Barcode, Box, FolderOpen, Plus, Minus, Scale, PackageOpen, LayersIcon, ImageIcon, Pencil, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PriceComparisonDialog } from "./price-comparison-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ImageSearchDialog } from "./image-search-dialog";


// Função para formatar preços mantendo exatamente 2 casas decimais
const formatPrice = (price: number | string): string => {
  return Number(price).toFixed(2);
};

interface ProductCardProps {
  product: Product | null;
  isLoading?: boolean;
  onAddToCart?: (product: Product, quantity: number) => void;
  similarProducts?: Product[];
  distributors?: Distributor[];
  hasBetterPrice?: boolean;
  priceDifference?: number;
  bestPrice?: number;
  bestPriceDistributor?: Distributor;
  isVendorView?: boolean;
}

export function ProductCard({
  product,
  isLoading,
  onAddToCart,
  similarProducts = [],
  distributors = [],
  hasBetterPrice = false,
  priceDifference = 0,
  bestPrice = 0,
  bestPriceDistributor,
  isVendorView = false
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isBoxUnit, setIsBoxUnit] = useState(true); // Default to box unit
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageSearchDialogOpen, setImageSearchDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const { toast } = useToast();

  const updateImageMutation = useMutation({
    mutationFn: async (newImageUrl: string) => {
      if (!product) return;
      const res = await apiRequest("PATCH", `/api/products/${product.id}`, {
        imageUrl: newImageUrl
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setImageDialogOpen(false);
      setImageSearchDialogOpen(false);
      toast({
        title: "Imagem atualizada",
        description: "A imagem do produto foi atualizada com sucesso."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar imagem",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddToCart = () => {
    if (product && onAddToCart) {
      // Verifica se tem preço de caixa quando está no modo caixa
      if (isBoxUnit && !product.boxPrice) {
        toast({
          title: "Erro ao adicionar ao carrinho",
          description: "Este produto não possui preço de caixa definido.",
          variant: "destructive"
        });
        return;
      }

      onAddToCart(product, quantity);
      toast({
        title: "Adicionado ao carrinho",
        description: `${quantity}x ${isBoxUnit ? 'caixas' : 'unidades'} de ${product.name} foi adicionado ao seu carrinho.`
      });
      setQuantity(1);
    }
  };

  const handleUpdateImage = () => {
    if (!imageUrl.trim()) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL de imagem válida.",
        variant: "destructive"
      });
      return;
    }
    updateImageMutation.mutate(imageUrl);
  };

  const handleImageClick = () => {
    if (!isVendorView) {
      setImageUrl(product?.imageUrl || "");
      setImageDialogOpen(true);
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

  // Calcular o preço baseado na seleção (unidade ou caixa)
  const currentPrice = isBoxUnit
    ? (product.boxPrice || (Number(product.unitPrice) * product.boxQuantity))
    : Number(product.unitPrice);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative h-full overflow-hidden hover:shadow-lg transition-all duration-200">
        {/* Price Comparison Badge */}
        {hasBetterPrice && bestPriceDistributor && (
          <div className="absolute top-2 right-2 z-20">
            <Badge variant="destructive" className="flex items-center gap-1">
              <Scale className="h-3 w-3" />
              {priceDifference.toFixed(1)}% mais caro
            </Badge>
          </div>
        )}

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
        <CardHeader className="p-0 relative">
          <div
            className="flex items-center justify-center w-full h-48 bg-muted cursor-pointer relative group"
            onClick={handleImageClick}
          >
            {product.imageUrl ? (
              <>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="object-contain h-full w-full"
                />
                {!isVendorView && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <Pencil className="text-white opacity-0 group-hover:opacity-100 h-8 w-8" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <Package className="h-12 w-12 text-muted-foreground" />
                {!isVendorView && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Clique para adicionar imagem
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        {/* Product Details */}
        <CardContent className="p-4 space-y-4">
          <div>
            <CardTitle className="line-clamp-2 text-base mb-2">
              {product.name}
            </CardTitle>
          </div>

          {/* Códigos e Informações */}
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

          {/* Preço e Comparação */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-semibold text-lg">
                  ${formatPrice(product.boxPrice || (Number(product.unitPrice) * product.boxQuantity))} /cx
                </span>
                <div className="text-sm text-muted-foreground">
                  ${formatPrice(product.unitPrice)} /un
                </div>
              </div>
              {similarProducts.length > 0 && !isVendorView && (
                <PriceComparisonDialog
                  product={product}
                  similarProducts={similarProducts}
                  distributors={distributors}
                />
              )}
            </div>

            {/* Unidade/Caixa Selection */}
            {onAddToCart && (
              <div className="space-y-4">
                <Tabs
                  defaultValue="box"
                  className="w-full"
                  onValueChange={(value) => setIsBoxUnit(value === "box")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="box">Caixa</TabsTrigger>
                    <TabsTrigger value="unit">Unidade</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Quantidade e Adicionar ao Carrinho */}
                <div className="flex items-center gap-2 justify-end">
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
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Update Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Imagem do Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="URL da imagem"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setImageDialogOpen(false);
                  setImageSearchDialogOpen(true);
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateImage} disabled={updateImageMutation.isPending}>
                {updateImageMutation.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Search Dialog */}
      {product && (
        <ImageSearchDialog
          open={imageSearchDialogOpen}
          onOpenChange={setImageSearchDialogOpen}
          product={product}
          onSelectImage={(url) => updateImageMutation.mutate(url)}
        />
      )}
    </motion.div>
  );
}