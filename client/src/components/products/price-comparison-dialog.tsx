import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product, Distributor } from "@shared/schema";
import { Scale } from "lucide-react";

interface PriceComparisonDialogProps {
  product: Product;
  similarProducts: Product[];
  distributors: Distributor[];
}

export function PriceComparisonDialog({
  product,
  similarProducts,
  distributors,
}: PriceComparisonDialogProps) {
  const allProducts = [product, ...similarProducts];
  
  const getDistributorName = (distributorId: number) => {
    return distributors.find(d => d.id === distributorId)?.name || "Unknown";
  };

  // Sort products by price
  const sortedProducts = allProducts.sort((a, b) => Number(a.unitPrice) - Number(b.unitPrice));
  
  // Calculate price difference percentage
  const calculatePriceDiff = (price: number) => {
    const lowestPrice = Number(sortedProducts[0].unitPrice);
    const diff = ((price - lowestPrice) / lowestPrice) * 100;
    return diff.toFixed(1);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Scale className="h-4 w-4" />
          Comparar Preços
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comparação de Preços - {product.name}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Distribuidor</TableHead>
              <TableHead>Código</TableHead>
              <TableHead className="text-right">Preço Unit.</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((p) => {
              const priceDiff = calculatePriceDiff(Number(p.unitPrice));
              const isLowestPrice = p === sortedProducts[0];
              
              return (
                <TableRow key={`${p.distributorId}-${p.itemCode}`}>
                  <TableCell className="font-medium">
                    {getDistributorName(p.distributorId)}
                  </TableCell>
                  <TableCell>{p.itemCode}</TableCell>
                  <TableCell className="text-right">
                    <span className={isLowestPrice ? "text-green-600 font-bold" : ""}>
                      ${Number(p.unitPrice).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {isLowestPrice ? (
                      <span className="text-green-600">Melhor preço</span>
                    ) : (
                      <span className="text-red-600">+{priceDiff}%</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
