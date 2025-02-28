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

interface ImportExcelProps {
  distributorId: number;
}

export default function ImportExcel({ distributorId }: ImportExcelProps) {
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
        description: `${data.productsImported} produtos foram importados com sucesso`,
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

          // Importar em lotes
          const batchSize = 50;
          for (let i = 0; i < validProducts.length; i += batchSize) {
            const batch = validProducts.slice(i, i + batchSize);
            await importMutation.mutateAsync(batch);
          }

        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            title: "Erro ao processar arquivo",
            description: error instanceof Error ? error.message : "Verifique se o arquivo está no formato correto",
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
          Use esta função para importar produtos do catálogo via Excel.
          O arquivo deve conter as colunas: Nome, Código, Cód.Forn., Preço Custo, etc.
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