import Rate from '../models/Rate.js';
import { ensureRates, estimateAmount, MATERIALS, COMMISSION, RECYCLER_MARGIN } from '../utils/pricing.js';
import { HttpError, must } from '../utils/http.js';

const shape = (r) => {
  const prev = r.history.length > 1 ? r.history[r.history.length - 2].price : r.pricePerKg;
  return {
    material: r.material, label: r.label, pricePerKg: r.pricePerKg,
    change: r.pricePerKg - prev,
    history: r.history.slice(-8),
    updatedAt: r.updatedAt,
  };
};

export const listRates = async (_req, res) => {
  await ensureRates();
  const rates = await Rate.find().sort({ pricePerKg: -1 });
  res.json({ rates: rates.map(shape), config: { commission: COMMISSION, recyclerMargin: RECYCLER_MARGIN } });
};

export const updateRate = async (req, res) => {
  const price = Number(req.body.pricePerKg);
  if (!(price >= 0)) throw new HttpError(400, 'Enter a valid price');
  const rate = must(await Rate.findOne({ material: req.params.material }), 404, 'Unknown material');
  if (price !== rate.pricePerKg) {
    rate.pricePerKg = price;
    rate.history.push({ price });
    await rate.save();
  }
  res.json(shape(rate));
};

// Public price estimator
export const estimate = async (req, res) => {
  const { material, weight } = req.body;
  if (!MATERIALS[material]) throw new HttpError(400, 'Unknown material');
  const kg = Number(weight);
  if (!(kg > 0)) throw new HttpError(400, 'Enter a weight above 0');
  const rates = Object.fromEntries((await Rate.find()).map((r) => [r.material, r.pricePerKg]));
  res.json({ material, weight: kg, pricePerKg: rates[material], amount: estimateAmount(rates, material, kg) });
};
