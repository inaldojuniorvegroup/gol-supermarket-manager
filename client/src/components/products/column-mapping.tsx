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
    required: true,
    alternatives: ["Nome Produto", "Produto", "Descrição", "Descricao", "Item", "Nome Item"] 
  },
  { 
    key: "itemCode", 
    label: "Código do Item", 
    defaultColumn: "Código",
    required: true,
    alternatives: ["Cod", "Codigo", "Código Produto", "Codigo Produto", "SKU", "Referência", "Ref"] 
  },
  { 
    key: "supplierCode", 
    label: "Código do Fornecedor", 
    defaultColumn: "Cód.Forn.",
    required: false,
    alternatives: ["Código Fornecedor", "Cod Forn", "Codigo Fornecedor", "Ref Fornecedor"] 
  },
  { 
    key: "barCode", 
    label: "Código de Barras", 
    defaultColumn: "Cód.Barra",
    required: false,
    alternatives: ["EAN", "Código EAN", "Codigo Barras", "Código Barras", "GTIN", "Cod Barras"] 
  },
  { 
    key: "description", 
    label: "Departamento/Categoria", 
    defaultColumn: "Departamento",
    required: false,
    alternatives: ["Categoria", "Setor", "Grupo Produto", "Tipo", "Linha"] 
  },
  { 
    key: "unitPrice", 
    label: "Preço Unitário", 
    defaultColumn: "Preço Custo",
    required: false,
    alternatives: ["Preco", "Preço", "Valor", "Custo", "Preço Unit", "Preco Unitario", "Valor Unitário", "Custo Unit"] 
  },
  { 
    key: "boxQuantity", 
    label: "Quantidade por Caixa/Grupo", 
    defaultColumn: "Grupo",
    required: false,
    alternatives: ["Qtd Grupo", "Qtd Caixa", "Quantidade Grupo", "Quantidade", "Qtd", "Qtd por Caixa", "Qtd/Cx"] 
  },
  { 
    key: "unit", 
    label: "Unidade de Medida", 
    defaultColumn: "Unid.",
    required: false,
    alternatives: ["Unidade", "UN", "Medida", "UND", "Unid", "Un Medida"] 
  },
];

export function ColumnMapping({ excelColumns, onMappingComplete, isLoading = false }: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!excelColumns.length) return;

    const initialMapping: Record<string, string> = {};

    // Log das colunas do Excel para debug
    console.log("Colunas disponíveis no Excel:", excelColumns);

    SYSTEM_FIELDS.forEach(({ key, defaultColumn, alternatives }) => {
      // Normaliza o texto para comparação (remove acentos e converte para minúsculas)
      const normalize = (text: string) => text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, ''); // Remove todos os caracteres especiais

      // Tenta encontrar a coluna exata primeiro
      let matchingColumn = excelColumns.find(col => 
        normalize(col) === normalize(defaultColumn)
      );

      console.log(`Procurando correspondência para ${key}:`, {
        defaultColumn,
        normalized: normalize(defaultColumn),
        matchingColumn
      });

      // Se não encontrar, tenta as alternativas
      if (!matchingColumn && alternatives) {
        matchingColumn = excelColumns.find(col => 
          alternatives.some(alt => normalize(col) === normalize(alt))
        );

        if (matchingColumn) {
          console.log(`Encontrado através de alternativas para ${key}:`, matchingColumn);
        }
      }

      // Se ainda não encontrar, tenta por similaridade parcial
      if (!matchingColumn) {
        matchingColumn = excelColumns.find(col => {
          const normalizedCol = normalize(col);
          return [defaultColumn, ...(alternatives || [])].some(alt => 
            normalizedCol.includes(normalize(alt)) || 
            normalize(alt).includes(normalizedCol)
          );
        });

        if (matchingColumn) {
          console.log(`Encontrado através de similaridade parcial para ${key}:`, matchingColumn);
        }
      }

      if (matchingColumn) {
        initialMapping[key] = matchingColumn;
      } else {
        console.log(`Nenhuma correspondência encontrada para ${key}`);
        initialMapping[key] = "_EMPTY";
      }
    });

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
    // Verificar campos obrigatórios
    const missingRequired = SYSTEM_FIELDS
      .filter(field => field.required)
      .filter(field => mapping[field.key] === "_EMPTY");

    if (missingRequired.length > 0) {
      console.error("Campos obrigatórios não mapeados:", missingRequired);
      return;
    }

    console.log("Mapeamento final:", mapping);
    onMappingComplete(mapping);
  };

  const isMappingComplete = SYSTEM_FIELDS
    .filter(field => field.required)
    .every(({ key }) => mapping[key] && mapping[key] !== "_EMPTY");

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
        Os campos marcados com * são obrigatórios.
        Selecione a coluna do seu arquivo que corresponde a cada campo necessário.
      </div>

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