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
  { key: "name", label: "Nome do Produto", defaultColumn: "Nome" },
  { key: "itemCode", label: "Código do Item", defaultColumn: "Código" },
  { key: "supplierCode", label: "Código do Fornecedor", defaultColumn: "Cód.Forn." },
  { key: "barCode", label: "Código de Barras", defaultColumn: "Cód.Barra" },
  { key: "description", label: "Departamento", defaultColumn: "Departamento" },
  { key: "unitPrice", label: "Preço Unitário", defaultColumn: "Preço Custo" },
  { key: "boxQuantity", label: "Quantidade por Caixa", defaultColumn: "Grupo" },
  { key: "unit", label: "Unidade", defaultColumn: "Unid." },
];

export function ColumnMapping({ excelColumns, onMappingComplete, isLoading = false }: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Inicializar mapeamento tentando encontrar correspondências por similaridade
  useEffect(() => {
    if (!excelColumns.length) return;

    const initialMapping: Record<string, string> = {};
    SYSTEM_FIELDS.forEach(({ key, defaultColumn }) => {
      // Tenta encontrar a coluna exata primeiro
      let matchingColumn = excelColumns.find(col => col === defaultColumn);

      // Se não encontrar a coluna exata, tenta encontrar por similaridade
      if (!matchingColumn) {
        matchingColumn = excelColumns.find(col => {
          const colLower = col.toLowerCase();
          switch (key) {
            case "name":
              return colLower.includes("nome");
            case "itemCode":
              return colLower.includes("código") || colLower.includes("codigo");
            case "supplierCode":
              return colLower.includes("forn");
            case "barCode":
              return colLower.includes("barra");
            case "description":
              return colLower.includes("depart");
            case "unitPrice":
              return colLower.includes("preço") || colLower.includes("preco") || colLower.includes("custo");
            case "boxQuantity":
              return colLower.includes("grupo") || colLower.includes("quant");
            case "unit":
              return colLower.includes("unid");
            default:
              return false;
          }
        });
      }

      if (matchingColumn) {
        initialMapping[key] = matchingColumn;
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