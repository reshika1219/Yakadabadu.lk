import Rate from '../models/Rate.js';

export const MATERIALS = {
  metal: { label: 'Metal', base: 120 },
  plastic: { label: 'Plastic', base: 55 },
  paper: { label: 'Paper & cardboard', base: 30 },
  glass: { label: 'Glass', base: 12 },
  ewaste: { label: 'E-waste', base: 160 },
  wood: { label: 'Wood', base: 18 },
};

// Rough weights behind the size options on the booking form
export const SCALE_KG = { small: 3, medium: 7.5, large: 15, 'extra-large': 25 };

// Platform economics (shown in finance reports as estimates)
export const COMMISSION = 0.1; // taken on marketplace sales
export const RECYCLER_MARGIN = 0.25; // uplift when scrap is sold on to recyclers

export const ensureRates = async () => {
  if (await Rate.countDocuments()) return;
  await Rate.insertMany(
    Object.entries(MATERIALS).map(([material, { label, base }]) => ({
      material, label, pricePerKg: base, history: [{ price: base }],
    }))
  );
};

export const getRateMap = async () => {
  await ensureRates();
  const rates = await Rate.find();
  return Object.fromEntries(rates.map((r) => [r.material, r.pricePerKg]));
};

export const estimateAmount = (rateMap, material, kg) =>
  Math.round((rateMap[material] ?? MATERIALS[material]?.base ?? 0) * (kg || 0));
