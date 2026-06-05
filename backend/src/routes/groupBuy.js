const express = require('express');
const { body, param } = require('express-validator');
const { Op } = require('sequelize');
const {
  GroupBuyActivity,
  GroupBuy,
  GroupBuyMember,
  Product,
  User,
  Order,
  OrderItem,
  Address
} = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();

const generateOrderNo = () => {
  return 'O' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8);
};

router.get('/activity/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date();
    const activity = await GroupBuyActivity.findOne({
      where: {
        product_id: productId,
        status: 'active',
        [Op.or]: [
          { start_time: { [Op.lte]: now } },
          { start_time: null }
        ],
        [Op.or]: [
          { end_time: { [Op.gte]: now } },
          { end_time: null }
        ]
      },
      include: [{ model: Product, attributes: ['id', 'name', 'price', 'image', 'stock'] }]
    });

    if (!activity) {
      return res.json({ code: 0, data: null });
    }

    const pendingGroups = await GroupBuy.count({
      where: {
        group_buy_activity_id: activity.id,
        status: 'pending'
      }
    });

    res.json({
      code: 0,
      data: {
        ...activity.toJSON(),
        pending_groups_count: pendingGroups
      }
    });
  } catch (err) {
    logger.error('Get group buy activity error:', err);
    res.status(500).json({ code: 500, message: '获取拼团活动失败' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const memberWhere = { user_id: req.user.id };

    const { count, rows } = await GroupBuyMember.findAndCountAll({
      where: memberWhere,
      include: [
        {
          model: GroupBuy,
          include: [
            { model: Product, attributes: ['id', 'name', 'image'] },
            {
              model: GroupBuyMember,
              as: 'GroupBuyMembers',
              include: [{ model: User, attributes: ['id', 'username', 'avatar'] }]
            }
          ]
        }
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
    logger.error('Get my group buys error:', err);
    res.status(500).json({ code: 500, message: '获取我的拼团失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const groupBuy = await GroupBuy.findByPk(id, {
      include: [
        {
          model: GroupBuyActivity,
          attributes: ['id', 'group_price', 'min_people', 'duration_hours']
        },
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'image', 'stock', 'description']
        },
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: GroupBuyMember,
          include: [{ model: User, attributes: ['id', 'username', 'avatar'] }]
        }
      ]
    });

    if (!groupBuy) {
      return res.status(404).json({ code: 404, message: '拼团不存在' });
    }

    const now = new Date();
    if (groupBuy.status === 'pending' && new Date(groupBuy.expire_at) <= now) {
      await expireGroupBuy(groupBuy);
      groupBuy.status = 'expired';
    }

    res.json({ code: 0, data: groupBuy });
  } catch (err) {
    logger.error('Get group buy detail error:', err);
    res.status(500).json({ code: 500, message: '获取拼团详情失败' });
  }
});

router.post(
  '/create',
  auth,
  [
    body('activity_id').isInt().withMessage('请选择拼团活动'),
    body('address_id').isInt().withMessage('请选择收货地址'),
    body('payment_method').isIn(['alipay', 'wechat', 'bank']).withMessage('请选择支付方式')
  ],
  validate,
  async (req, res) => {
    const transaction = await require('../config/database').transaction();
    try {
      const { activity_id, address_id, payment_method } = req.body;
      const userId = req.user.id;

      const activity = await GroupBuyActivity.findByPk(activity_id, {
        include: [{ model: Product }],
        transaction
      });

      if (!activity || activity.status !== 'active') {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '拼团活动不存在或已结束' });
      }

      const now = new Date();
      if (activity.start_time && new Date(activity.start_time) > now) {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '拼团活动尚未开始' });
      }
      if (activity.end_time && new Date(activity.end_time) < now) {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '拼团活动已结束' });
      }

      const product = activity.Product;
      if (!product || product.stock < 1) {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '商品库存不足' });
      }

      const address = await Address.findOne({
        where: { id: address_id, user_id: userId },
        transaction
      });
      if (!address) {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '收货地址无效' });
      }

      const expireAt = new Date(now.getTime() + activity.duration_hours * 60 * 60 * 1000);
      const groupBuy = await GroupBuy.create(
        {
          group_buy_activity_id: activity.id,
          product_id: product.id,
          leader_id: userId,
          group_price: activity.group_price,
          min_people: activity.min_people,
          current_people: 0,
          expire_at: expireAt,
          status: 'pending'
        },
        { transaction }
      );

      const member = await GroupBuyMember.create(
        {
          group_buy_id: groupBuy.id,
          user_id: userId,
          is_leader: true,
          status: 'joined'
        },
        { transaction }
      );

      await groupBuy.update({ current_people: 1 }, { transaction });

      await product.update({ stock: product.stock - 1 }, { transaction });

      const order = await createGroupOrder(
        groupBuy,
        member,
        product,
        address,
        payment_method,
        userId,
        transaction
      );

      await member.update({ order_id: order.id, status: 'order_created' }, { transaction });

      if (groupBuy.current_people >= groupBuy.min_people) {
        await successGroupBuy(groupBuy, transaction);
      }

      await transaction.commit();

      const result = await GroupBuy.findByPk(groupBuy.id, {
        include: [
          { model: Product, attributes: ['id', 'name', 'image'] },
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'username', 'avatar']
          },
          {
            model: GroupBuyMember,
            include: [{ model: User, attributes: ['id', 'username', 'avatar'] }]
          }
        ]
      });

      res.json({ code: 0, data: { group_buy: result, order }, message: '拼团发起成功' });
    } catch (err) {
      await transaction.rollback();
      logger.error('Create group buy error:', err);
      res.status(500).json({ code: 500, message: '发起拼团失败' });
    }
  }
);

router.post(
  '/:id/join',
  auth,
  [
    param('id').isInt().withMessage('拼团ID无效'),
    body('address_id').isInt().withMessage('请选择收货地址'),
    body('payment_method').isIn(['alipay', 'wechat', 'bank']).withMessage('请选择支付方式')
  ],
  validate,
  async (req, res) => {
    const transaction = await require('../config/database').transaction();
    try {
      const { id } = req.params;
      const { address_id, payment_method } = req.body;
      const userId = req.user.id;

      const groupBuy = await GroupBuy.findByPk(id, {
        include: [
          { model: Product },
          { model: GroupBuyActivity },
          { model: GroupBuyMember }
        ],
        transaction
      });

      if (!groupBuy) {
        await transaction.rollback();
        return res.status(404).json({ code: 404, message: '拼团不存在' });
      }

      if (groupBuy.status !== 'pending') {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '拼团已结束' });
      }

      const now = new Date();
      if (new Date(groupBuy.expire_at) <= now) {
        await expireGroupBuy(groupBuy);
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '拼团已过期' });
      }

      const existingMember = groupBuy.GroupBuyMembers.find((m) => m.user_id === userId);
      if (existingMember) {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '您已加入该拼团' });
      }

      if (groupBuy.current_people >= groupBuy.min_people) {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '拼团人数已满' });
      }

      const product = groupBuy.Product;
      if (!product || product.stock < 1) {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '商品库存不足' });
      }

      const address = await Address.findOne({
        where: { id: address_id, user_id: userId },
        transaction
      });
      if (!address) {
        await transaction.rollback();
        return res.status(400).json({ code: 400, message: '收货地址无效' });
      }

      const member = await GroupBuyMember.create(
        {
          group_buy_id: groupBuy.id,
          user_id: userId,
          is_leader: false,
          status: 'joined'
        },
        { transaction }
      );

      const newPeople = groupBuy.current_people + 1;
      await groupBuy.update({ current_people: newPeople }, { transaction });

      await product.update({ stock: product.stock - 1 }, { transaction });

      const order = await createGroupOrder(
        groupBuy,
        member,
        product,
        address,
        payment_method,
        userId,
        transaction
      );

      await member.update({ order_id: order.id, status: 'order_created' }, { transaction });

      if (newPeople >= groupBuy.min_people) {
        await successGroupBuy(groupBuy, transaction);
      }

      await transaction.commit();

      const result = await GroupBuy.findByPk(groupBuy.id, {
        include: [
          { model: Product, attributes: ['id', 'name', 'image'] },
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'username', 'avatar']
          },
          {
            model: GroupBuyMember,
            include: [{ model: User, attributes: ['id', 'username', 'avatar'] }]
          }
        ]
      });

      res.json({ code: 0, data: { group_buy: result, order }, message: '加入拼团成功' });
    } catch (err) {
      await transaction.rollback();
      logger.error('Join group buy error:', err);
      res.status(500).json({ code: 500, message: '加入拼团失败' });
    }
  }
);

async function createGroupOrder(groupBuy, member, product, address, paymentMethod, userId, transaction) {
  const price = parseFloat(groupBuy.group_price);
  const subtotal = price;

  const order = await Order.create(
    {
      user_id: userId,
      order_no: generateOrderNo(),
      address_id: address.id,
      total_amount: subtotal,
      payment_method: paymentMethod,
      payment_status: 'pending',
      status: 'pending',
      group_buy_id: groupBuy.id,
      group_buy_member_id: member.id
    },
    { transaction }
  );

  await OrderItem.create(
    {
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      product_image: product.image,
      price: price,
      quantity: 1,
      subtotal: subtotal
    },
    { transaction }
  );

  return order;
}

async function successGroupBuy(groupBuy, transaction) {
  await groupBuy.update({ status: 'success' }, { transaction });

  const members = await GroupBuyMember.findAll({
    where: { group_buy_id: groupBuy.id },
    transaction
  });

  for (const member of members) {
    const order = await Order.findByPk(member.order_id, { transaction });
    if (order) {
      await order.update({ status: 'pending' }, { transaction });
    }
    await member.update({ status: 'order_created' }, { transaction });
  }

  const product = await Product.findByPk(groupBuy.product_id, { transaction });
  if (product) {
    await product.update(
      {
        sales_count: product.sales_count + groupBuy.current_people
      },
      { transaction }
    );
  }

  logger.info(`Group buy ${groupBuy.id} success with ${groupBuy.current_people} people`);
}

async function expireGroupBuy(groupBuy) {
  const transaction = await require('../config/database').transaction();
  try {
    await groupBuy.update({ status: 'expired' }, { transaction });

    const members = await GroupBuyMember.findAll({
      where: { group_buy_id: groupBuy.id },
      transaction
    });

    for (const member of members) {
      const order = await Order.findByPk(member.order_id, { transaction });
      if (order && order.payment_status === 'pending') {
        await order.update({ status: 'cancelled' }, { transaction });
      }
      await member.update({ status: 'cancelled' }, { transaction });
    }

    const product = await Product.findByPk(groupBuy.product_id, { transaction });
    if (product) {
      await product.update(
        {
          stock: product.stock + groupBuy.current_people
        },
        { transaction }
      );
    }

    await transaction.commit();
    logger.info(`Group buy ${groupBuy.id} expired, stock released: ${groupBuy.current_people}`);
  } catch (err) {
    await transaction.rollback();
    logger.error('Expire group buy error:', err);
  }
}

async function checkExpiredGroupBuys() {
  try {
    const now = new Date();
    const expiredGroups = await GroupBuy.findAll({
      where: {
        status: 'pending',
        expire_at: { [Op.lte]: now }
      },
      include: [{ model: Product }]
    });

    for (const group of expiredGroups) {
      await expireGroupBuy(group);
    }

    if (expiredGroups.length > 0) {
      logger.info(`Checked and expired ${expiredGroups.length} group buys`);
    }
  } catch (err) {
    logger.error('Check expired group buys error:', err);
  }
}

module.exports = { router, checkExpiredGroupBuys };
