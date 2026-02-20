// ============================================================
// Order Service — Order Routes
// ============================================================

const express = require('express');
const { body, query } = require('express-validator');
const orderController = require('../controllers/order.controller');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Create order
router.post(
  '/orders',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').notEmpty(),
    body('items.*.productName').notEmpty(),
    body('items.*.sku').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('shippingAddress.street').notEmpty(),
    body('shippingAddress.city').notEmpty(),
    body('shippingAddress.state').notEmpty(),
    body('shippingAddress.zipCode').notEmpty(),
    body('shippingAddress.country').notEmpty(),
    validate,
  ],
  orderController.createOrder
);

// List orders
router.get(
  '/orders',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn([
      'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
    ]),
    validate,
  ],
  orderController.listOrders
);

// Get order by ID
router.get('/orders/:id', orderController.getOrder);

// Get order by order number
router.get('/orders/number/:orderNumber', orderController.getOrderByNumber);

// Update order status
router.patch(
  '/orders/:id/status',
  [
    body('status').isIn([
      'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
    ]).withMessage('Invalid status'),
    body('note').optional().isString(),
    validate,
  ],
  orderController.updateOrderStatus
);

// Get user orders
router.get('/users/:userId/orders', orderController.getUserOrders);

// Order analytics
router.get('/analytics/summary', orderController.getOrderAnalytics);

module.exports = router;
