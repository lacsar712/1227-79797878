const express = require('express');
const { body, param } = require('express-validator');
const { Coupon, CouponClaim } = require('../models');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { Op, Transaction } = require('sequelize');
const sequelize = require('../config/database');

const router = express.Router();

const generateCouponCode = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString().slice(2, 8).toUpperCase();
  return `CP${timestamp}${random}`;
};

const calculateExpireAt = (coupon, claimTime) => {
  if (coupon.valid_days) {
    const expire = new Date(claimTime);
    expire.setDate(expire.getDate() + coupon.valid_days);
    return expire;
  }
  return coupon.end_at;
};

const checkAndUpdateExpiredCoupons = async () => {
  const now = new Date();
  await Coupon.update(
    { status: 'expired' },
    {
      where: {
        status: 'active',
        end_at: { [Op.lt]: now }
      }
    }
  );
  await CouponClaim.update(
    { status: 'expired' },
    {
      where: {
        status: 'unused',
        expire_at: { [Op.lt]: now }
      }
    }
  );
};

router.get('/public', optionalAuth, async (req, res) => {
  try {
    await checkAndUpdateExpiredCoupons();

    const now = new Date();
    const coupons = await Coupon.findAll({
      where: {
        is_public: true,
        status: 'active',
        start_at: { [Op.lte]: now },
        end_at: { [Op.gt]: now }
      },
      order: [['createdAt', 'DESC']]
    });

    let claimedIds = [];
    if (req.user) {
      const claims = await CouponClaim.findAll({
        where: { user_id: req.user.id },
        attributes: ['coupon_id']
      });
      claimedIds = claims.map((c) => c.coupon_id);
    }

    const data = coupons.map((coupon) => {
      const remaining = coupon.total_quantity - coupon.claimed_quantity;
      return {
        ...coupon.toJSON(),
        remaining_quantity: Math.max(0, remaining),
        is_claimed: claimedIds.includes(coupon.id),
        is_sold_out: remaining <= 0
      };
    });

    res.json({ code: 0, data });
  } catch (err) {
    logger.error('Get public coupons error:', err);
    res.status(500).json({ code: 500, message: '获取优惠券列表失败' });
  }
});

router.post(
  '/:id/claim',
  auth,
  [param('id').isInt().withMessage('优惠券ID无效')],
  validate,
  async (req, res) => {
    const t = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ
    });

    try {
      await checkAndUpdateExpiredCoupons();

      const couponId = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const now = new Date();

      const coupon = await Coupon.findByPk(couponId, { transaction: t });
      if (!coupon) {
        await t.rollback();
        return res.status(404).json({ code: 404, message: '优惠券不存在' });
      }

      if (!coupon.is_public) {
        await t.rollback();
        return res.status(400).json({ code: 400, message: '该优惠券不可公开领取' });
      }

      if (coupon.status !== 'active') {
        await t.rollback();
        return res.status(400).json({ code: 400, message: '优惠券已失效' });
      }

      if (coupon.start_at > now) {
        await t.rollback();
        return res.status(400).json({ code: 400, message: '优惠券尚未开始领取' });
      }

      if (coupon.end_at <= now) {
        await t.rollback();
        return res.status(400).json({ code: 400, message: '优惠券已过期' });
      }

      const existingClaim = await CouponClaim.findOne({
        where: { coupon_id: couponId, user_id: userId },
        transaction: t
      });
      if (existingClaim) {
        await t.rollback();
        return res.status(400).json({ code: 400, message: '您已领取过该优惠券' });
      }

      const userClaimCount = await CouponClaim.count({
        where: { coupon_id: couponId, user_id: userId },
        transaction: t
      });
      if (userClaimCount >= coupon.per_user_limit) {
        await t.rollback();
        return res.status(400).json({ code: 400, message: '您已达到领取上限' });
      }

      const remaining = coupon.total_quantity - coupon.claimed_quantity;
      if (remaining <= 0) {
        await t.rollback();
        return res.status(400).json({ code: 400, message: '优惠券已领完' });
      }

      await coupon.increment('claimed_quantity', { by: 1, transaction: t });

      let code;
      let attempts = 0;
      while (attempts < 5) {
        code = generateCouponCode();
        const existing = await CouponClaim.findOne({ where: { code }, transaction: t });
        if (!existing) break;
        attempts++;
      }

      const claim = await CouponClaim.create(
        {
          coupon_id: couponId,
          user_id: userId,
          code,
          status: 'unused',
          expire_at: calculateExpireAt(coupon, now)
        },
        { transaction: t }
      );

      await t.commit();

      res.json({
        code: 0,
        data: { ...claim.toJSON(), coupon },
        message: '领取成功'
      });
    } catch (err) {
      await t.rollback();
      logger.error('Claim coupon error:', err);
      res.status(500).json({ code: 500, message: '领取失败' });
    }
  }
);

router.get('/my', auth, async (req, res) => {
  try {
    await checkAndUpdateExpiredCoupons();

    const { status } = req.query;
    const where = { user_id: req.user.id };
    if (status && ['unused', 'used', 'expired'].includes(status)) {
      where.status = status;
    }

    const claims = await CouponClaim.findAll({
      where,
      include: [{ model: Coupon, attributes: ['name', 'description', 'type', 'amount', 'min_amount'] }],
      order: [['createdAt', 'DESC']]
    });

    const stats = await CouponClaim.count({
      where: { user_id: req.user.id },
      group: ['status']
    });

    const statusCounts = { unused: 0, used: 0, expired: 0 };
    stats.forEach((s) => {
      statusCounts[s.status] = s.count;
    });

    res.json({
      code: 0,
      data: {
        list: claims,
        stats: statusCounts
      }
    });
  } catch (err) {
    logger.error('Get my coupons error:', err);
    res.status(500).json({ code: 500, message: '获取我的优惠券失败' });
  }
});

router.get('/my/available', auth, async (req, res) => {
  try {
    await checkAndUpdateExpiredCoupons();

    const now = new Date();
    const claims = await CouponClaim.findAll({
      where: {
        user_id: req.user.id,
        status: 'unused',
        expire_at: { [Op.gt]: now }
      },
      include: [{ model: Coupon, attributes: ['name', 'description', 'type', 'amount', 'min_amount'] }],
      order: [['expire_at', 'ASC']]
    });

    res.json({ code: 0, data: claims });
  } catch (err) {
    logger.error('Get available coupons error:', err);
    res.status(500).json({ code: 500, message: '获取可用优惠券失败' });
  }
});

module.exports = { router, checkAndUpdateExpiredCoupons };
