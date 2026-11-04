import express from 'express';
import * as c from '../controllers/listingController.js';
import { protect, adminOnly, customerOnly } from '../middleware/authMiddleware.js';
import { wrap } from '../utils/http.js';
import jwtOptional from '../middleware/optionalAuth.js';

const router = express.Router();

router.get('/', wrap(c.browse));
router.get('/mine', protect, customerOnly, wrap(c.myListings));
router.get('/purchases', protect, customerOnly, wrap(c.myPurchases));
router.get('/admin/all', protect, adminOnly, wrap(c.adminList));
router.post('/', protect, customerOnly, wrap(c.createListing));

router.get('/:id', jwtOptional, wrap(c.getListing));
router.put('/:id', protect, customerOnly, wrap(c.updateListing));
router.delete('/:id', protect, wrap(c.removeListing));
router.post('/:id/buy', protect, customerOnly, wrap(c.buyNow));
router.post('/:id/offers', protect, customerOnly, wrap(c.makeOffer));
router.put('/:id/offers/:offerId', protect, customerOnly, wrap(c.decideOffer));
router.post('/:id/inspections', protect, customerOnly, wrap(c.requestInspection));
router.put('/:id/moderate', protect, adminOnly, wrap(c.moderate));

export default router;
