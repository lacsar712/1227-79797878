const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { SupportTicket, SupportTicketReply, User } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const categoryLabels = {
  product: '商品问题',
  order: '订单问题',
  payment: '支付问题',
  account: '账户问题',
  shipping: '物流问题',
  other: '其他问题'
};

const statusLabels = {
  open: '待处理',
  replied: '已回复',
  closed: '已关闭'
};

router.get('/categories', (req, res) => {
  const categories = Object.entries(categoryLabels).map(([value, label]) => ({
    value,
    label
  }));
  res.json({
    code: 0,
    data: categories
  });
});

router.post('/', auth, [
  body('category').isIn(['product', 'order', 'payment', 'account', 'shipping', 'other']),
  body('subject').isLength({ min: 1, max: 200 }),
  body('description').isLength({ min: 1, max: 5000 }),
  body('priority').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: errors.array()
      });
    }

    const { category, subject, description, priority = 'medium' } = req.body;

    const ticket = await SupportTicket.create({
      user_id: req.user.id,
      category,
      subject,
      description,
      priority,
      status: 'open'
    });

    await SupportTicketReply.create({
      ticket_id: ticket.id,
      user_id: req.user.id,
      content: description,
      is_staff: false
    });

    res.json({
      code: 0,
      message: '工单提交成功',
      data: {
        ...ticket.toJSON(),
        category_label: categoryLabels[ticket.category],
        status_label: statusLabels[ticket.status]
      }
    });
  } catch (err) {
    logger.error('Create ticket error:', err);
    res.status(500).json({ code: 500, message: '提交工单失败' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { user_id: req.user.id };

    if (status) where.status = status;
    if (category) where.category = category;

    const { count, rows } = await SupportTicket.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    const list = rows.map(ticket => ({
      ...ticket.toJSON(),
      category_label: categoryLabels[ticket.category],
      status_label: statusLabels[ticket.status]
    }));

    res.json({
      code: 0,
      data: {
        list,
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (err) {
    logger.error('Get tickets error:', err);
    res.status(500).json({ code: 500, message: '获取工单列表失败' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findOne({
      where: { id, user_id: req.user.id },
      include: [
        {
          model: SupportTicketReply,
          as: 'replies',
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'nickname']
            }
          ],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ code: 404, message: '工单不存在' });
    }

    const data = {
      ...ticket.toJSON(),
      category_label: categoryLabels[ticket.category],
      status_label: statusLabels[ticket.status],
      replies: ticket.replies.map(reply => ({
        ...reply.toJSON(),
        author_name: reply.is_staff
          ? reply.staff_name || '客服专员'
          : reply.User?.nickname || reply.User?.username || '我'
      }))
    };

    res.json({
      code: 0,
      data
    });
  } catch (err) {
    logger.error('Get ticket detail error:', err);
    res.status(500).json({ code: 500, message: '获取工单详情失败' });
  }
});

router.post('/:id/reply', auth, [
  body('content').isLength({ min: 1, max: 5000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { content } = req.body;

    const ticket = await SupportTicket.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!ticket) {
      return res.status(404).json({ code: 404, message: '工单不存在' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ code: 400, message: '工单已关闭，无法回复' });
    }

    const reply = await SupportTicketReply.create({
      ticket_id: ticket.id,
      user_id: req.user.id,
      content,
      is_staff: false
    });

    res.json({
      code: 0,
      message: '回复成功',
      data: {
        ...reply.toJSON(),
        author_name: req.user.nickname || req.user.username || '我'
      }
    });
  } catch (err) {
    logger.error('Reply ticket error:', err);
    res.status(500).json({ code: 500, message: '回复失败' });
  }
});

router.put('/:id/close', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!ticket) {
      return res.status(404).json({ code: 404, message: '工单不存在' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ code: 400, message: '工单已关闭' });
    }

    await ticket.update({
      status: 'closed',
      closed_at: new Date()
    });

    res.json({
      code: 0,
      message: '工单已关闭',
      data: {
        ...ticket.toJSON(),
        category_label: categoryLabels[ticket.category],
        status_label: statusLabels[ticket.status]
      }
    });
  } catch (err) {
    logger.error('Close ticket error:', err);
    res.status(500).json({ code: 500, message: '关闭工单失败' });
  }
});

router.post('/:id/staff-reply', [
  body('content').isLength({ min: 1, max: 5000 }),
  body('staff_name').optional().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { content, staff_name = '客服专员' } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ code: 404, message: '工单不存在' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ code: 400, message: '工单已关闭' });
    }

    const reply = await SupportTicketReply.create({
      ticket_id: ticket.id,
      user_id: 0,
      content,
      is_staff: true,
      staff_name
    });

    await ticket.update({ status: 'replied' });

    res.json({
      code: 0,
      message: '客服回复成功',
      data: {
        ...reply.toJSON(),
        author_name: staff_name
      }
    });
  } catch (err) {
    logger.error('Staff reply ticket error:', err);
    res.status(500).json({ code: 500, message: '回复失败' });
  }
});

module.exports = router;
