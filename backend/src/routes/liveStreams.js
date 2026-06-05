const express = require('express');
const { Op } = require('sequelize');
const { LiveStream, LiveStreamProduct, Product } = require('../models');
const optionalAuth = require('../middleware/optionalAuth');
const logger = require('../utils/logger');
const { getLevelBySpent, calculateMemberPrice } = require('../config/memberLevels');

const router = express.Router();

function addMemberPrice(product, user) {
  const result = product.toJSON ? product.toJSON() : { ...product };
  if (user) {
    const totalSpent = parseFloat(user.total_spent || 0);
    const level = getLevelBySpent(totalSpent);
    result.member_price = calculateMemberPrice(parseFloat(result.price), level.discount);
    result.member_discount = level.discount;
    result.member_level = level;
  }
  return result;
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ['live', 'upcoming', 'ended'].includes(status)) {
      where.status = status;
    }

    let order = [];
    if (where.status === 'live') {
      order = [['viewer_count', 'DESC']];
    } else if (where.status === 'upcoming') {
      order = [['start_time', 'ASC']];
    } else if (where.status === 'ended') {
      order = [['end_time', 'DESC']];
    } else {
      order = [
        ['status', 'ASC'],
        ['start_time', 'DESC']
      ];
    }

    const liveStreams = await LiveStream.findAll({
      where,
      order,
      attributes: [
        'id',
        'title',
        'cover_image',
        'status',
        'start_time',
        'end_time',
        'streamer_name',
        'viewer_count'
      ]
    });

    res.json({
      code: 0,
      data: liveStreams
    });
  } catch (err) {
    logger.error('Get live streams error:', err);
    res.status(500).json({ code: 500, message: '获取直播列表失败' });
  }
});

router.get('/active', optionalAuth, async (req, res) => {
  try {
    const liveStreams = await LiveStream.findAll({
      where: { status: 'live' },
      order: [['viewer_count', 'DESC']],
      limit: 3,
      attributes: [
        'id',
        'title',
        'cover_image',
        'status',
        'streamer_name',
        'viewer_count'
      ]
    });

    res.json({
      code: 0,
      data: liveStreams
    });
  } catch (err) {
    logger.error('Get active live streams error:', err);
    res.status(500).json({ code: 500, message: '获取正在直播信息失败' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const liveStream = await LiveStream.findByPk(req.params.id);
    if (!liveStream) {
      return res.status(404).json({ code: 404, message: '直播不存在' });
    }

    const products = await LiveStreamProduct.findAll({
      where: { live_stream_id: req.params.id },
      include: [
        {
          model: Product,
          attributes: [
            'id',
            'name',
            'slug',
            'price',
            'original_price',
            'image',
            'stock',
            'status'
          ]
        }
      ],
      order: [['sort_order', 'ASC']]
    });

    const productsWithMemberPrice = products.map((lp) => {
      const productJson = lp.toJSON();
      const product = addMemberPrice(productJson.Product, req.user);
      return {
        ...productJson,
        Product: product,
        final_price: lp.live_price || product.price
      };
    });

    const result = liveStream.toJSON();
    result.products = productsWithMemberPrice;

    res.json({
      code: 0,
      data: result
    });
  } catch (err) {
    logger.error('Get live stream detail error:', err);
    res.status(500).json({ code: 500, message: '获取直播详情失败' });
  }
});

module.exports = router;
