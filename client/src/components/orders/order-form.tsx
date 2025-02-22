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
  const [selectedDistributor, setSelectedDistributor] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Array<{ productId: number; quantity: number }>>([]);

  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
  });

  const { data: stores, isLoading: loadingStores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const { data: distributors, isLoading: loadingDistributors } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: selectedDistributor !== null,
  });

  const filteredProducts = products?.filter(p => p.distributorId === selectedDistributor) || [];

  const handleDistributorChange = (value: string) => {
    const distributorId = Number(value);
    setSelectedDistributor(distributorId);
    form.setValue("distributorId", distributorId);
    setSelectedProducts([]);
  };

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

  if (loadingStores || loadingDistributors) {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="storeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stores?.map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="distributorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distributor</FormLabel>
              <Select onValueChange={handleDistributorChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a distributor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {distributors?.map((distributor) => (
                    <SelectItem key={distributor.id} value={distributor.id.toString()}>
                      {distributor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {selectedDistributor && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Order Items</h3>
              <Button type="button" onClick={addProduct} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {selectedProducts.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={item.productId.toString()}
                          onValueChange={(value) => updateProduct(index, "productId", Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
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
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(index)}
                        >
                          <MinusCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || selectedProducts.length === 0}>
          {isSubmitting ? "Creating..." : "Create Order"}
        </Button>
      </form>
    </Form>
  );
}