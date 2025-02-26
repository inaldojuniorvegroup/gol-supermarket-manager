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
    fontSize: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    marginBottom: 5,
  },
  table: {
    display: 'flex',
    width: '100%',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 24,
    fontSize: 12,
  },
  tableHeader: {
    backgroundColor: '#F4F4F4',
    fontWeight: 'bold',
  },
  tableCol: {
    flex: 1,
    padding: 5,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
});

interface OrderPDFProps {
  order: OrderWithDetails;
}

export const OrderPDF = ({ order }: OrderPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Pedido #{order.id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações da Loja</Text>
        <Text style={styles.info}>Nome: {order.store?.name}</Text>
        <Text style={styles.info}>Código: {order.store?.code}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações do Distribuidor</Text>
        <Text style={styles.info}>Nome: {order.distributor?.name}</Text>
        <Text style={styles.info}>Código: {order.distributor?.code}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Itens do Pedido</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableCol}>
              <Text>Produto</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>Código</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>Qtd</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>Preço</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>Total</Text>
            </View>
          </View>

          {order.items?.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text>{item.product?.name}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>{item.product?.supplierCode}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>${Number(item.price).toFixed(2)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>${Number(item.total).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.total}>
          Total: ${Number(order.total).toFixed(2)}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>
          Pedido gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
        </Text>
      </View>
    </Page>
  </Document>
);