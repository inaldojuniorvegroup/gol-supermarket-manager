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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ColumnMappingProps {
  excelColumns: string[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  isLoading?: boolean;
}

// Campos essenciais para o sistema
const SYSTEM_FIELDS = [
  { 
    key: "name", 
    label: "Nome do Produto", 
    defaultColumn: "DESCRICAO",
    required: true,
    alternatives: ["DESCR", "DESC", "NOME", "PRODUTO"] 
  },
  { 
    key: "itemCode", 
    label: "Código do Item", 
    defaultColumn: "CODIGO",
    required: true,
    alternatives: ["COD", "REFERENCIA", "REF"] 
  },
  { 
    key: "supplierCode", 
    label: "Código do Fornecedor", 
    defaultColumn: "CODFORN",
    required: true,
    alternatives: ["COD_FORN", "FORNECEDOR", "CODFORNECEDOR"] 
  },
  { 
    key: "barCode", 
    label: "Código de Barras", 
    defaultColumn: "GTIN",
    required: true,
    alternatives: ["EAN", "CODBARRAS", "COD_BARRAS"] 
  },
  { 
    key: "description", 
    label: "Departamento", 
    defaultColumn: "DEPARTAMENTO",
    required: true,
    alternatives: ["DEPTO", "SETOR", "SECAO"] 
  },
  { 
    key: "grupo", 
    label: "Grupo", 
    defaultColumn: "GRUPO",
    required: true,
    alternatives: ["CATEGORIA", "LINHA", "FAMILIA"] 
  },
  { 
    key: "unitPrice", 
    label: "Preço Unitário", 
    defaultColumn: "PRECO",
    required: true,
    alternatives: ["VALOR", "CUSTO", "PRECOUNIT"] 
  }
];

export function ColumnMapping({ excelColumns = [], onMappingComplete, isLoading = false }: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!excelColumns || excelColumns.length === 0) return;

    const initialMapping: Record<string, string> = {};
    console.log("Colunas disponíveis no Excel:", excelColumns);

    SYSTEM_FIELDS.forEach(({ key, defaultColumn, alternatives }) => {
      // Normaliza o texto para comparação
      const normalize = (text: string) => text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '');

      // Tenta encontrar uma correspondência exata ou parcial
      let matchingColumn = excelColumns.find(col => {
        const normalizedCol = normalize(col);
        return [defaultColumn, ...(alternatives || [])].some(alt => {
          const normalizedAlt = normalize(alt);
          return normalizedCol === normalizedAlt || 
                 normalizedCol.includes(normalizedAlt) || 
                 normalizedAlt.includes(normalizedCol);
        });
      });

      if (matchingColumn) {
        console.log(`Mapeamento encontrado para ${key}:`, matchingColumn);
        initialMapping[key] = matchingColumn;
      } else {
        console.log(`Nenhuma correspondência encontrada para ${key}`);
        initialMapping[key] = "_EMPTY";
      }
    });

    console.log("Mapeamento inicial:", initialMapping);
    setMapping(initialMapping);
  }, [excelColumns]);

  const handleComplete = () => {
    // Verifica se todos os campos obrigatórios foram mapeados
    const missingRequired = SYSTEM_FIELDS
      .filter(field => field.required)
      .filter(field => !mapping[field.key] || mapping[field.key] === "_EMPTY");

    if (missingRequired.length > 0) {
      const missingFields = missingRequired.map(field => field.label).join(", ");
      setError(`Campos obrigatórios não mapeados: ${missingFields}`);
      console.error("Campos obrigatórios não mapeados:", missingRequired);
      return;
    }

    setError("");
    console.log("Mapeamento final:", mapping);
    onMappingComplete(mapping);
  };

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
        <p>Mapeie as colunas do seu arquivo Excel com os campos do sistema.</p>
        <p>Todos os campos são obrigatórios para garantir a qualidade dos dados.</p>
        <p className="text-xs mt-1">
          Dica: O sistema tentará mapear automaticamente as colunas com base nos nomes mais comuns.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campo do Sistema</TableHead>
            <TableHead>Coluna do Excel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SYSTEM_FIELDS.map(({ key, label, required }) => (
            <TableRow key={key}>
              <TableCell className="font-medium">
                {label} {required && <span className="text-red-500">*</span>}
              </TableCell>
              <TableCell>
                <Select
                  value={mapping[key] || "_EMPTY"}
                  onValueChange={(value) => {
                    console.log(`Alterando mapeamento de ${key} para:`, value);
                    setMapping(prev => ({
                      ...prev,
                      [key]: value
                    }));
                    setError("");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_EMPTY">Não mapear este campo</SelectItem>
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

      <Button 
        onClick={handleComplete}
        disabled={SYSTEM_FIELDS
          .filter(field => field.required)
          .some(field => !mapping[field.key] || mapping[field.key] === "_EMPTY")}
        className="w-full"
      >
        Confirmar Mapeamento
      </Button>
    </div>
  );
}