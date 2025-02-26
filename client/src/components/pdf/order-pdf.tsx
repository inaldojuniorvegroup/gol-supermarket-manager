import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Order, OrderItem, Store, Distributor } from "@shared/schema";

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    padding: 40,
    fontSize: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#112233',
    paddingBottom: 20,
    marginBottom: 30,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 200,
    textAlign: 'right',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#112233',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    color: '#112233',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    fontSize: 10,
  },
  orderInfo: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 4,
    marginBottom: 4,
  },
  section: {
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#112233',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoRow: {
    width: '45%',
    marginBottom: 8,
  },
  label: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontWeight: 'bold',
    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  col1: { width: '25%' },
  col2: { width: '15%' },
  col3: { width: '15%' },
  col4: { width: '15%', textAlign: 'center' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    width: 100,
    textAlign: 'right',
    paddingRight: 10,
    color: '#64748b',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
  },
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
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calcula subtotal e total
  const subtotal = items.reduce((acc, item) => acc + Number(item.total), 0);
  const tax = subtotal * 0.0; // Por enquanto sem imposto
  const total = Number(order.total);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>GOL SUPERMARKET</Text>
            <Text style={styles.subtitle}>Order Management System</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>INVOICE</Text>
            <View style={styles.orderInfo}>
              <Text>#{order.id}</Text>
              <Text style={styles.subtitle}>{formatDate(order.createdAt)}</Text>
              <Text style={styles.subtitle}>Status: {order.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Informações do Cliente e Distribuidor */}
        <View style={styles.section}>
          <View style={styles.infoGrid}>
            <View style={{ width: '48%' }}>
              <Text style={styles.sectionTitle}>Store Information</Text>
              <View>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{store.name}</Text>
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Address</Text>
                <Text style={styles.value}>{store.address}</Text>
                <Text style={styles.value}>{store.city}, {store.state}</Text>
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{store.phone}</Text>
              </View>
            </View>
            <View style={{ width: '48%' }}>
              <Text style={styles.sectionTitle}>Distributor Information</Text>
              <View>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{distributor.name}</Text>
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Contact</Text>
                <Text style={styles.value}>{distributor.contact}</Text>
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{distributor.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabela de Produtos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Product Name</Text>
              <Text style={styles.col2}>Supplier Code</Text>
              <Text style={styles.col3}>Bar Code</Text>
              <Text style={styles.col4}>Quantity</Text>
              <Text style={styles.col5}>Unit Price</Text>
              <Text style={styles.col6}>Total</Text>
            </View>
            {items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.col1}>{item.product?.name || "Product not found"}</Text>
                <Text style={styles.col2}>{item.product?.supplierCode}</Text>
                <Text style={styles.col3}>{item.product?.barCode}</Text>
                <Text style={styles.col4}>{item.quantity}</Text>
                <Text style={styles.col5}>{formatCurrency(item.price)}</Text>
                <Text style={styles.col6}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>

          {/* Totais */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#112233', fontWeight: 'bold' }]}>Total:</Text>
              <Text style={[styles.totalValue, { color: '#112233' }]}>{formatCurrency(total)}</Text>
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