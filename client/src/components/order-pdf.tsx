import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { OrderWithDetails } from '@/pages/shared-order-page';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    marginBottom: 5,
  },
  orderInfo: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    backgroundColor: '#f4f4f4',
    padding: 5,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoBlock: {
    flex: 1,
    padding: 5,
  },
  label: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    alignItems: 'center',
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: '#f4f4f4',
    padding: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    marginBottom: 5,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10,
    padding: 5,
  },
  tableColCode: {
    width: '15%',
  },
  tableColProduct: {
    width: '40%',
  },
  tableColQty: {
    width: '15%',
    textAlign: 'center',
  },
  tableColPrice: {
    width: '15%',
    textAlign: 'right',
  },
  tableColTotal: {
    width: '15%',
    textAlign: 'right',
  },
  totals: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#000000',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    width: '85%',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    fontSize: 12,
    width: '15%',
    textAlign: 'right',
  },
  subtotalSection: {
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
    paddingTop: 5,
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: '#000000',
    paddingTop: 5,
    marginTop: 5,
  },
  grandTotalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
    color: '#666666',
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
    paddingTop: 10,
  },
});

interface OrderPDFProps {
  order: OrderWithDetails;
}

export const OrderPDF = ({ order }: OrderPDFProps) => {
  // Calcular subtotal e total
  const subtotal = order.items?.reduce((acc, item) => {
    return acc + (Number(item.total) || 0);
  }, 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gol Supermarket</Text>
          <Text style={styles.orderInfo}>Pedido #{order.id}</Text>
          <Text style={styles.orderInfo}>Data: {format(new Date(order.createdAt), "dd/MM/yyyy")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Pedido</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Loja</Text>
              <Text style={styles.value}>{order.store?.name}</Text>
              <Text style={styles.value}>{order.store?.code}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Distribuidor</Text>
              <Text style={styles.value}>{order.distributor?.name}</Text>
              <Text style={styles.value}>{order.distributor?.code}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={[styles.tableHeaderText, styles.tableColCode]}>Código</Text>
                <Text style={[styles.tableHeaderText, styles.tableColProduct]}>Produto</Text>
                <Text style={[styles.tableHeaderText, styles.tableColQty]}>Qtd</Text>
                <Text style={[styles.tableHeaderText, styles.tableColPrice]}>Preço Un.</Text>
                <Text style={[styles.tableHeaderText, styles.tableColTotal]}>Total</Text>
              </View>
            </View>

            {order.items?.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableColCode]}>{item.product?.supplierCode}</Text>
                <Text style={[styles.tableCell, styles.tableColProduct]}>{item.product?.name}</Text>
                <Text style={[styles.tableCell, styles.tableColQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.tableColPrice]}>
                  ${Number(item.price).toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, styles.tableColTotal]}>
                  ${Number(item.total).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totals}>
            <View style={[styles.totalRow, styles.subtotalSection]}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={[styles.totalLabel, styles.grandTotalText]}>Total do Pedido:</Text>
              <Text style={[styles.totalValue, styles.grandTotalText]}>
                ${Number(order.total || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            Pedido gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
          </Text>
          <Text>
            Status: {order.status.toUpperCase()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};