import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface ColumnMappingProps {
  excelColumns: string[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  isLoading?: boolean;
}

const SYSTEM_FIELDS = [
  { key: "name", label: "Nome do Produto" },
  { key: "itemCode", label: "Código do Item" },
  { key: "supplierCode", label: "Código do Fornecedor" },
  { key: "barCode", label: "Código de Barras" },
  { key: "description", label: "Departamento" },
  { key: "unitPrice", label: "Preço Unitário" },
  { key: "boxQuantity", label: "Quantidade por Caixa" },
  { key: "unit", label: "Unidade" },
];

export function ColumnMapping({ excelColumns, onMappingComplete, isLoading = false }: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Inicializar mapeamento tentando encontrar correspondências por similaridade
  useEffect(() => {
    const initialMapping: Record<string, string> = {};
    SYSTEM_FIELDS.forEach(({ key }) => {
      const matchingColumn = excelColumns.find(col => 
        col.toLowerCase().includes(key.toLowerCase())
      );
      if (matchingColumn) {
        initialMapping[key] = matchingColumn;
      }
    });
    setMapping(initialMapping);
  }, [excelColumns]);

  const handleMappingChange = (systemField: string, excelColumn: string) => {
    setMapping(prev => ({
      ...prev,
      [systemField]: excelColumn
    }));
  };

  const handleComplete = () => {
    onMappingComplete(mapping);
  };

  const isMappingComplete = SYSTEM_FIELDS.every(({ key }) => mapping[key]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Por favor, mapeie as colunas do seu arquivo Excel para os campos correspondentes do sistema.
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campo do Sistema</TableHead>
            <TableHead>Coluna do Excel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SYSTEM_FIELDS.map(({ key, label }) => (
            <TableRow key={key}>
              <TableCell>{label}</TableCell>
              <TableCell>
                <Select
                  value={mapping[key] || ""}
                  onValueChange={(value) => handleMappingChange(key, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Selecione...</SelectItem>
                    {excelColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={!isMappingComplete}
        >
          Confirmar Mapeamento
        </Button>
      </div>
    </div>
  );
}
