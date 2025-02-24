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
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    flex: 1,
    padding: 5,
  },
  total: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

interface OrderPDFProps {
  order: Order;
  items: OrderItem[];
  store: Store;
  distributor: Distributor;
}

export default function OrderPDF({ order, items, store, distributor }: OrderPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Pedido #{order.id}</Text>
          <Text>Data: {new Date(order.createdAt).toLocaleDateString()}</Text>
          <Text>Status: {order.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Informações da Loja
          </Text>
          <Text>{store.name}</Text>
          <Text>{store.address}</Text>
          <Text>{store.city}, {store.state}</Text>
          <Text>Telefone: {store.phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Informações do Distribuidor
          </Text>
          <Text>{distributor.name}</Text>
          <Text>Contato: {distributor.contact}</Text>
          <Text>Telefone: {distributor.phone}</Text>
          <Text>Email: {distributor.email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Produto</Text>
              <Text style={styles.tableCell}>Quantidade</Text>
              <Text style={styles.tableCell}>Preço</Text>
              <Text style={styles.tableCell}>Total</Text>
            </View>

            {items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.product?.name || "Produto não encontrado"}</Text>
                <Text style={styles.tableCell}>{item.quantity}</Text>
                <Text style={styles.tableCell}>${Number(item.price).toFixed(2)}</Text>
                <Text style={styles.tableCell}>${Number(item.total).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.total}>
            Total: ${Number(order.total).toFixed(2)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}