const express = require('express');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Store = require('../models/Store');
const Notification = require('../models/Notification');
const { authenticateToken, requireCustomer, requireManager } = require('../middleware/auth');

const router = express.Router();

// Create order (customer only)
router.post('/', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { storeId, items } = req.body;

    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Store ID and items array are required' 
      });
    }

    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store || !store.isActive) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Validate and prepare order items
    const orderItems = [];
    let totalAmount = 0;

    for (const orderItem of items) {
      const { itemId, quantity } = orderItem;

      if (!itemId || !quantity || quantity <= 0) {
        return res.status(400).json({ 
          error: 'Valid item ID and quantity are required for each item' 
        });
      }

      const item = await Item.findById(itemId);
      if (!item || !item.isActive || item.store.toString() !== storeId) {
        return res.status(404).json({ 
          error: `Item ${itemId} not found in this store` 
        });
      }

      if (item.quantity < quantity) {
        return res.status(400).json({ 
          error: `Insufficient inventory for ${item.name}. Available: ${item.quantity}` 
        });
      }

      orderItems.push({
        item: itemId,
        quantity,
        price: item.price
      });

      totalAmount += item.price * quantity;
    }

    // Create order
    const order = new Order({
      customer: req.user._id,
      store: storeId,
      items: orderItems,
      totalAmount
    });

    await order.save();

    // Update inventory (atomic operations)
    for (const orderItem of items) {
      const item = await Item.findById(orderItem.itemId);
      await item.decrementQuantity(orderItem.quantity);
    }

    // Create notification for store manager
    const notification = new Notification({
      type: 'order_placed',
      title: 'New Order Received',
      message: `Order #${order._id} has been placed with total amount $${totalAmount.toFixed(2)}`,
      store: storeId,
      order: order._id,
      recipient: store.manager
    });

    await notification.save();

    await order.populate([
      { path: 'customer', select: 'name email' },
      { path: 'store', select: 'name address' },
      { path: 'items.item', select: 'name price sku' }
    ]);

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get orders based on user role
router.get('/', authenticateToken, async (req, res) => {
  try {
    let orders;
    
    if (req.user.role === 'manager') {
      // Managers only see orders from their stores
      const Store = require('../models/Store');
      const managerStores = await Store.find({ 
        manager: req.user._id,
        isActive: true 
      });
      const storeIds = managerStores.map(store => store._id);
      
      orders = await Order.find({ store: { $in: storeIds } })
        .populate([
          { path: 'customer', select: 'name email' },
          { path: 'store', select: 'name address' },
          { path: 'items.item', select: 'name price sku' }
        ])
        .sort({ createdAt: -1 });
    } else {
      // Customers see their own orders
      orders = await Order.find({ customer: req.user._id })
        .populate([
          { path: 'store', select: 'name address' },
          { path: 'items.item', select: 'name price sku' }
        ])
        .sort({ createdAt: -1 });
    }

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get manager's orders (manager only)
router.get('/manager/my-orders', authenticateToken, requireManager, async (req, res) => {
  try {
    // Get manager's stores
    const managerStores = await Store.find({ 
      manager: req.user._id,
      isActive: true 
    });
    const storeIds = managerStores.map(store => store._id);
    
    // Get orders from manager's stores
    const orders = await Order.find({ store: { $in: storeIds } })
      .populate([
        { path: 'customer', select: 'name email' },
        { path: 'store', select: 'name address' },
        { path: 'items.item', select: 'name price sku' }
      ])
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('Get manager orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Public endpoint for ML service to get orders (no authentication required)
router.get('/ml/public', async (req, res) => {
  try {
    const { storeId, since } = req.query;
    
    let query = {};
    
    // Filter by store if provided
    if (storeId) {
      query.store = storeId;
    }
    
    // Filter by date if provided
    if (since) {
      query.createdAt = { $gte: new Date(since) };
    }
    
    const orders = await Order.find(query)
      .populate([
        { path: 'customer', select: 'name email' },
        { path: 'store', select: 'name address' },
        { path: 'items.item', select: 'name price sku' }
      ])
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('Get public orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID (customer only, their own orders)
router.get('/:orderId', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate([
        { path: 'customer', select: 'name email' },
        { path: 'store', select: 'name address' },
        { path: 'items.item', select: 'name price sku description' }
      ]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns this order
    if (order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only view your own orders' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Cancel order (manager only, for their stores)
router.put('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('store');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is manager and owns the store
    if (req.user.role !== 'manager' || order.store.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only cancel orders for your own stores' });
    }

    // Only allow cancellation if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed orders can be cancelled' });
    }

    order.status = 'cancelled';
    await order.save();

    // Create notification for customer
    const notification = new Notification({
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Your order #${order._id} has been cancelled`,
      store: order.store._id,
      order: order._id,
      recipient: order.customer
    });

    await notification.save();

    await order.populate([
      { path: 'customer', select: 'name email' },
      { path: 'store', select: 'name address' },
      { path: 'items.item', select: 'name price sku' }
    ]);

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get store orders (manager only, their stores)
router.get('/store/:storeId', authenticateToken, async (req, res) => {
  try {
    const { storeId } = req.params;

    // Check if user is manager and owns the store
    const store = await Store.findById(storeId);
    if (!store || !store.isActive) {
      return res.status(404).json({ error: 'Store not found' });
    }

    if (req.user.role !== 'manager' || store.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only view orders for your own stores' });
    }

    const orders = await Order.find({ store: storeId })
      .populate([
        { path: 'customer', select: 'name email' },
        { path: 'items.item', select: 'name price sku' }
      ])
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('Get store orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router; 