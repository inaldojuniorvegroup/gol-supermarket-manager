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
    defaultColumn: "Nome",
    required: true,
    alternatives: ["NOME", "DESCRICAO", "DESCRIÇÃO"] 
  },
  { 
    key: "itemCode", 
    label: "Código do Item", 
    defaultColumn: "Código",
    required: true,
    alternatives: ["CODIGO", "COD", "CÓDIGO"] 
  },
  { 
    key: "grupo", 
    label: "Grupo do Produto", 
    defaultColumn: "Grupo",
    required: false,
    alternatives: ["GRUPO", "CATEGORIA", "LINHA"] 
  },
  { 
    key: "description", 
    label: "Departamento", 
    defaultColumn: "Departamento",
    required: false,
    alternatives: ["DEPARTAMENTO", "DEPT", "SETOR"] 
  },
  { 
    key: "unitPrice", 
    label: "Preço de Compra", 
    defaultColumn: "Preço Compra",
    required: true,
    alternatives: ["PRECO COMPRA", "PREÇO", "VALOR", "CUSTO"] 
  },
  { 
    key: "unit", 
    label: "Unidade de Medida", 
    defaultColumn: "Unid.",
    required: false,
    alternatives: ["UNIDADE", "UND", "UN"] 
  },
  { 
    key: "packsize", 
    label: "Packsize", 
    defaultColumn: "Packsize",
    required: false,
    alternatives: ["PACK SIZE", "TAMANHO", "SIZE"] 
  },
  { 
    key: "boxPrice", 
    label: "Preço da Caixa", 
    defaultColumn: "Preço Caixa",
    required: true,
    alternatives: ["PRECO CAIXA", "PREÇO CX", "VALOR CX", "VL.CX"] 
  },
  { 
    key: "boxQuantity", 
    label: "Quantidade por Caixa", 
    defaultColumn: "Qtd/Caixa",
    required: true,
    alternatives: ["QTD CAIXA", "QTD/CX", "QUANTIDADE CAIXA"] 
  },
  { 
    key: "barCode", 
    label: "Código de Barras", 
    defaultColumn: "Cód.Barra",
    required: false,
    alternatives: ["CODIGO BARRA", "EAN", "GTIN", "COD.BARRA"] 
  },
  { 
    key: "supplierCode", 
    label: "Código do Fornecedor", 
    defaultColumn: "Cód.Forn.",
    required: true,
    alternatives: ["CODIGO FORNECEDOR", "COD.FORN", "COD FORN"] 
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
        <p>Os campos marcados com * são obrigatórios para garantir a qualidade dos dados.</p>
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