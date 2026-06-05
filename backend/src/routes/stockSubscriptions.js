const express = require('express');
const { Op } = require('sequelize');
const { StockSubscription, Product, User, Notification } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

async function sendStockArrivalNotification(product, userId) {
  try {
    await Notification.create({
      user_id: userId,
      type: 'stock_arrival',
      title: '商品到货通知',
      content: `您关注的商品「${product.name}」已到货，点击查看详情并立即购买吧！`,
      related_type: 'product',
      related_id: product.id,
      extra: {
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        product_price: product.price
      }
    });
  } catch (err) {
    logger.error('Send stock arrival notification error:', err);
  }
}

async function handleStockRestored(productId, newStock) {
  if (newStock <= 0) return;

  const t = await require('../config/database').transaction();
  try {
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return;
    }

    const subscriptions = await StockSubscription.findAll({
      where: {
        product_id: productId,
        status: 'active'
      },
      transaction: t
    });

    for (const sub of subscriptions) {
      await sendStockArrivalNotification(product, sub.user_id);
    }

    await StockSubscription.update(
      {
        status: 'notified',
        notified_at: new Date()
      },
      {
        where: {
          product_id: productId,
          status: 'active'
        },
        transaction: t
      }
    );

    await t.commit();
    logger.info(`Stock restored for product ${productId}, notified ${subscriptions.length} users`);
  } catch (err) {
    await t.rollback();
    logger.error('Handle stock restored error:', err);
  }
}

router.post('/:productId/subscribe', auth, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const product = await Product.findByPk(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }

    if (product.stock > 0) {
      return res.status(400).json({ code: 400, message: '商品库存充足，无需订阅' });
    }

    const existingSub = await StockSubscription.findOne({
      where: {
        user_id: userId,
        product_id: productId,
        status: 'active'
      }
    });

    if (existingSub) {
      return res.json({
        code: 0,
        message: '已订阅到货通知',
        data: { subscribed: true, subscription: existingSub }
      });
    }

    const subscription = await StockSubscription.create({
      user_id: userId,
      product_id: productId,
      status: 'active'
    });

    res.json({
      code: 0,
      message: '订阅成功，商品到货后将通知您',
      data: { subscribed: true, subscription }
    });
  } catch (err) {
    logger.error('Subscribe stock notification error:', err);
    res.status(500).json({ code: 500, message: '订阅失败' });
  }
});

router.delete('/:productId/subscribe', auth, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const result = await StockSubscription.update(
      { status: 'cancelled' },
      {
        where: {
          user_id: userId,
          product_id: productId,
          status: 'active'
        }
      }
    );

    if (result[0] === 0) {
      return res.status(404).json({ code: 404, message: '未找到订阅记录' });
    }

    res.json({
      code: 0,
      message: '已取消订阅',
      data: { subscribed: false }
    });
  } catch (err) {
    logger.error('Unsubscribe stock notification error:', err);
    res.status(500).json({ code: 500, message: '取消订阅失败' });
  }
});

router.get('/:productId/status', auth, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const subscription = await StockSubscription.findOne({
      where: {
        user_id: userId,
        product_id: productId,
        status: 'active'
      }
    });

    res.json({
      code: 0,
      data: {
        subscribed: !!subscription,
        subscription
      }
    });
  } catch (err) {
    logger.error('Get subscription status error:', err);
    res.status(500).json({ code: 500, message: '获取订阅状态失败' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const { count, rows } = await StockSubscription.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'image', 'stock', 'status']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (err) {
    logger.error('Get my subscriptions error:', err);
    res.status(500).json({ code: 500, message: '获取订阅列表失败' });
  }
});

module.exports = { router, handleStockRestored };
