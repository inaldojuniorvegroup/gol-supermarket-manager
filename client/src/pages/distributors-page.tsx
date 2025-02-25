import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Phone, Mail, Plus, Truck, User, Package, Upload, UserPlus } from "lucide-react";
import * as XLSX from 'xlsx';
import { ColumnMapping } from "@/components/products/column-mapping";

interface CreateUserDialogProps {
  distributorId: number;
  onClose: () => void;
}

function CreateUserDialog({ distributorId, onClose }: CreateUserDialogProps) {
  const { toast } = useToast();
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "distributor",
      distributorId
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/register/distributor", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "Distributor user has been created successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Distributor User</DialogTitle>
        <DialogDescription>
          Create a user account for this distributor to manage their products and orders.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => createUserMutation.mutate(data))}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="username" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} autoComplete="new-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
            Create User
          </Button>
        </form>
      </Form>
    </DialogContent>
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
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Extrair os nomes das colunas do arquivo Excel
        const excelColumns = Object.keys(jsonData[0] || {});
        setExcelColumns(excelColumns);
        setShowMapping(true);
        setFileData(jsonData);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast({
          title: "Erro ao processar arquivo",
          description: error instanceof Error ? error.message : "Erro ao importar produtos",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };


  const handleMappingComplete = async (mapping: Record<string, string>, distributorId: number) => {
    try {
      const batchSize = 100;
      const batches = [];

      for (let i = 0; i < fileData.length; i += batchSize) {
        const batch = fileData.slice(i, i + batchSize).map((rawProduct: any) => {
          const mappedProduct = {
            name: rawProduct[mapping.name]?.toString() || "",
            itemCode: rawProduct[mapping.itemCode]?.toString() || "",
            supplierCode: rawProduct[mapping.supplierCode]?.toString() || "",
            barCode: rawProduct[mapping.barCode]?.toString() || "",
            description: rawProduct[mapping.description]?.toString() || "",
            unitPrice: parseFloat(rawProduct[mapping.unitPrice]?.toString().replace(",", ".") || "0"),
            boxQuantity: parseFloat(rawProduct[mapping.boxQuantity]?.toString() || "1"),
            unit: rawProduct[mapping.unit] || "un",
            distributorId: distributorId,
            imageUrl: "",
            isSpecialOffer: false
          };

          // Se não tiver nome ou código, pula este produto
          if (!mappedProduct.name || !mappedProduct.itemCode) {
            return null;
          }

          return mappedProduct;
        }).filter(Boolean);

        if (batch.length > 0) {
          batches.push(batch);
        }
      }

      let processedCount = 0;
      for (const batch of batches) {
        await importProductsMutation.mutateAsync(batch);
        processedCount += batch.length;

        toast({
          title: "Importando produtos",
          description: `Processados ${processedCount} de ${fileData.length} produtos...`,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      toast({
        title: "Importação concluída",
        description: `${processedCount} produtos foram importados com sucesso!`,
      });

      setShowMapping(false);
      setFileData([]);
      setExcelColumns([]);
    } catch (error) {
      console.error("Erro ao importar produtos:", error);
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
                      <DialogTitle>Catálogo de Produtos - {distributor.name}</DialogTitle>
                      <DialogDescription>
                        Gerencie os produtos deste distribuidor e importe novos itens.
                      </DialogDescription>
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
                          Import Products (XLSX)
                        </Button>
                      </div>
                    </div>
                    {showMapping && (
                      <ColumnMapping
                        excelColumns={excelColumns}
                        onMappingComplete={(mapping) => handleMappingComplete(mapping, distributor.id)}
                        isLoading={importProductsMutation.isPending}
                      />
                    )}
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
                          <Card key={product.id}>
                            <CardHeader>
                              <CardTitle className="text-lg">{product.name}</CardTitle>
                              <CardDescription>Code: {product.itemCode}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="text-sm text-muted-foreground">
                                {product.description}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-semibold">Unit Price:</span> ${product.unitPrice}
                                </div>
                                {product.boxPrice && (
                                  <div>
                                    <span className="font-semibold">Box Price:</span> ${product.boxPrice}
                                  </div>
                                )}
                                <div>
                                  <span className="font-semibold">Box Quantity:</span> {product.boxQuantity}
                                </div>
                                <div>
                                  <span className="font-semibold">Unit:</span> {product.unit}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
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