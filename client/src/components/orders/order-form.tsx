import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, InsertOrder, Product, Store, Distributor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, MinusCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderFormProps {
  onSubmit: (data: InsertOrder) => void;
  isSubmitting?: boolean;
}

export function OrderForm({ onSubmit, isSubmitting }: OrderFormProps) {
  const [selectedProducts, setSelectedProducts] = useState<Array<{ productId: number; quantity: number }>>([]);
  const { user } = useAuth();

  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      storeId: user?.storeId || undefined,
      distributorId: 13, // ID do GOL SUPERMARKET
    }
  });

  // Query apenas para a loja de Hyannis (ID 1)
  const { data: hyannisStore } = useQuery<Store>({
    queryKey: ["/api/stores/1"],
  });

  // Query para produtos do GOL SUPERMARKET (ID 13)
  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products?.filter(p => p.distributorId === 13) || [];

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, { productId: 0, quantity: 1 }]);
  };

  const removeProduct = (index: number) => {
    const newProducts = [...selectedProducts];
    newProducts.splice(index, 1);
    setSelectedProducts(newProducts);
  };

  const updateProduct = (index: number, field: "productId" | "quantity", value: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index][field] = value;
    setSelectedProducts(newProducts);
  };

  if (!hyannisStore || loadingProducts) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSubmit = (formData: InsertOrder) => {
    const orderData = {
      ...formData,
      items: selectedProducts,
    };
    onSubmit(orderData);
  };

  if (!user || user?.role !== 'supermarket' || !user.storeId || user.storeId === 1) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-muted-foreground">
          Apenas gerentes de lojas (exceto Hyannis) podem criar pedidos.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">Origem do Pedido</h3>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">Sua loja</p>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">Destino do Pedido</h3>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="font-medium">{hyannisStore.name}</p>
                <p className="text-sm text-muted-foreground">Loja principal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-medium">Itens do Pedido</h3>
            <Button 
              type="button" 
              onClick={addProduct} 
              variant="outline" 
              size="lg"
              className="h-12 px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Produto
            </Button>
          </div>

          {selectedProducts.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base">Produto</TableHead>
                    <TableHead className="text-base">Quantidade</TableHead>
                    <TableHead className="text-base">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.map((item, index) => (
                    <TableRow key={index} className="h-16">
                      <TableCell className="min-w-[300px]">
                        <Select
                          value={item.productId.toString()}
                          onValueChange={(value) => updateProduct(index, "productId", Number(value))}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredProducts.map((product) => (
                              <SelectItem 
                                key={product.id} 
                                value={product.id.toString()}
                                className="h-12 text-base"
                              >
                                {product.name} - ${product.unitPrice}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateProduct(index, "quantity", Number(e.target.value))}
                          className="w-32 h-12 text-base"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="lg"
                          onClick={() => removeProduct(index)}
                          className="h-12 w-12"
                        >
                          <MinusCircle className="h-5 w-5 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || selectedProducts.length === 0}
          className="w-full h-12 text-base mt-8"
        >
          {isSubmitting ? "Criando..." : "Criar Pedido"}
        </Button>
      </form>
    </Form>
  );
}