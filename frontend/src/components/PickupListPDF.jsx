import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const SLOT = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
const LABEL = { metal: 'Metal', plastic: 'Plastic', paper: 'Paper', glass: 'Glass', ewaste: 'E-waste', wood: 'Wood' };
const COLS = [['#', 0.4], ['When', 1.3], ['Customer', 1.6], ['Address', 2.6], ['Material', 1], ['Est. kg', 0.7], ['Notes', 2]];

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 9.5, color: '#0e1a12' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f2e1c' },
  sub: { color: '#5f6b62', marginTop: 3, marginBottom: 16 },
  row: { flexDirection: 'row', borderBottom: '1px solid #dcd7c9' },
  head: { backgroundColor: '#0f2e1c', color: '#ffffff', fontWeight: 'bold' },
  cell: { padding: 6 },
  foot: { position: 'absolute', bottom: 18, left: 28, right: 28, textAlign: 'center', color: '#5f6b62', fontSize: 8 },
});

// A printable trip sheet: stops in route order with contact details and notes
const PickupListPDF = ({ pickups }) => {
  const sorted = [...pickups].sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
  return (
    <Document title="Trip sheet">
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>Yakadabadu.lk trip sheet</Text>
        <Text style={s.sub}>{sorted.length} stop{sorted.length === 1 ? '' : 's'} · printed {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        <View style={[s.row, s.head]}>{COLS.map(([h, f]) => <Text key={h} style={[s.cell, { flex: f }]}>{h}</Text>)}</View>
        {sorted.map((p, i) => (
          <View style={s.row} key={p._id} wrap={false}>
            <Text style={[s.cell, { flex: COLS[0][1] }]}>{i + 1}</Text>
            <Text style={[s.cell, { flex: COLS[1][1] }]}>{new Date(p.scheduledTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, {SLOT[p.timeSlot]}</Text>
            <Text style={[s.cell, { flex: COLS[2][1] }]}>{p.user?.name || p.customerName}{'\n'}{p.contactNumber || p.user?.phone}</Text>
            <Text style={[s.cell, { flex: COLS[3][1] }]}>{p.address}</Text>
            <Text style={[s.cell, { flex: COLS[4][1] }]}>{LABEL[p.pickupType] || p.pickupType}</Text>
            <Text style={[s.cell, { flex: COLS[5][1] }]}>{p.estimatedWeight ?? '—'}</Text>
            <Text style={[s.cell, { flex: COLS[6][1] }]}>{p.instructions || '—'}</Text>
          </View>
        ))}
        <Text style={s.foot} fixed>Weigh every load in front of the customer and record the actual weight in the app.</Text>
      </Page>
    </Document>
  );
};

export default PickupListPDF;
