import Transaction from '../models/Transaction.js';
import Pickup from '../models/Pickup.js';
import { MATERIALS } from '../utils/pricing.js';

const monthKey = (d) => d.toISOString().slice(0, 7);

export const summary = async (_req, res) => {
  const txs = await Transaction.find().sort({ date: 1 });
  const totals = { payouts: 0, recyclerValue: 0, marketGmv: 0, commission: 0 };
  const months = {};
  const bump = (d) => (months[monthKey(d)] ||= { month: monthKey(d), payouts: 0, commission: 0, recyclerValue: 0 });

  for (const t of txs) {
    const m = bump(t.date);
    if (t.type === 'pickup-payout') { totals.payouts += t.amount; totals.recyclerValue += t.recyclerValue; m.payouts += t.amount; m.recyclerValue += t.recyclerValue; }
    else { totals.marketGmv += t.amount; totals.commission += t.commission; m.commission += t.commission; }
  }
  totals.margin = totals.recyclerValue + totals.commission - totals.payouts;

  const byMaterial = {};
  for (const t of txs.filter((x) => x.type === 'pickup-payout')) byMaterial[t.material] = (byMaterial[t.material] || 0) + t.amount;

  res.json({
    totals,
    months: Object.values(months).slice(-6),
    byMaterial: Object.entries(byMaterial).map(([material, amount]) => ({ material, label: MATERIALS[material]?.label || material, amount })),
    note: 'Recycler value and margin are estimates based on current rates.',
  });
};

export const transactions = async (req, res) => {
  const filter = req.query.type ? { type: req.query.type } : {};
  res.json(await Transaction.find(filter).sort({ date: -1 }).limit(500));
};

// A customer's own earnings and spending
export const myFinance = async (req, res) => {
  const id = req.user._id;
  const txs = await Transaction.find({ $or: [{ 'to.id': id }, { 'from.id': id }] }).sort({ date: -1 }).limit(200);
  let earned = 0, spent = 0;
  const items = txs.map((t) => {
    const incoming = t.to?.id?.toString() === id.toString();
    const value = incoming ? (t.type === 'resale' ? t.amount - t.commission : t.amount) : t.amount;
    if (incoming) earned += value; else spent += value;
    return { _id: t._id, ref: t.ref, date: t.date, type: t.type, note: t.note, direction: incoming ? 'in' : 'out', amount: value };
  });
  res.json({ earned, spent, transactions: items });
};
