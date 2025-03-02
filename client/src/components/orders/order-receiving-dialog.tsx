import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Package, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { OrderWithDetails } from "@/pages/shared-order-page";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderReceivingDialogProps {
  order: OrderWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderReceivingDialog({ order, open, onOpenChange }: OrderReceivingDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [receivedItems, setReceivedItems] = useState<Record<number, { 
    receivedQuantity: string;
    missingQuantity: string;
    notes: string;
  }>>(
    order.items?.reduce((acc, item) => ({
      ...acc,
      [item.id]: {
        receivedQuantity: item.receivedQuantity || "0",
        missingQuantity: item.missingQuantity || "0",
        notes: item.receivingNotes || ""
      }
    }), {}) || {}
  );

  const updateOrderReceivingMutation = useMutation({
    mutationFn: async () => {
      try {
        // Primeiro, atualize o status do pedido para 'receiving'
        await apiRequest("PATCH", `/api/orders/${order.id}`, {
          status: "receiving",
          receivedBy: user?.username,
          receivedAt: new Date().toISOString(),
          receivingNotes: notes
        });

        // Depois atualize cada item individualmente
        for (const [itemId, data] of Object.entries(receivedItems)) {
          const receivedQty = parseFloat(data.receivedQuantity) || 0;
          const missingQty = parseFloat(data.missingQuantity) || 0;

          await apiRequest("PATCH", `/api/order-items/${itemId}`, {
            receivedQuantity: receivedQty.toString(),
            missingQuantity: missingQty.toString(),
            receivingNotes: data.notes,
            receivingStatus: getItemStatus(itemId, receivedQty)
          });
        }

        // Por fim, atualize o status final do pedido
        const finalStatus = calculateFinalStatus();
        await apiRequest("PATCH", `/api/orders/${order.id}`, {
          status: finalStatus
        });

      } catch (error) {
        throw new Error("Falha ao atualizar o recebimento");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/share/${order.id}`] });
      toast({
        title: "Recebimento registrado",
        description: "O recebimento do pedido foi registrado com sucesso."
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar recebimento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleQuantityChange = (
    itemId: number, 
    field: 'receivedQuantity' | 'missingQuantity' | 'notes',
    value: string
  ) => {
    let finalValue = value;

    // Validar e formatar números
    if (field === 'receivedQuantity' || field === 'missingQuantity') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        finalValue = "0";
      }
    }

    setReceivedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: finalValue
      }
    }));
  };

  const getItemStatus = (itemId: string, receivedQty: number) => {
    const item = order.items?.find(i => i.id === Number(itemId));
    if (!item) return 'pending';

    const orderedQty = parseFloat(item.quantity);

    if (receivedQty === orderedQty) return 'received';
    if (receivedQty === 0) return 'missing';
    if (receivedQty < orderedQty) return 'partial';
    return 'pending';
  };

  const calculateFinalStatus = () => {
    if (!order.items) return 'pending';

    const allReceived = order.items.every(item => {
      const receivedQty = parseFloat(receivedItems[item.id]?.receivedQuantity) || 0;
      const orderedQty = parseFloat(item.quantity);
      return receivedQty === orderedQty;
    });

    return allReceived ? 'received' : 'partially_received';
  };

  const statusBadgeVariant = {
    pending: 'default',
    received: 'success',
    partial: 'warning',
    missing: 'destructive'
  } as const;

  const statusLabel = {
    pending: 'Pendente',
    received: 'Recebido',
    partial: 'Parcial',
    missing: 'Faltante'
  } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recebimento do Pedido #{order.id}
          </DialogTitle>
          <DialogDescription>
            Registre o recebimento dos itens do pedido, marcando as quantidades recebidas e faltantes
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[60vh]">
            <div className="space-y-6 p-1">
              {order.items?.map(item => (
                <div key={item.id} className="bg-muted/30 p-4 rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{item.product?.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        Quantidade pedida: {item.quantity}
                      </div>
                    </div>
                    <Badge variant={statusBadgeVariant[getItemStatus(item.id.toString(), Number(receivedItems[item.id]?.receivedQuantity || 0))]}>
                        {statusLabel[getItemStatus(item.id.toString(), Number(receivedItems[item.id]?.receivedQuantity || 0))]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Quantidade Recebida
                      </label>
                      <Input
                        type="number"
                        value={receivedItems[item.id]?.receivedQuantity}
                        onChange={(e) => handleQuantityChange(item.id, 'receivedQuantity', e.target.value)}
                        min="0"
                        max={item.quantity}
                        step="any"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Quantidade Faltante
                      </label>
                      <Input
                        type="number"
                        value={receivedItems[item.id]?.missingQuantity}
                        onChange={(e) => handleQuantityChange(item.id, 'missingQuantity', e.target.value)}
                        min="0"
                        step="any"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Observações do Item
                    </label>
                    <Textarea
                      value={receivedItems[item.id]?.notes}
                      onChange={(e) => handleQuantityChange(item.id, 'notes', e.target.value)}
                      placeholder="Registre aqui qualquer observação sobre o recebimento deste item..."
                      className="resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Observações Gerais do Recebimento
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Registre aqui observações gerais sobre o recebimento do pedido..."
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => updateOrderReceivingMutation.mutate()}
              disabled={updateOrderReceivingMutation.isPending}
            >
              {updateOrderReceivingMutation.isPending ? "Salvando..." : "Registrar Recebimento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}