import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { OrderWithDetails } from '@/pages/shared-order-page';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    width: 100,
    height: 100,
    objectFit: 'contain',
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
  tableCellHighlight: {
    backgroundColor: '#fee2e2',
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
  productCodes: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  itemReceivingInfo: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  receivingInfo: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f8f8f8',
  },
  receivingNotes: {
    fontSize: 10,
    color: '#666666',
    marginTop: 5,
  },
  missingAmount: {
    color: '#dc2626',
    fontSize: 10,
  },
  receivedAmount: {
    color: '#16a34a',
    fontSize: 10,
  }
});

interface OrderPDFProps {
  order: OrderWithDetails;
  isVendorView?: boolean;
}

export const OrderPDF = ({ order, isVendorView = false }: OrderPDFProps) => {
  const originalSubtotal = order.items?.reduce((acc, item) => {
    return acc + (Number(item.total) || 0);
  }, 0) || 0;

  const receivedSubtotal = order.items?.reduce((acc, item) => {
    if (!item.receivedQuantity) return acc + (Number(item.total) || 0);

    const receivedQty = Number(item.receivedQuantity);
    const price = Number(item.price);
    return acc + (receivedQty * price);
  }, 0) || 0;

  const missingAmount = originalSubtotal - receivedSubtotal;

  const statusLabels = {
    'pending': 'Pendente',
    'received': 'Recebido',
    'partial': 'Recebido Parcialmente',
    'missing': 'Faltante'
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              src={`${window.location.origin}/attached_assets/LOGO.png`}
              style={styles.logo}
            />
          </View>
          <View>
            <Text style={styles.orderInfo}>Pedido #{order.id}</Text>
            <Text style={styles.orderInfo}>Data: {format(new Date(order.createdAt), "dd/MM/yyyy")}</Text>
            {order.receivedAt && (
              <Text style={styles.orderInfo}>
                Recebido em: {format(new Date(order.receivedAt), "dd/MM/yyyy 'às' HH:mm")}
                {order.receivedBy ? ` por ${order.receivedBy}` : ''}
              </Text>
            )}
          </View>
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

          {order.receivingNotes && (
            <View style={styles.receivingInfo}>
              <Text style={styles.label}>Status do Recebimento</Text>
              <Text style={styles.value}>
                {statusLabels[order.status as keyof typeof statusLabels] || order.status}
              </Text>
              <Text style={styles.receivingNotes}>{order.receivingNotes}</Text>
            </View>
          )}
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

            {order.items?.map((item) => {
              const isPartialOrMissing = item.receivedQuantity && 
                Number(item.receivedQuantity) < Number(item.quantity);

              return (
                <View key={item.id} style={[
                  styles.tableRow,
                  isPartialOrMissing && styles.tableCellHighlight
                ]}>
                  <View style={[styles.tableCell, styles.tableColCode]}>
                    <Text>{item.product?.supplierCode}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.tableColProduct]}>
                    <Text>{item.product?.name}</Text>
                    {!isVendorView && (
                      <Text style={styles.productCodes}>
                        Código Interno: {item.product?.itemCode} | EAN: {item.product?.barCode}
                      </Text>
                    )}
                    {item.receivedQuantity && (
                      <Text style={styles.itemReceivingInfo}>
                        Pedido: {item.quantity} | Recebido: {item.receivedQuantity}
                        {item.missingQuantity && Number(item.missingQuantity) > 0 ? 
                          ` | Faltante: ${item.missingQuantity}` : ''}
                        {item.receivingNotes ? `\nObs: ${item.receivingNotes}` : ''}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.tableCell, styles.tableColQty]}>
                    <Text>{item.quantity}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.tableColPrice]}>
                    <Text>${Number(item.price).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.tableColTotal]}>
                    <Text>${Number(item.total).toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.totals}>
            <View style={[styles.totalRow, styles.subtotalSection]}>
              <Text style={styles.totalLabel}>Subtotal Original:</Text>
              <Text style={styles.totalValue}>${originalSubtotal.toFixed(2)}</Text>
            </View>

            {order.receivedAt && (
              <>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, styles.receivedAmount]}>
                    Valor Recebido: ${receivedSubtotal.toFixed(2)}
                  </Text>
                </View>
                {missingAmount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, styles.missingAmount]}>
                      Valor Faltante: -${missingAmount.toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={[styles.totalLabel, styles.grandTotalText]}>
                {order.receivedAt ? 'Total Final:' : 'Total do Pedido:'}
              </Text>
              <Text style={[styles.totalValue, styles.grandTotalText]}>
                ${(order.receivedAt ? receivedSubtotal : originalSubtotal).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            {order.receivedAt ? 
              `Recebimento registrado em ${format(new Date(order.receivedAt), "dd/MM/yyyy 'às' HH:mm")}` :
              `Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`}
          </Text>
          <Text>
            Status: {statusLabels[order.status as keyof typeof statusLabels] || order.status}
          </Text>
        </View>
      </Page>
    </Document>
  );
};