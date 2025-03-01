import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, RefreshCw, Package } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface ImageSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onSelectImage: (url: string) => void;
}

export function ImageSearchDialog({
  open,
  onOpenChange,
  product,
  onSelectImage,
}: ImageSearchDialogProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ["/api/products", product.id, "search-images"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${product.id}/search-images`);
      if (!res.ok) throw new Error('Failed to search images');
      return res.json();
    },
    enabled: open,
  });

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
  };

  const validImages = searchResults?.images?.filter(
    (image: string) => !failedImages.has(image)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Buscar Imagens para: {product.name}</span>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Selecione uma das imagens abaixo para associar ao produto ou volte para adicionar uma URL manualmente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="w-full h-40" />
              ))}
            </div>
          ) : validImages && validImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {validImages.map((image: string, index: number) => (
                <div
                  key={index}
                  className="relative group cursor-pointer rounded-lg overflow-hidden"
                  onClick={() => {
                    onSelectImage(image);
                    onOpenChange(false);
                  }}
                >
                  <img
                    src={image}
                    alt={`Opção ${index + 1}`}
                    className="w-full h-40 object-contain bg-white"
                    onError={() => handleImageError(image)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <ImageIcon className="text-white opacity-0 group-hover:opacity-100 h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Nenhuma imagem encontrada</p>
                <p className="text-sm text-muted-foreground">
                  Não encontramos imagens para este produto na nossa busca automática.
                  Você pode voltar e adicionar uma URL de imagem manualmente.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}