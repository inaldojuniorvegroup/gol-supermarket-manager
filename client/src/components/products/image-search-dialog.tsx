import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ["/api/products", product.id, "search-images"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${product.id}/search-images`);
      if (!res.ok) throw new Error('Failed to search images');
      return res.json();
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Buscar Imagens para: {product.name}</span>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="w-full h-40" />
              ))}
            </div>
          ) : searchResults?.images && Array.isArray(searchResults.images) && searchResults.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {searchResults.images.map((image: string, index: number) => (
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
                    alt={`Option ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <ImageIcon className="text-white opacity-0 group-hover:opacity-100 h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Nenhuma imagem encontrada
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}