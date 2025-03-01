import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Package, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();
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
      if (!order.items?.length) return;

      // Primeiro atualizar o status do pedido
      const orderResponse = await apiRequest("PATCH", `/api/orders/${order.id}`, {
        status: "receiving",
        receivedBy: user?.username,
        receivedAt: new Date().toISOString(),
        receivingNotes: notes
      });

      if (!orderResponse.ok) {
        throw new Error("Falha ao atualizar o status do pedido");
      }

      // Depois atualizar cada item
      const itemPromises = Object.entries(receivedItems).map(([itemId, data]) => {
        const item = order.items?.find(i => i.id === Number(itemId));
        if (!item) return Promise.resolve();

        const receivedQty = Number(data.receivedQuantity) || 0;
        const missingQty = Number(data.missingQuantity) || 0;
        const orderedQty = Number(item.quantity);

        let status = 'pending';
        if (receivedQty === orderedQty) {
          status = 'received';
        } else if (receivedQty === 0) {
          status = 'missing';
        } else if (receivedQty < orderedQty) {
          status = 'partial';
        }

        return apiRequest("PATCH", `/api/order-items/${itemId}`, {
          receivedQuantity: receivedQty.toFixed(2),
          missingQuantity: missingQty.toFixed(2),
          receivingStatus: status,
          receivingNotes: data.notes
        });
      });

      await Promise.all(itemPromises);

      // Atualizar o status final do pedido baseado nos itens
      const finalStatus = order.items.every(item => 
        receivedItems[item.id]?.receivedQuantity === item.quantity
      ) ? 'received' : 'partially_received';

      await apiRequest("PATCH", `/api/orders/${order.id}`, {
        status: finalStatus
      });
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
    setReceivedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const getItemStatus = (item: NonNullable<OrderWithDetails['items']>[number], receivedData: typeof receivedItems[number]) => {
    if (!receivedData) return 'pending';

    const received = Number(receivedData.receivedQuantity) || 0;
    const ordered = Number(item.quantity);

    if (received === ordered) return 'received';
    if (received === 0) return 'missing';
    if (received < ordered) return 'partial';
    return 'pending';
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
              {order.items?.map(item => {
                const receivedData = receivedItems[item.id];
                const status = getItemStatus(item, receivedData);

                return (
                  <div key={item.id} className="bg-muted/30 p-4 rounded-lg space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{item.product?.name}</h4>
                        <div className="text-sm text-muted-foreground">
                          Quantidade pedida: {item.quantity}
                        </div>
                      </div>
                      <Badge variant={statusBadgeVariant[status]}>
                        {statusLabel[status]}
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
                          value={receivedData?.receivedQuantity}
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
                          value={receivedData?.missingQuantity}
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
                        value={receivedData?.notes}
                        onChange={(e) => handleQuantityChange(item.id, 'notes', e.target.value)}
                        placeholder="Registre aqui qualquer observação sobre o recebimento deste item..."
                        className="resize-none"
                      />
                    </div>
                  </div>
                );
              })}
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