// ============================================================
// Order Service — Order Controller
// ============================================================

const Order = require('../models/order.model');
const { publishEvent } = require('../config/rabbitmq');
const logger = require('../utils/logger');

// ── Create Order ──────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { userId, items, shippingAddress, billingAddress, paymentMethod, notes } = req.body;

    // Calculate totals
    const processedItems = items.map((item) => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const subtotal = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
    const shippingCost = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const totalAmount = subtotal + taxAmount + shippingCost;

    const order = new Order({
      userId,
      items: processedItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      subtotal,
      taxAmount,
      shippingCost,
      totalAmount,
      notes,
      statusHistory: [{ status: 'pending', note: 'Order created' }],
    });

    await order.save();

    // Publish event
    await publishEvent('order.created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      totalAmount: order.totalAmount,
      items: order.items,
    });

    logger.info(`Order created: ${order.orderNumber}`);

    res.status(201).json({
      message: 'Order created successfully',
      order: order.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ── List Orders ───────────────────────────────────────────
exports.listOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Order ─────────────────────────────────────────────
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// ── Get Order by Number ───────────────────────────────────
exports.getOrderByNumber = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// ── Update Order Status ──────────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Cannot transition from '${order.status}' to '${status}'`,
      });
    }

    order.status = status;
    order.statusHistory.push({ status, note: note || `Status changed to ${status}` });

    if (status === 'cancelled' || status === 'refunded') {
      order.paymentStatus = status === 'refunded' ? 'refunded' : order.paymentStatus;
    }

    await order.save();

    await publishEvent('order.updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status,
    });

    logger.info(`Order ${order.orderNumber} status updated to ${status}`);

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    next(err);
  }
};

// ── Get User Orders ──────────────────────────────────────
exports.getUserOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments({ userId: req.params.userId }),
    ]);

    res.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── Order Analytics ──────────────────────────────────────
exports.getOrderAnalytics = async (req, res, next) => {
  try {
    const [totalOrders, statusBreakdown, revenueData] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
            totalItems: { $sum: { $size: '$items' } },
          },
        },
      ]),
    ]);

    res.json({
      analytics: {
        totalOrders,
        statusBreakdown: statusBreakdown.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        revenue: revenueData[0] || { totalRevenue: 0, avgOrderValue: 0, totalItems: 0 },
      },
    });
  } catch (err) {
    next(err);
  }
};
