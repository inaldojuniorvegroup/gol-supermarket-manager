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
  { 
    key: "name", 
    label: "Nome do Produto", 
    defaultColumn: "Nome",
    alternatives: ["Nome Produto", "Produto", "Descrição", "Descricao"] 
  },
  { 
    key: "itemCode", 
    label: "Código do Item", 
    defaultColumn: "Código",
    alternatives: ["Cod", "Codigo", "Código Produto", "Codigo Produto"] 
  },
  { 
    key: "supplierCode", 
    label: "Código do Fornecedor", 
    defaultColumn: "Cód.Forn.",
    alternatives: ["Código Fornecedor", "Cod Forn", "Codigo Fornecedor"] 
  },
  { 
    key: "barCode", 
    label: "Código de Barras", 
    defaultColumn: "Cód.Barra",
    alternatives: ["EAN", "Código EAN", "Codigo Barras", "Código Barras"] 
  },
  { 
    key: "description", 
    label: "Departamento/Categoria", 
    defaultColumn: "Departamento",
    alternatives: ["Categoria", "Setor", "Grupo Produto"] 
  },
  { 
    key: "unitPrice", 
    label: "Preço Unitário", 
    defaultColumn: "Preço Custo",
    alternatives: ["Preco", "Preço", "Valor", "Custo", "Preço Unit", "Preco Unitario"] 
  },
  { 
    key: "boxQuantity", 
    label: "Quantidade por Caixa/Grupo", 
    defaultColumn: "Grupo",
    alternatives: ["Qtd Grupo", "Qtd Caixa", "Quantidade Grupo", "Quantidade", "Qtd"] 
  },
  { 
    key: "unit", 
    label: "Unidade de Medida", 
    defaultColumn: "Unid.",
    alternatives: ["Unidade", "UN", "Medida", "UND"] 
  },
];

export function ColumnMapping({ excelColumns, onMappingComplete, isLoading = false }: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Inicializar mapeamento tentando encontrar correspondências por similaridade
  useEffect(() => {
    if (!excelColumns.length) return;

    const initialMapping: Record<string, string> = {};
    SYSTEM_FIELDS.forEach(({ key, defaultColumn, alternatives }) => {
      // Normaliza o texto para comparação (remove acentos e converte para minúsculas)
      const normalize = (text: string) => text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // Tenta encontrar a coluna exata primeiro
      let matchingColumn = excelColumns.find(col => 
        normalize(col) === normalize(defaultColumn)
      );

      // Se não encontrar, tenta as alternativas
      if (!matchingColumn && alternatives) {
        matchingColumn = excelColumns.find(col => 
          alternatives.some(alt => normalize(col) === normalize(alt))
        );
      }

      // Se ainda não encontrar, tenta por similaridade parcial
      if (!matchingColumn) {
        matchingColumn = excelColumns.find(col => {
          const normalizedCol = normalize(col);
          return alternatives?.some(alt => 
            normalizedCol.includes(normalize(alt)) || 
            normalize(alt).includes(normalizedCol)
          );
        });
      }

      if (matchingColumn) {
        initialMapping[key] = matchingColumn;
      } else {
        // Se não encontrar correspondência, use _EMPTY como valor padrão
        initialMapping[key] = "_EMPTY";
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
        Selecione a coluna do seu arquivo que corresponde a cada campo necessário.
        Se algum campo não existir no seu arquivo, selecione "_EMPTY".
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
              <TableCell className="font-medium">{label}</TableCell>
              <TableCell>
                <Select
                  value={mapping[key] || "_EMPTY"}
                  onValueChange={(value) => handleMappingChange(key, value)}
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