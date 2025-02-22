import { Order, Store, Distributor } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderListProps {
  orders: Order[];
  stores: Store[];
  distributors: Distributor[];
  onStatusChange: (orderId: number, status: string) => void;
}

export function OrderList({
  orders,
  stores,
  distributors,
  onStatusChange,
}: OrderListProps) {
  const { toast } = useToast();

  const getStoreName = (storeId: number) => {
    return stores.find((s) => s.id === storeId)?.name || "Unknown Store";
  };

  const getDistributorName = (distributorId: number) => {
    return distributors.find((d) => d.id === distributorId)?.name || "Unknown Distributor";
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await onStatusChange(orderId, newStatus);
      toast({
        title: "Order status updated",
        description: `Order #${orderId} is now ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Failed to update status",
        description: "An error occurred while updating the order status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Distributor</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{order.id}</TableCell>
              <TableCell>{getStoreName(order.storeId)}</TableCell>
              <TableCell>{getDistributorName(order.distributorId)}</TableCell>
              <TableCell>${order.total}</TableCell>
              <TableCell>
                <Select
                  defaultValue={order.status}
                  onValueChange={(value) => handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
