const express = require('express');
const { body } = require('express-validator');
const {
  Order,
  OrderItem,
  Address,
  User
} = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { getLevelProgress } = require('../config/memberLevels');
const OrderService = require('../services/OrderService');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Address, attributes: ['receiver', 'phone', 'province', 'city', 'district', 'detail'] },
        { model: OrderItem, as: 'OrderItems' }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      code: 0,
      data: { list: rows, total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (err) {
    logger.error('Get orders error:', err);
    res.status(500).json({ code: 500, message: '获取订单失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Address },
        { model: OrderItem, as: 'OrderItems' }
      ]
    });
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    res.json({ code: 0, data: order });
  } catch (err) {
    logger.error('Get order detail error:', err);
    res.status(500).json({ code: 500, message: '获取订单详情失败' });
  }
});

router.post(
  '/create',
  [
    body('address_id').isInt().withMessage('请选择收货地址'),
    body('payment_method').isIn(['alipay', 'wechat', 'bank']).withMessage('请选择支付方式'),
    body('remark').optional().trim(),
    body('use_gift_card').optional().isBoolean(),
    body('gift_card_id').optional().isInt()
  ],
  validate,
  async (req, res) => {
    try {
      const created = await OrderService.createOrder(req.user.id, req.body);
      res.json({ code: 0, data: created, message: '订单创建成功' });
    } catch (err) {
      logger.error('Create order error:', err);
      const message = err.message || '创建订单失败';
      if (message.includes('无效') || message.includes('为空') || message.includes('库存不足')) {
        return res.status(400).json({ code: 400, message });
      }
      res.status(500).json({ code: 500, message: '创建订单失败' });
    }
  }
);

router.post('/:id/pay', async (req, res) => {
  try {
    const order = await OrderService.payOrder(req.params.id, req.user.id);
    res.json({ code: 0, data: order, message: '支付成功' });
  } catch (err) {
    logger.error('Pay order error:', err);
    const message = err.message || '支付失败';
    if (message === '订单不存在') {
      return res.status(404).json({ code: 404, message });
    }
    if (message === '订单已支付') {
      return res.status(400).json({ code: 400, message });
    }
    res.status(500).json({ code: 500, message: '支付失败' });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    await OrderService.cancelOrder(req.params.id, req.user.id);
    res.json({ code: 0, message: '订单已取消' });
  } catch (err) {
    logger.error('Cancel order error:', err);
    const message = err.message || '取消失败';
    if (message === '订单不存在') {
      return res.status(404).json({ code: 404, message });
    }
    if (message === '订单无法取消') {
      return res.status(400).json({ code: 400, message });
    }
    res.status(500).json({ code: 500, message: '取消失败' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    if (order.status !== 'shipped') {
      return res.status(400).json({ code: 400, message: '订单无法确认收货' });
    }
    const oldStatus = order.status;
    await order.update({ status: 'completed' });

    if (oldStatus !== 'completed') {
      const user = await User.findByPk(req.user.id);
      if (user) {
        const amount = parseFloat(order.total_amount) - parseFloat(order.gift_card_deduction || 0);
        const newTotalSpent = (parseFloat(user.total_spent || 0) + amount).toFixed(2);
        await user.update({ total_spent: newTotalSpent });

        const memberInfo = getLevelProgress(parseFloat(newTotalSpent));
        res.json({
          code: 0,
          data: {
            order,
            member_updated: true,
            new_member_level: memberInfo.currentLevel,
            member_progress: memberInfo
          },
          message: '订单已完成，会员成长值已更新'
        });
        return;
      }
    }

    res.json({ code: 0, data: order, message: '订单已完成' });
  } catch (err) {
    logger.error('Complete order error:', err);
    res.status(500).json({ code: 500, message: '确认收货失败' });
  }
});

module.exports = router;
