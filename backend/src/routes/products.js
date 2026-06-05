const express = require('express');
const { Op } = require('sequelize');
const { Product, Category, GroupBuyActivity, GroupBuy } = require('../models');
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
    const {
      page = 1,
      limit = 12,
      keyword = '',
      category_id,
      sort = 'newest',
      min_price,
      max_price
    } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { status: 'active' };

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (category_id) where.category_id = category_id;
    if (min_price) where.price = { ...where.price, [Op.gte]: parseFloat(min_price) };
    if (max_price) where.price = { ...where.price, [Op.lte]: parseFloat(max_price) };

    let order = [['created_at', 'DESC']];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    else if (sort === 'price_desc') order = [['price', 'DESC']];
    else if (sort === 'sales') order = [['sales_count', 'DESC']];
    else if (sort === 'newest') order = [['created_at', 'DESC']];

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name', 'slug'] }],
      order,
      limit: parseInt(limit, 10),
      offset,
      attributes: [
        'id',
        'name',
        'slug',
        'price',
        'original_price',
        'image',
        'stock',
        'sales_count',
        'category_id'
      ]
    });

    const listWithMemberPrice = rows.map((p) => addMemberPrice(p, req.user));
    res.json({
      code: 0,
      data: {
        list: listWithMemberPrice,
        total: count,
        page: parseInt(page, 1),
        limit: parseInt(limit, 1)
      }
    });
  } catch (err) {
    logger.error('Get products error:', err);
    res.status(500).json({ code: 500, message: '获取商品失败' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'slug'] }]
    });
    if (!product || product.status !== 'active') {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }

    const now = new Date();
    const groupBuyActivity = await GroupBuyActivity.findOne({
      where: {
        product_id: product.id,
        status: 'active',
        [Op.or]: [{ start_time: { [Op.lte]: now } }, { start_time: null }],
        [Op.or]: [{ end_time: { [Op.gte]: now } }, { end_time: null }]
      }
    });

    let groupBuyData = null;
    if (groupBuyActivity) {
      const pendingGroups = await GroupBuy.count({
        where: {
          group_buy_activity_id: groupBuyActivity.id,
          status: 'pending'
        }
      });
      groupBuyData = {
        ...groupBuyActivity.toJSON(),
        pending_groups_count: pendingGroups
      };
    }

    const productWithMemberPrice = addMemberPrice(product, req.user);
    res.json({
      code: 0,
      data: {
        ...productWithMemberPrice,
        group_buy: groupBuyData
      }
    });
  } catch (err) {
    logger.error('Get product detail error:', err);
    res.status(500).json({ code: 500, message: '获取商品详情失败' });
  }
});

module.exports = router;
