import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Order, OrderItem, Store, Distributor } from "@shared/schema";

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 10,
    color: '#334155',
  },
  // Cabeçalho
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1e293b',
    paddingBottom: 20,
  },
  headerLogo: {
    flex: 1,
  },
  headerInfo: {
    width: '40%',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 4,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  companyDetail: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  invoiceDetail: {
    fontSize: 10,
    marginBottom: 4,
  },
  // Grid de informações
  infoGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  infoColumn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 15,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
  },
  // Tabela de produtos
  productTable: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: -1,
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: -1,
  },
  tableCell: {
    padding: 12,
    fontSize: 10,
  },
  productName: { width: '25%', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  supplierCode: { width: '15%', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  barCode: { width: '20%', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  quantity: { width: '10%', borderRightWidth: 1, borderRightColor: '#e2e8f0', textAlign: 'center' },
  unitPrice: { width: '15%', borderRightWidth: 1, borderRightColor: '#e2e8f0', textAlign: 'right' },
  total: { width: '15%', textAlign: 'right' },
  tableColCode: { width: '15%', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  tableColProduct: { width: '30%' },
  tableColQty: { width: '10%', borderRightWidth: 1, borderRightColor: '#e2e8f0', textAlign: 'center' },
  tableColPrice: { width: '15%', borderRightWidth: 1, borderRightColor: '#e2e8f0', textAlign: 'right' },
  tableColTotal: { width: '15%', textAlign: 'right' },
  productCodes: { fontSize: 8 },

  // Seção de totais
  totalSection: {
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  totalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 20,
  },
  totalValue: {
    width: '30%',
    textAlign: 'right',
  },
  grandTotal: {
    backgroundColor: '#f8fafc',
    padding: 12,
    marginTop: 4,
    borderRadius: 4,
  },
  // Rodapé
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
    fontSize: 8,
    color: '#64748b',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

interface OrderPDFProps {
  order: Order;
  items: OrderItem[];
  store: Store;
  distributor: Distributor;
}

export default function OrderPDF({ order, items, store, distributor }: OrderPDFProps) {
  const formatCurrency = (value: string | number) => `$${Number(value).toFixed(2)}`;
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Cálculos
  const subtotal = items.reduce((acc, item) => acc + Number(item.total), 0);
  const tax = 0;
  const total = Number(order.total);
  const isVendorView = false; // Assuming this is needed from context -  add proper way to get this value if needed

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <Text style={styles.companyName}>GOL SUPERMARKET</Text>
            <Text style={styles.companyDetail}>Order Management System</Text>
            <Text style={styles.companyDetail}>Excellence in Retail</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.invoiceTitle}>INVOICE #{order.id}</Text>
            <Text style={styles.invoiceDetail}>Date: {formatDate(order.createdAt)}</Text>
            <Text style={styles.invoiceDetail}>Status: {order.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Grid de informações */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoTitle}>Store Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{store.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{store.address}</Text>
              <Text style={styles.infoValue}>{store.city}, {store.state}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{store.phone}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoTitle}>Distributor Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{distributor.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>{distributor.contact}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{distributor.phone}</Text>
            </View>
          </View>
        </View>

        {/* Tabela de produtos */}
        <View style={styles.productTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableColCode]}>Supplier Code</Text>
            <Text style={[styles.tableCell, styles.tableColProduct]}>Product Name</Text>
            <Text style={[styles.tableCell, styles.tableColQty]}>Qty</Text>
            <Text style={[styles.tableCell, styles.tableColPrice]}>Unit Price</Text>
            <Text style={[styles.tableCell, styles.tableColTotal]}>Total</Text>
          </View>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableColCode]}>{item.product?.supplierCode}</Text>
              <View style={[styles.tableCell, styles.tableColProduct]}>
                <Text>{item.product?.name}</Text>
                {!isVendorView && (
                  <Text style={styles.productCodes}>
                    Código Interno: {item.product?.itemCode} | EAN: {item.product?.barCode}
                  </Text>
                )}
                {item.product?.boxQuantity && item.product?.boxPrice && (
                  <Text style={styles.productCodes}>
                    Caixa: {item.product.boxQuantity} un. | {formatCurrency(item.product.boxPrice)}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.tableColQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.tableColPrice]}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={[styles.tableCell, styles.tableColTotal]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Seção de totais */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <View style={[styles.totalRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Total</Text>
              <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text>Generated on {new Date().toLocaleString()}</Text>
          <Text>Order ID: {order.id} • Store ID: {store.id} • Distributor ID: {distributor.id}</Text>
        </View>
      </Page>
    </Document>
  );
}