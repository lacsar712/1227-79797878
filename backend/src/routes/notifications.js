const express = require('express');
const { Op } = require('sequelize');
const { Notification } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, is_read } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { user_id: req.user.id };

    if (type) where.type = type;
    if (is_read !== undefined) where.is_read = is_read === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
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
    logger.error('Get notifications error:', err);
    res.status(500).json({ code: 500, message: '获取消息列表失败' });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        user_id: req.user.id,
        is_read: false
      }
    });

    res.json({
      code: 0,
      data: { unread_count: count }
    });
  } catch (err) {
    logger.error('Get unread count error:', err);
    res.status(500).json({ code: 500, message: '获取未读消息数失败' });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ code: 404, message: '消息不存在' });
    }

    await notification.update({ is_read: true });

    res.json({
      code: 0,
      message: '已标记为已读',
      data: notification
    });
  } catch (err) {
    logger.error('Mark notification read error:', err);
    res.status(500).json({ code: 500, message: '标记已读失败' });
  }
});

router.put('/read-all', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const where = { user_id: req.user.id, is_read: false };
    if (type) where.type = type;

    await Notification.update({ is_read: true }, { where });

    res.json({
      code: 0,
      message: '已全部标记为已读'
    });
  } catch (err) {
    logger.error('Mark all read error:', err);
    res.status(500).json({ code: 500, message: '标记全部已读失败' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Notification.destroy({
      where: { id, user_id: req.user.id }
    });

    if (result === 0) {
      return res.status(404).json({ code: 404, message: '消息不存在' });
    }

    res.json({
      code: 0,
      message: '已删除'
    });
  } catch (err) {
    logger.error('Delete notification error:', err);
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

module.exports = router;
