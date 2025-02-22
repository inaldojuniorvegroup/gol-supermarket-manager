import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { read, utils } from "xlsx";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

export default function ImportExcel() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await apiRequest("POST", "/api/products/import", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produtos importados",
        description: "Os produtos foram importados com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao importar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsLoading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const products = utils.sheet_to_json(worksheet);

      await importMutation.mutateAsync(products);
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique se o arquivo está no formato correto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="gap-2"
      disabled={isLoading || importMutation.isPending}
    >
      <Upload className="h-4 w-4" />
      <label className="cursor-pointer">
        Importar Excel
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isLoading || importMutation.isPending}
        />
      </label>
    </Button>
  );
}
