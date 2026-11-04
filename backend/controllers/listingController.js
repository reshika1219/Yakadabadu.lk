import Listing, { LISTING_CATEGORIES, CONDITIONS } from '../models/Listing.js';
import Transaction from '../models/Transaction.js';
import Driver from '../models/Driver.js';
import { COMMISSION } from '../utils/pricing.js';
import { notify, notifyMany } from '../utils/notify.js';
import { HttpError, must } from '../utils/http.js';

const PUBLIC_FIELDS = '-offers -inspections -adminNote';

// Strip other buyers' offers from what the public (or a buyer) can see
const publicView = (l) => {
  const o = l.toObject();
  delete o.offers; delete o.inspections; delete o.adminNote;
  o.offerCount = l.offers.length;
  return o;
};

export const browse = async (req, res) => {
  const { q, category, condition, min, max, sort = 'newest' } = req.query;
  const filter = { status: 'approved' };
  if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }, { city: new RegExp(q, 'i') }];
  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (min || max) filter.price = { ...(min && { $gte: Number(min) }), ...(max && { $lte: Number(max) }) };
  const order = { newest: { createdAt: -1 }, 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, popular: { views: -1 } }[sort] || { createdAt: -1 };
  res.json((await Listing.find(filter).select(PUBLIC_FIELDS).sort(order).limit(100)).map((l) => ({ ...l.toObject(), offerCount: undefined })));
};

export const getListing = async (req, res) => {
  const listing = must(await Listing.findById(req.params.id), 404, 'Listing not found');
  const isOwner = req.user && listing.seller.toString() === req.user._id.toString();
  const isAdmin = req.role === 'admin';
  if (listing.status !== 'approved' && listing.status !== 'sold' && !isOwner && !isAdmin) throw new HttpError(404, 'Listing not found');
  if (!isOwner) { listing.views += 1; await listing.save(); }
  if (isOwner || isAdmin) return res.json(listing);
  const view = publicView(listing);
  view.myOffer = req.user ? listing.offers.filter((o) => o.buyer.toString() === req.user._id.toString()).pop() : undefined;
  res.json(view);
};

export const createListing = async (req, res) => {
  const { title, description, category, condition, price, city, image } = req.body;
  if (!title?.trim()) throw new HttpError(400, 'Give your item a title');
  if (!(Number(price) > 0)) throw new HttpError(400, 'Enter a price above 0');
  if (category && !LISTING_CATEGORIES.includes(category)) throw new HttpError(400, 'Unknown category');
  if (condition && !CONDITIONS.includes(condition)) throw new HttpError(400, 'Unknown condition');
  const listing = await Listing.create({
    seller: req.user._id, sellerName: req.user.name, title: title.trim(), description, category, condition,
    price: Number(price), city: city || req.user.address?.split(',').pop()?.trim(), image,
  });
  const admins = await Driver.find({ role: 'admin' }).select('_id');
  notifyMany(admins.map((a) => a._id), { type: 'market', title: 'New listing awaiting review', body: listing.title, link: '/admin/marketplace' });
  res.status(201).json(listing);
};

export const myListings = async (req, res) => {
  res.json(await Listing.find({ seller: req.user._id }).sort({ createdAt: -1 }));
};

export const myPurchases = async (req, res) => {
  const bought = await Listing.find({ buyer: req.user._id }).select(PUBLIC_FIELDS).sort({ soldAt: -1 });
  const offered = await Listing.find({ 'offers.buyer': req.user._id, buyer: { $ne: req.user._id } }).select('title price status image category offers seller sellerName');
  const offers = offered.map((l) => ({
    listing: { _id: l._id, title: l.title, price: l.price, status: l.status, image: l.image, category: l.category },
    ...l.offers.filter((o) => o.buyer.toString() === req.user._id.toString()).pop().toObject(),
  }));
  res.json({ bought, offers });
};

export const updateListing = async (req, res) => {
  const listing = must(await Listing.findById(req.params.id), 404, 'Listing not found');
  if (listing.seller.toString() !== req.user._id.toString()) throw new HttpError(403, 'This is not your listing');
  if (listing.status === 'sold') throw new HttpError(400, 'A sold listing cannot be edited');
  const { title, description, category, condition, price, image, status } = req.body;
  Object.assign(listing, { ...(title && { title }), ...(description != null && { description }), ...(category && { category }), ...(condition && { condition }), ...(image !== undefined && { image }) });
  if (price) listing.price = Number(price);
  if (status === 'withdrawn') listing.status = 'withdrawn';
  else if (listing.status === 'rejected') listing.status = 'pending'; // re-submit for review after edits
  await listing.save();
  res.json(listing);
};

export const removeListing = async (req, res) => {
  const listing = must(await Listing.findById(req.params.id), 404, 'Listing not found');
  if (req.role !== 'admin' && listing.seller.toString() !== req.user._id.toString()) throw new HttpError(403, 'This is not your listing');
  await listing.deleteOne();
  res.json({ message: 'Listing removed' });
};

const sell = async (listing, buyer, price) => {
  const commission = Math.round(price * COMMISSION);
  listing.status = 'sold';
  listing.buyer = buyer._id;
  listing.buyerName = buyer.name;
  listing.soldPrice = price;
  listing.soldAt = new Date();
  listing.offers.forEach((o) => { if (o.status === 'pending') o.status = o.buyer.toString() === buyer._id.toString() && o.amount === price ? 'accepted' : 'rejected'; });
  await listing.save();
  await Transaction.create({
    ref: `TX-${Date.now().toString(36).toUpperCase()}`, type: 'resale', amount: price, commission,
    from: { id: buyer._id, name: buyer.name }, to: { id: listing.seller, name: listing.sellerName },
    listing: listing._id, note: listing.title,
  });
  notify(listing.seller, { type: 'market', title: 'Your item sold', body: `${listing.title} sold for Rs. ${price.toLocaleString()} to ${buyer.name}.`, link: '/app/market' });
  notify(buyer._id, { type: 'market', title: 'Purchase confirmed', body: `${listing.title} is yours. The seller will contact you.`, link: '/app/market' });
};

export const buyNow = async (req, res) => {
  const listing = must(await Listing.findById(req.params.id), 404, 'Listing not found');
  if (listing.status !== 'approved') throw new HttpError(400, 'This item is no longer available');
  if (listing.seller.toString() === req.user._id.toString()) throw new HttpError(400, 'You cannot buy your own listing');
  await sell(listing, req.user, listing.price);
  res.json(listing.toObject());
};

export const makeOffer = async (req, res) => {
  const listing = must(await Listing.findById(req.params.id), 404, 'Listing not found');
  if (listing.status !== 'approved') throw new HttpError(400, 'This item is no longer available');
  if (listing.seller.toString() === req.user._id.toString()) throw new HttpError(400, 'You cannot make an offer on your own listing');
  const amount = Number(req.body.amount);
  if (!(amount > 0)) throw new HttpError(400, 'Enter an offer amount');
  listing.offers.push({ buyer: req.user._id, buyerName: req.user.name, amount, message: req.body.message });
  await listing.save();
  notify(listing.seller, { type: 'market', title: 'New offer received', body: `${req.user.name} offered Rs. ${amount.toLocaleString()} for ${listing.title}.`, link: '/app/market' });
  res.status(201).json({ message: 'Offer sent' });
};

export const decideOffer = async (req, res) => {
  const listing = must(await Listing.findById(req.params.id), 404, 'Listing not found');
  if (listing.seller.toString() !== req.user._id.toString()) throw new HttpError(403, 'This is not your listing');
  const offer = must(listing.offers.id(req.params.offerId), 404, 'Offer not found');
  if (offer.status !== 'pending' || listing.status !== 'approved') throw new HttpError(400, 'This offer is no longer open');
  if (req.body.action === 'accept') {
    const buyer = { _id: offer.buyer, name: offer.buyerName };
    await sell(listing, buyer, offer.amount);
  } else {
    offer.status = 'rejected';
    await listing.save();
    notify(offer.buyer, { type: 'market', title: 'Offer declined', body: `Your offer on ${listing.title} was declined.`, link: '/app/market' });
  }
  res.json(listing);
};

export const requestInspection = async (req, res) => {
  const listing = must(await Listing.findById(req.params.id), 404, 'Listing not found');
  const date = new Date(req.body.date);
  if (listing.status !== 'approved') throw new HttpError(400, 'This item is no longer available');
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Choose an inspection date');
  listing.inspections.push({ buyer: req.user._id, buyerName: req.user.name, date, note: req.body.note });
  await listing.save();
  notify(listing.seller, { type: 'market', title: 'Inspection requested', body: `${req.user.name} would like to inspect ${listing.title} on ${date.toDateString()}.`, link: '/app/market' });
  res.status(201).json({ message: 'Inspection requested' });
};

// Admin
export const adminList = async (_req, res) => {
  res.json(await Listing.find().sort({ createdAt: -1 }).limit(300));
};

export const moderate = async (req, res) => {
  const listing = must(await Listing.findById(req.params.id), 404, 'Listing not found');
  const { status, note } = req.body;
  if (!['approved', 'rejected'].includes(status)) throw new HttpError(400, 'Status must be approved or rejected');
  if (listing.status === 'sold') throw new HttpError(400, 'A sold listing cannot be moderated');
  listing.status = status;
  listing.adminNote = note;
  await listing.save();
  notify(listing.seller, {
    type: 'market',
    title: status === 'approved' ? 'Your listing is live' : 'Your listing needs changes',
    body: status === 'approved' ? listing.title : `${listing.title}: ${note || 'Rejected by moderator'}`,
    link: '/app/market',
  });
  res.json(listing);
};
