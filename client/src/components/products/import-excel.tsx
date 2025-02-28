import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { read, utils } from "xlsx";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ImportExcelProps {
  distributorId: number;
}

export default function ImportExcel({ distributorId }: ImportExcelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [processedProducts, setProcessedProducts] = useState(0);

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await apiRequest("POST", "/api/products/import", data);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Erro ao importar produtos');
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setProcessedProducts(prev => prev + data.productsImported);
      const newProgress = Math.round((processedProducts / totalProducts) * 100);
      setProgress(newProgress);
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
      setProgress(0);
      setProcessedProducts(0);

      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = read(data, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const products = utils.sheet_to_json(worksheet);

          // Processar produtos
          const transformedProducts = products.map((row: any) => ({
            name: String(row['Nome'] || row['NOME'] || row['Descrição'] || row['DESCRIÇÃO'] || '').trim(),
            itemCode: String(row['Código'] || row['CÓDIGO'] || row['Cod'] || row['COD'] || '').trim(),
            supplierCode: String(row['Cód.Forn.'] || row['COD.FORN'] || row['Código Fornecedor'] || '').trim(),
            barCode: String(row['Cód.Barra'] || row['EAN'] || row['Código de Barras'] || '').trim(),
            description: String(row['Departamento'] || row['DEPARTAMENTO'] || '').trim(),
            grupo: String(row['Grupo'] || row['GRUPO'] || '').trim(),
            unitPrice: parseFloat(String(row['Preço Custo'] || row['PREÇO CUSTO'] || '0').replace(',', '.')) || 0,
            boxQuantity: parseInt(String(row['Qtd/Caixa'] || row['QTD/CAIXA'] || '1')) || 1,
            boxPrice: parseFloat(String(row['Preço Caixa'] || row['PREÇO CAIXA'] || '0').replace(',', '.')) || null,
            unit: String(row['Unid.'] || row['UNIDADE'] || 'un').trim(),
            distributorId: distributorId,
            imageUrl: null,
            isSpecialOffer: false
          }));

          // Validar produtos
          const validProducts = transformedProducts.filter(product => 
            product.name && 
            product.itemCode && 
            product.supplierCode
          );

          if (validProducts.length === 0) {
            throw new Error('Nenhum produto válido encontrado no arquivo.');
          }

          setTotalProducts(validProducts.length);
          toast({
            title: "Iniciando importação",
            description: `Importando ${validProducts.length} produtos...`
          });

          // Importar em lotes maiores (200 produtos por vez)
          const batchSize = 200;
          for (let i = 0; i < validProducts.length; i += batchSize) {
            const batch = validProducts.slice(i, i + batchSize);
            await importMutation.mutateAsync(batch);

            const currentProgress = Math.min(((i + batchSize) / validProducts.length) * 100, 100);
            setProgress(currentProgress);

            // Atualizar toast com progresso
            toast({
              title: "Importando produtos",
              description: `Processados ${Math.min(i + batchSize, validProducts.length)} de ${validProducts.length} produtos`
            });
          }

          toast({
            title: "Importação concluída",
            description: `${validProducts.length} produtos foram importados com sucesso!`
          });

        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            title: "Erro ao processar arquivo",
            description: error instanceof Error ? error.message : "Verifique se o arquivo está no formato correto",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
          setProgress(0);
          setProcessedProducts(0);
          setTotalProducts(0);
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
          Use esta função para importar produtos do catálogo via Excel.
          O arquivo deve conter as colunas: Nome, Código, Cód.Forn., Preço Custo, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="gap-2 w-full sm:w-auto relative"
          disabled={isLoading || importMutation.isPending}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
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

        {(isLoading || importMutation.isPending) && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {processedProducts} de {totalProducts} produtos processados ({Math.round(progress)}%)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}