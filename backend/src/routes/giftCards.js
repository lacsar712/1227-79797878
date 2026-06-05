const express = require('express');
const { body } = require('express-validator');
const { GiftCard, GiftCardUsage, Order } = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const router = express.Router();
router.use(auth);

const DENOMINATIONS = [100, 200, 500];

const generateCardNo = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString().slice(2, 10).toUpperCase();
  return `GC${timestamp}${random}`;
};

const generateExpireDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
};

router.get('/denominations', (req, res) => {
  res.json({ code: 0, data: DENOMINATIONS });
});

router.get('/my', async (req, res) => {
  try {
    const cards = await GiftCard.findAll({
      where: {
        user_id: req.user.id,
        status: { [Op.in]: ['bound', 'used'] }
      },
      order: [['createdAt', 'DESC']]
    });

    const totalBalance = cards.reduce((sum, card) => {
      return sum + (parseFloat(card.balance) || 0);
    }, 0);

    res.json({
      code: 0,
      data: {
        list: cards,
        total_balance: totalBalance.toFixed(2)
      }
    });
  } catch (err) {
    logger.error('Get my gift cards error:', err);
    res.status(500).json({ code: 500, message: '获取礼品卡失败' });
  }
});

router.get('/my/available', async (req, res) => {
  try {
    const cards = await GiftCard.findAll({
      where: {
        user_id: req.user.id,
        status: 'bound',
        balance: { [Op.gt]: 0 }
      },
      order: [['balance', 'DESC']]
    });

    const totalBalance = cards.reduce((sum, card) => {
      return sum + (parseFloat(card.balance) || 0);
    }, 0);

    res.json({
      code: 0,
      data: {
        list: cards,
        total_balance: totalBalance.toFixed(2)
      }
    });
  } catch (err) {
    logger.error('Get available gift cards error:', err);
    res.status(500).json({ code: 500, message: '获取可用礼品卡失败' });
  }
});

router.post(
  '/purchase',
  [
    body('amount')
      .isInt({ min: 1 })
      .withMessage('请选择面额')
      .custom((val) => DENOMINATIONS.includes(parseInt(val, 10)))
      .withMessage('面额不正确')
  ],
  validate,
  async (req, res) => {
    try {
      const amount = parseInt(req.body.amount, 10);

      const card = await GiftCard.create({
        card_no: generateCardNo(),
        amount,
        balance: amount,
        status: 'unused',
        expire_at: generateExpireDate()
      });

      res.json({
        code: 0,
        data: card,
        message: '购买成功'
      });
    } catch (err) {
      logger.error('Purchase gift card error:', err);
      res.status(500).json({ code: 500, message: '购买失败' });
    }
  }
);

router.post(
  '/bind',
  [
    body('card_no').notEmpty().withMessage('请输入卡号').isLength({ min: 10, max: 32 }).withMessage('卡号格式不正确')
  ],
  validate,
  async (req, res) => {
    try {
      const { card_no } = req.body;

      const card = await GiftCard.findOne({ where: { card_no: card_no.trim() } });
      if (!card) {
        return res.status(400).json({ code: 400, message: '礼品卡不存在' });
      }

      if (card.status === 'bound') {
        return res.status(400).json({ code: 400, message: '礼品卡已被绑定' });
      }

      if (card.status === 'used') {
        return res.status(400).json({ code: 400, message: '礼品卡已使用完毕' });
      }

      if (card.expire_at && new Date(card.expire_at) < new Date()) {
        return res.status(400).json({ code: 400, message: '礼品卡已过期' });
      }

      await card.update({
        user_id: req.user.id,
        status: 'bound',
        bound_at: new Date()
      });

      res.json({
        code: 0,
        data: card,
        message: '绑定成功'
      });
    } catch (err) {
      logger.error('Bind gift card error:', err);
      res.status(500).json({ code: 500, message: '绑定失败' });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const card = await GiftCard.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!card) {
      return res.status(404).json({ code: 404, message: '礼品卡不存在' });
    }

    const usages = await GiftCardUsage.findAll({
      where: { gift_card_id: card.id, user_id: req.user.id },
      include: [{ model: Order, attributes: ['order_no'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ code: 0, data: { card, usages } });
  } catch (err) {
    logger.error('Get gift card detail error:', err);
    res.status(500).json({ code: 500, message: '获取礼品卡详情失败' });
  }
});

module.exports = router;
