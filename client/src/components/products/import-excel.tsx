import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { read, utils } from "xlsx";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ImportExcel() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await apiRequest("POST", "/api/products/import", data);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Erro ao importar produtos');
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produtos importados",
        description: `${data.productsImported} produtos foram importados com sucesso de um total de ${data.totalProducts}`,
      });

      // Se houver erros, mostrar em um toast separado
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Alguns produtos não foram importados",
          description: `${data.errors.length} produtos não puderam ser importados. Verifique os dados e tente novamente.`,
          variant: "destructive",
        });
        console.error('Erros na importação:', data.errors);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao importar",
        description: error.message,
        variant: "destructive",
      });
      console.error('Erro detalhado:', error);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsLoading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = read(data, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const products = utils.sheet_to_json(worksheet);

          // Processar em lotes menores
          const batchSize = 50;
          const batches = [];
          for (let i = 0; i < products.length; i += batchSize) {
            batches.push(products.slice(i, i + batchSize));
          }

          // Importar cada lote
          let importedCount = 0;
          for (const batch of batches) {
            await importMutation.mutateAsync(batch);
            importedCount += batch.length;
            toast({
              title: "Importando produtos",
              description: `Processados ${importedCount} de ${products.length} produtos`,
            });
          }

        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            title: "Erro ao processar arquivo",
            description: "Verifique se o arquivo está no formato correto",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique se o arquivo está no formato correto",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Importação em Massa</CardTitle>
        <CardDescription>
          Use esta função apenas para importação inicial do catálogo ou atualizações em lote.
          Para adições ou alterações pontuais, utilize o formulário de cadastro individual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="gap-2 w-full sm:w-auto"
          disabled={isLoading || importMutation.isPending}
        >
          <Upload className="h-4 w-4" />
          <label className="cursor-pointer">
            {isLoading ? "Importando..." : "Selecionar Arquivo Excel"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isLoading || importMutation.isPending}
            />
          </label>
        </Button>
      </CardContent>
    </Card>
  );
}