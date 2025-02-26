import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown } from "lucide-react";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OrderPDF } from '@/components/order-pdf';
import type { OrderWithDetails } from '@/pages/shared-order-page';

interface OrderPDFDownloadProps {
  order: OrderWithDetails;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function OrderPDFDownload({ order, size = "default", variant = "outline" }: OrderPDFDownloadProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <FileDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <PDFDownloadLink
          document={<OrderPDF order={order} isVendorView={false} />}
          fileName={`pedido-${order.id}-interno.pdf`}
        >
          {({ loading }) => (
            <DropdownMenuItem disabled={loading}>
              PDF para uso interno
            </DropdownMenuItem>
          )}
        </PDFDownloadLink>
        <PDFDownloadLink
          document={<OrderPDF order={order} isVendorView={true} />}
          fileName={`pedido-${order.id}-fornecedor.pdf`}
        >
          {({ loading }) => (
            <DropdownMenuItem disabled={loading}>
              PDF para fornecedor
            </DropdownMenuItem>
          )}
        </PDFDownloadLink>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
