import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Order, OrderItem, Store, Distributor } from "@shared/schema";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "#000",
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderColor: "#000",
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  tableCol: {
    borderStyle: "solid",
    borderColor: "#000",
    borderRightWidth: 1,
  },
  tableCell: {
    margin: "auto",
    padding: 5,
    fontSize: 10,
  },
  headerCell: {
    margin: "auto",
    marginTop: 5,
    marginBottom: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  productName: { 
    width: "40%",
    textAlign: "left",
  },
  supplierCode: { 
    width: "15%",
    textAlign: "center",
  },
  barCode: { 
    width: "20%",
    textAlign: "center",
  },
  quantity: { 
    width: "5%",
    textAlign: "center",
  },
  unitPrice: { 
    width: "10%",
    textAlign: "right",
  },
  total: { 
    width: "10%",
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#000",
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    paddingTop: 5,
  },
  totalLabel: {
    width: 80,
    textAlign: "right",
    paddingRight: 10,
  },
  totalValue: {
    width: 80,
    textAlign: "right",
  },
});

interface OrderPDFProps {
  order: Order;
  items: OrderItem[];
  store: Store;
  distributor: Distributor;
}

export default function OrderPDF({ order, items }: OrderPDFProps) {
  const formatCurrency = (value: string | number) => `$${Number(value).toFixed(2)}`;

  const subtotal = items.reduce((acc, item) => acc + Number(item.total), 0);
  const tax = 0;
  const total = Number(order.total);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Order Details</Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, styles.productName]}>
              <Text style={styles.headerCell}>Product Name</Text>
            </View>
            <View style={[styles.tableColHeader, styles.supplierCode]}>
              <Text style={styles.headerCell}>Supplier Code</Text>
            </View>
            <View style={[styles.tableColHeader, styles.barCode]}>
              <Text style={styles.headerCell}>Bar Code</Text>
            </View>
            <View style={[styles.tableColHeader, styles.quantity]}>
              <Text style={styles.headerCell}>Qty</Text>
            </View>
            <View style={[styles.tableColHeader, styles.unitPrice]}>
              <Text style={styles.headerCell}>Unit Price</Text>
            </View>
            <View style={[styles.tableColHeader, styles.total]}>
              <Text style={styles.headerCell}>Total</Text>
            </View>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.productName]}>
                <Text style={[styles.tableCell, { marginLeft: 5, textAlign: 'left' }]}>
                  {item.product?.name}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.supplierCode]}>
                <Text style={styles.tableCell}>{item.product?.supplierCode}</Text>
              </View>
              <View style={[styles.tableCol, styles.barCode]}>
                <Text style={styles.tableCell}>{item.product?.barCode}</Text>
              </View>
              <View style={[styles.tableCol, styles.quantity]}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCol, styles.unitPrice]}>
                <Text style={[styles.tableCell, { marginRight: 5 }]}>
                  {formatCurrency(item.price)}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.total]}>
                <Text style={[styles.tableCell, { marginRight: 5 }]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Total:</Text>
            <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>{formatCurrency(total)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}