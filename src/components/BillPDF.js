import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #16a34a',
    paddingBottom: 20,
  },
  bizName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  bizInfo: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  customerBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
  },
  customerName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  customerInfo: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 3,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: '8 12',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '10 12',
    borderBottom: '1px solid #f3f4f6',
  },
  colService: { flex: 3, fontSize: 11 },
  colQty:     { flex: 1, fontSize: 11, textAlign: 'center' },
  colPrice:   { flex: 1, fontSize: 11, textAlign: 'right'  },
  headerText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
  },
  rowText: {
    fontSize: 11,
    color: '#374151',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: '12 16',
    borderRadius: 6,
    marginTop: 16,
    border: '1px solid #bbf7d0',
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  footer: {
    marginTop: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
  },
  thankYou: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
    textAlign: 'center',
    marginTop: 30,
  },
  date: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 9,
    color: '#059669',
    backgroundColor: '#d1fae5',
    padding: '2 6',
    borderRadius: 4,
  },
})

export default function BillPDF({ config, customer, services, billNumber }) {
  const total = services.reduce((sum, s) => sum + s.price, 0)
  const date  = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.bizName}>{config?.businessName}</Text>
          <Text style={styles.bizInfo}>{config?.ownerName} · {config?.phone}</Text>
          <Text style={styles.bizInfo}>{config?.type?.toUpperCase()} BUSINESS</Text>
          <Text style={styles.invoiceTitle}>INVOICE #{billNumber || '001'}</Text>
          <Text style={styles.date}>Date: {date}</Text>
        </View>

        {/* Customer info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.customerBox}>
            <Text style={styles.customerName}>{customer?.name}</Text>
            <Text style={styles.customerInfo}>Phone: {customer?.phone}</Text>
            {customer?.address && (
              <Text style={styles.customerInfo}>Address: {customer?.address}</Text>
            )}
          </View>
        </View>

        {/* Services table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.table}>

            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.colService, styles.headerText]}>SERVICE</Text>
              <Text style={[styles.colQty,     styles.headerText]}>QTY</Text>
              <Text style={[styles.colPrice,   styles.headerText]}>AMOUNT</Text>
            </View>

            {/* Table rows */}
            {services.map((s, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.colService, styles.rowText]}>
                  {s.type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={[styles.colQty, styles.rowText]}>{s.quantity}</Text>
                <Text style={[styles.colPrice, styles.rowText]}>₹{s.price}</Text>
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{total}</Text>
          </View>
        </View>

        {/* Thank you */}
        <Text style={styles.thankYou}>Thank you for your business! 🙏</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by BizFlow</Text>
          <Text style={styles.footerText}>{config?.businessName} · {date}</Text>
        </View>

      </Page>
    </Document>
  )
}