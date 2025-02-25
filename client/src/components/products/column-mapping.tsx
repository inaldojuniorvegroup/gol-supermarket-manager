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
    if (!excelColumns.length) return;

    const initialMapping: Record<string, string> = {};
    SYSTEM_FIELDS.forEach(({ key }) => {
      // Tenta encontrar uma coluna que corresponda ao campo do sistema
      const matchingColumn = excelColumns.find(col => 
        col.toLowerCase().includes(key.toLowerCase()) ||
        (key === "name" && col.toLowerCase().includes("nome")) ||
        (key === "itemCode" && (col.toLowerCase().includes("código") || col.toLowerCase().includes("codigo"))) ||
        (key === "supplierCode" && col.toLowerCase().includes("forn")) ||
        (key === "barCode" && col.toLowerCase().includes("barra")) ||
        (key === "description" && col.toLowerCase().includes("depart")) ||
        (key === "unitPrice" && (col.toLowerCase().includes("preço") || col.toLowerCase().includes("preco"))) ||
        (key === "boxQuantity" && col.toLowerCase().includes("quant")) ||
        (key === "unit" && col.toLowerCase().includes("unid"))
      );

      if (matchingColumn) {
        initialMapping[key] = matchingColumn;
      } else {
        // Se não encontrar correspondência, use a primeira coluna como fallback
        initialMapping[key] = excelColumns[0];
      }
    });

    console.log("Colunas do Excel:", excelColumns);
    console.log("Mapeamento inicial:", initialMapping);
    setMapping(initialMapping);
  }, [excelColumns]);

  const handleMappingChange = (systemField: string, excelColumn: string) => {
    console.log(`Alterando mapeamento: ${systemField} -> ${excelColumn}`);
    setMapping(prev => ({
      ...prev,
      [systemField]: excelColumn
    }));
  };

  const handleComplete = () => {
    console.log("Mapeamento final:", mapping);
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
        Cada campo do sistema precisa ser associado a uma coluna do seu arquivo.
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