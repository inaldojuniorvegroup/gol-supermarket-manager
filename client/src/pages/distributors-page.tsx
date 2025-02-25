import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Distributor, InsertDistributor, Product, InsertUser, insertUserSchema, insertDistributorSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, Plus, Truck, User, Package, Upload, UserPlus, Pen, Share2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { ColumnMapping } from "@/components/products/column-mapping";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Folder, FolderOpen } from "lucide-react";
import { useLocation, useSearch } from "wouter";

// Add product edit schema
const editProductSchema = z.object({
  subcategory: z.string().min(1, "Subcategoria é obrigatória"),
  grupo: z.string().min(1, "Grupo é obrigatório"),
});

type EditProductForm = z.infer<typeof editProductSchema>;

function EditProductDialog({ product, onClose }: { product: Product, onClose: () => void }) {
  const { toast } = useToast();
  const form = useForm<EditProductForm>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      subcategory: product.description || "",
      grupo: product.grupo || "",
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, subcategory, grupo }: { id: number, subcategory: string, grupo: string }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, { description: subcategory, grupo });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto atualizado",
        description: "As categorias foram atualizadas com sucesso.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          updateProductMutation.mutate({
            id: product.id,
            subcategory: data.subcategory,
            grupo: data.grupo.toUpperCase()
          });
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="subcategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategoria</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a subcategoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["FRIOS/LACTICNIOS/CONGELADOS", "MERCEARIA", "BEBIDAS", "LIMPEZA", "HORTIFRUTI"].map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grupo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grupo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Digite o grupo do produto (ex: MASSA DE PASTEL)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={updateProductMutation.isPending}>
          Salvar Alterações
        </Button>
      </form>
    </Form>
  );
}

function ProductCard({ product, isVendorView = false }: { product: Product, isVendorView?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <CardDescription>
          {isVendorView ? (
            <>Código do Fornecedor: {product.supplierCode}</>
          ) : (
            <>
              Código: {product.itemCode} |
              Fornecedor: {product.supplierCode} |
              Barcode: {product.barCode}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span>Subcategoria: {product.description}</span>
          </div>
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span>Grupo: {product.grupo}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-semibold">Preço Unit:</span> ${product.unitPrice}
          </div>
          {product.boxPrice && (
            <div>
              <span className="font-semibold">Preço Caixa:</span> ${product.boxPrice}
            </div>
          )}
          <div>
            <span className="font-semibold">Qtd. Caixa:</span> {product.boxQuantity}
          </div>
          <div>
            <span className="font-semibold">Unidade:</span> {product.unit}
          </div>
        </div>
        {!isVendorView && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mt-2">
                <Pen className="h-4 w-4 mr-2" />
                Editar Categorias
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Categorias do Produto</DialogTitle>
                <DialogDescription>
                  Atualize as categorias deste produto.
                </DialogDescription>
              </DialogHeader>
              <EditProductDialog product={product} onClose={() => { }} />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}


export default function DistributorsPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<number | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState<number | null>(null);
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [fileData, setFileData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Adicionar a mutação de atualização dentro do componente
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, description, grupo }: { id: number, description: string, grupo: string }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, { description, grupo });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto atualizado",
        description: "As categorias foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Buscar distribuidores
  const { data: distributors, isLoading } = useQuery<Distributor[]>({
    queryKey: ["/api/distributors"],
  });

  // Filtrar distribuidores baseado no papel do usuário
  const filteredDistributors = distributors?.filter(distributor => {
    if (user?.role === 'distributor') {
      return distributor.id === user.distributorId;
    }
    return true;
  });

  // Buscar produtos apenas para o distribuidor selecionado
  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedDistributor],
    enabled: selectedDistributor !== null,
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/distributors/init");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/distributors"] });
      toast({
        title: "Success",
        description: "Distributors initialized successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error initializing distributors",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const importProductsMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await apiRequest("POST", "/api/products/import", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Products imported successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error importing products",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Efeito para inicializar os distribuidores quando a página carregar
  useEffect(() => {
    if (!distributors || distributors.length === 0) {
      initializeMutation.mutate();
    }
  }, [distributors]);

  const form = useForm<InsertDistributor>({
    resolver: zodResolver(insertDistributorSchema),
    defaultValues: {
      name: "",
      code: "",
      contact: "",
      phone: "",
      email: "",
      active: true
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDistributor) => {
      const res = await apiRequest("POST", "/api/distributors", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/distributors"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Distributor created",
        description: "Distributor has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating distributor",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Atualizar a função handleFileUpload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, distributorId: number) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      console.log('Iniciando processamento do arquivo:', file.name);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];

          // Logging worksheet information
          console.log('Sheet names:', workbook.SheetNames);
          console.log('Current sheet:', workbook.SheetNames[0]);

          // Get the range of cells
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          const headers: string[] = [];

          // Extract headers with detailed logging
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })];
            if (cell && cell.v) {
              const header = String(cell.v).trim();
              headers.push(header);
              console.log(`Found header [${C}]:`, header);
            }
          }

          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          console.log('Estrutura do primeiro item:', JSON.stringify(jsonData[0], null, 2));

          setSelectedDistributor(distributorId);
          setExcelColumns(headers);
          setFileData(jsonData);
          setShowMapping(true);

        } catch (error) {
          console.error('Erro ao processar arquivo:', error);
          toast({
            title: "Erro ao processar arquivo",
            description: "Verifique se o arquivo está no formato correto",
            variant: "destructive",
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o arquivo selecionado",
        variant: "destructive",
      });
    }
  };

  const handleMappingComplete = async (mapping: Record<string, string>) => {
    try {
      console.log('Iniciando importação com mapeamento:', mapping);
      console.log('Amostra dos dados do arquivo:', fileData[0]);

      const transformedProducts = fileData.map((row: any, index: number) => {
        // Criar produto com valores mapeados
        let product = {
          name: '',
          itemCode: '',
          unitPrice: 0,
          distributorId: selectedDistributor!,
          // Campos com valores padrão
          supplierCode: '',
          barCode: '',
          description: '', // Departamento
          grupo: '', // Grupo de produtos
          boxQuantity: 1,
          unit: 'un',
          imageUrl: null,
          isSpecialOffer: false,
          boxPrice: null
        };

        // Mapear nome do produto
        if (mapping.name !== '_EMPTY') {
          product.name = String(row[mapping.name] || '').trim();
          console.log(`Nome do produto mapeado (${mapping.name}):`, product.name);
        }

        // Mapear código do item
        if (mapping.itemCode !== '_EMPTY') {
          product.itemCode = String(row[mapping.itemCode] || '').trim();
          console.log(`Código do item mapeado (${mapping.itemCode}):`, product.itemCode);
        }

        // Mapear código do fornecedor
        if (mapping.supplierCode !== '_EMPTY') {
          product.supplierCode = String(row[mapping.supplierCode] || '').trim();
          console.log(`Código do fornecedor mapeado (${mapping.supplierCode}):`, product.supplierCode);
        }

        // Mapear código de barras
        if (mapping.barCode !== '_EMPTY') {
          product.barCode = String(row[mapping.barCode] || '').trim();
          console.log(`Código de barras mapeado (${mapping.barCode}):`, product.barCode);
        }

        // Mapear subcategoria (categoria principal)
        if (mapping.subcategory !== '_EMPTY') {
          let subcategory = String(row[mapping.subcategory] || '').trim().toUpperCase();
          // Remover o prefixo "(N)" se existir
          subcategory = subcategory.replace(/^\(N\)\s*/, '');
          product.description = subcategory;

          if (!["FRIOS/LACTICNIOS/CONGELADOS", "MERCEARIA", "BEBIDAS", "LIMPEZA", "HORTIFRUTI"].includes(product.description)) {
            console.log(`Aviso: Subcategoria inválida "${product.description}", será necessário editar manualmente.`);
          }
          console.log(`Subcategoria mapeada (${mapping.subcategory}):`, product.description);
        }

        // Mapear grupo (subcategoria específica)
        if (mapping.grupo !== '_EMPTY') {
          // Pegar o grupo do Excel e remover o prefixo (N) se existir
          let grupo = String(row[mapping.grupo] || '').trim().toUpperCase();
          grupo = grupo.replace(/^\(N\)\s*/, '');
          product.grupo = grupo;
          console.log(`Grupo mapeado (${mapping.grupo}):`, product.grupo);
        }

        // Mapear preço
        if (mapping.unitPrice !== '_EMPTY') {
          const rawPrice = row[mapping.unitPrice];
          if (typeof rawPrice === 'number') {
            product.unitPrice = rawPrice;
          } else if (typeof rawPrice === 'string') {
            product.unitPrice = parseFloat(rawPrice.replace(',', '.')) || 0;
          }
          console.log(`Preço mapeado (${mapping.unitPrice}):`, product.unitPrice);
        }

        console.log(`Produto ${index + 1} processado:`, product);
        return product;
      });

      // Filtrar produtos válidos e verificar campos obrigatórios
      const validProducts = transformedProducts.filter((product, index) => {
        const isValid = product.name &&
          product.itemCode &&
          product.description && // Garantir que o departamento está preenchido
          product.grupo && // Garantir que o grupo está preenchido
          product.supplierCode &&
          product.barCode;

        if (!isValid) {
          console.log(`Produto ${index + 1} inválido:`, {
            produto: product,
            motivo: {
              semNome: !product.name,
              semCodigo: !product.itemCode,
              semDepartamento: !product.description,
              semGrupo: !product.grupo,
              semCodigoFornecedor: !product.supplierCode,
              semCodigoBarras: !product.barCode
            }
          });
        }
        return isValid;
      });

      console.log('Total de produtos válidos:', validProducts.length);

      if (validProducts.length === 0) {
        throw new Error('Nenhum produto válido encontrado. Verifique se todos os campos obrigatórios foram mapeados corretamente.');
      }

      // Importar em lotes
      const batchSize = 50;
      let processedCount = 0;

      for (let i = 0; i < validProducts.length; i += batchSize) {
        const batch = validProducts.slice(i, i + batchSize);
        console.log(`Enviando lote ${Math.floor(i / batchSize) + 1}:`, batch);

        const result = await importProductsMutation.mutateAsync(batch);
        processedCount += result.productsImported;

        toast({
          title: "Importando produtos",
          description: `Processados ${processedCount} de ${validProducts.length} produtos...`,
        });
      }

      // Atualizar a lista de produtos
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      toast({
        title: "Importação concluída",
        description: `${processedCount} produtos foram importados com sucesso!`,
      });

      setShowMapping(false);
      setFileData([]);
      setExcelColumns([]);

    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro ao importar produtos",
        variant: "destructive",
      });
    }
  };

  const getDistributorProducts = (distributorId: number) => {
    if (!products) return [];
    return products.filter(product => product.distributorId === distributorId);
  };

  // Função para paginar os produtos
  const getPaginatedProducts = (products: Product[]) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return products.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const [, setLocation] = useLocation();
  const search = useSearch();
  const isVendorView = new URLSearchParams(search).get('view') === 'vendor';

  const getShareableLink = (distributorId: number) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/distributors?view=vendor&distributor=${distributorId}`;
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Distributors</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Distribuidores</h1>
        {user?.role === 'supermarket' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Distribuidor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Distribuidor</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para cadastrar um novo distribuidor.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distributor Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    Create Distributor
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDistributors?.map((distributor) => (
          <Card key={distributor.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {distributor.name}
              </CardTitle>
              <CardDescription>Code: {distributor.code}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Contact: {distributor.contact}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {distributor.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {distributor.email}
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedDistributor(distributor.id);
                        setPage(1); // Reset página ao abrir novo distribuidor
                      }}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Ver Catálogo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <DialogTitle>Catálogo de Produtos - {distributor.name}</DialogTitle>
                          <DialogDescription>
                            Gerencie os produtos deste distribuidor e importe novos itens.
                          </DialogDescription>
                        </div>
                        {!isVendorView && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(getShareableLink(distributor.id));
                              toast({
                                title: "Link copiado",
                                description: "Link para visualização do vendedor foi copiado para a área de transferência.",
                              });
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartilhar com Vendedor
                          </Button>
                        )}
                      </div>
                    </DialogHeader>
                    <div className="flex justify-between items-center mb-4">
                      <div className="relative">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => handleFileUpload(e, distributor.id)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Importar Produtos (XLSX)
                        </Button>
                      </div>
                    </div>
                    {showMapping && (
                      <div>
                        {/* Column Mapping Component */}
                        <ColumnMapping
                          excelColumns={excelColumns}
                          onMappingComplete={handleMappingComplete}
                          isLoading={importProductsMutation.isPending}
                        />
                      </div>
                    )}
                    {!showMapping && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                        {loadingProducts ? (
                          // Loading skeleton
                          [...Array(4)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                              <CardContent className="p-4 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-4 bg-muted rounded w-1/2" />
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          getPaginatedProducts(getDistributorProducts(distributor.id)).map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              isVendorView={isVendorView}
                            />
                          ))
                        )}
                      </div>
                    )}
                    {/* Paginação */}
                    {getDistributorProducts(distributor.id).length > ITEMS_PER_PAGE && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => p + 1)}
                          disabled={page * ITEMS_PER_PAGE >= getDistributorProducts(distributor.id).length}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                {user?.role === 'supermarket' && (
                  <Dialog open={createUserOpen === distributor.id} onOpenChange={(open) => setCreateUserOpen(open ? distributor.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </Button>
                    </DialogTrigger>
                    {createUserOpen === distributor.id && (
                      <CreateUserDialog
                        distributorId={distributor.id}
                        onClose={() => setCreateUserOpen(null)}
                      />
                    )}
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}