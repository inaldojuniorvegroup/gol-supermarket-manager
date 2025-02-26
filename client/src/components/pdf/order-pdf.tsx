import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Order, OrderItem, Store, Distributor } from "@shared/schema";

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #eee',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  table: {
    display: "flex",
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 35,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: '8 4',
  },
  productName: {
    width: '25%',
  },
  supplierCode: {
    width: '15%',
  },
  barCode: {
    width: '15%',
  },
  quantity: {
    width: '10%',
    textAlign: 'center',
  },
  unitPrice: {
    width: '15%',
    textAlign: 'right',
  },
  boxPrice: {
    width: '20%',
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 100,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
  },
  total: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metadata: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    color: '#666',
    borderTop: '1 solid #eee',
    paddingTop: 10,
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
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoice #{order.id}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{formatDate(new Date(order.createdAt))}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValue}>{order.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Store Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{store.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{store.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{store.city}, {store.state}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{store.phone}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Distributor Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{distributor.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contact:</Text>
            <Text style={styles.infoValue}>{distributor.contact}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{distributor.phone}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.productName]}>Product Name</Text>
              <Text style={[styles.tableCell, styles.supplierCode]}>Supplier Code</Text>
              <Text style={[styles.tableCell, styles.barCode]}>Bar Code</Text>
              <Text style={[styles.tableCell, styles.quantity]}>Qty</Text>
              <Text style={[styles.tableCell, styles.unitPrice]}>Unit Price</Text>
              <Text style={[styles.tableCell, styles.boxPrice]}>Box Price</Text>
            </View>

            {items.map((item) => {
              const boxPrice = Number(item.price) * (item.product?.boxQuantity || 1);
              return (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.productName]}>{item.product?.name || "Product not found"}</Text>
                  <Text style={[styles.tableCell, styles.supplierCode]}>{item.product?.supplierCode}</Text>
                  <Text style={[styles.tableCell, styles.barCode]}>{item.product?.barCode}</Text>
                  <Text style={[styles.tableCell, styles.quantity]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, styles.unitPrice]}>{formatCurrency(item.price)}</Text>
                  <Text style={[styles.tableCell, styles.boxPrice]}>{formatCurrency(boxPrice)}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.total}>
            Total Amount: {formatCurrency(order.total)}
          </Text>
        </View>

        <View style={styles.metadata}>
          <Text>Generated at: {new Date().toISOString()}</Text>
          <Text>Order ID: {order.id} | Store ID: {store.id} | Distributor ID: {distributor.id}</Text>
        </View>
      </Page>
    </Document>
  );
}