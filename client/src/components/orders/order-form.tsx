import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, InsertOrder, Product, Store, Distributor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface OrderFormProps {
  onSubmit: (data: InsertOrder) => void;
  isSubmitting?: boolean;
}

export function OrderForm({ onSubmit, isSubmitting }: OrderFormProps) {
  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
  });

  const { data: stores, isLoading: loadingStores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const { data: distributors, isLoading: loadingDistributors } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  if (loadingStores || loadingDistributors) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
              >
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Order"}
        </Button>
      </form>
    </Form>
  );
}
