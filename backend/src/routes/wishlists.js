const express = require('express');
const { body } = require('express-validator');
const { Wishlist, WishlistItem, Product, User, Cart, CartItem } = require('../models');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const crypto = require('crypto');

const router = express.Router();

function generateShareCode() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

async function updateWishlistCover(wishlistId) {
  const items = await WishlistItem.findAll({
    where: { wishlist_id: wishlistId },
    include: [{ model: Product, attributes: ['image'] }],
    limit: 1
  });
  const coverImage = items.length > 0 && items[0].Product ? items[0].Product.image : null;
  await Wishlist.update({ cover_image: coverImage }, { where: { id: wishlistId } });
  return coverImage;
}

router.get('/', auth, async (req, res) => {
  try {
    const wishlists = await Wishlist.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: WishlistItem,
          include: [{ model: Product, attributes: ['id', 'name', 'price', 'image'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    const data = wishlists.map((w) => ({
      id: w.id,
      name: w.name,
      share_code: w.share_code,
      is_public: w.is_public,
      cover_image: w.cover_image,
      item_count: w.WishlistItems ? w.WishlistItems.length : 0,
      items: w.WishlistItems
        ? w.WishlistItems.filter((i) => i.Product).map((i) => ({
            id: i.id,
            product_id: i.product_id,
            product: i.Product
          }))
        : [],
      createdAt: w.createdAt,
      updatedAt: w.updatedAt
    }));
    res.json({ code: 0, data });
  } catch (err) {
    logger.error('Get wishlists error:', err);
    res.status(500).json({ code: 500, message: '获取清单失败' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        {
          model: WishlistItem,
          include: [{ model: Product, attributes: ['id', 'name', 'price', 'image', 'stock', 'status'] }]
        }
      ]
    });
    if (!wishlist) {
      return res.status(404).json({ code: 404, message: '清单不存在' });
    }
    const data = {
      id: wishlist.id,
      name: wishlist.name,
      share_code: wishlist.share_code,
      is_public: wishlist.is_public,
      cover_image: wishlist.cover_image,
      item_count: wishlist.WishlistItems ? wishlist.WishlistItems.length : 0,
      items: wishlist.WishlistItems
        ? wishlist.WishlistItems.filter((i) => i.Product).map((i) => ({
            id: i.id,
            product_id: i.product_id,
            product: i.Product
          }))
        : [],
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt
    };
    res.json({ code: 0, data });
  } catch (err) {
    logger.error('Get wishlist detail error:', err);
    res.status(500).json({ code: 500, message: '获取清单详情失败' });
  }
});

router.post(
  '/',
  auth,
  [body('name').isString().notEmpty().withMessage('清单名称不能为空')],
  validate,
  async (req, res) => {
    try {
      const { name } = req.body;
      const wishlist = await Wishlist.create({
        user_id: req.user.id,
        name,
        is_public: false
      });
      res.json({ code: 0, data: wishlist, message: '清单创建成功' });
    } catch (err) {
      logger.error('Create wishlist error:', err);
      res.status(500).json({ code: 500, message: '创建清单失败' });
    }
  }
);

router.put(
  '/:id',
  auth,
  [body('name').optional().isString().notEmpty().withMessage('清单名称不能为空')],
  validate,
  async (req, res) => {
    try {
      const { name } = req.body;
      const wishlist = await Wishlist.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      if (!wishlist) {
        return res.status(404).json({ code: 404, message: '清单不存在' });
      }
      if (name !== undefined) wishlist.name = name;
      await wishlist.save();
      res.json({ code: 0, data: wishlist, message: '更新成功' });
    } catch (err) {
      logger.error('Update wishlist error:', err);
      res.status(500).json({ code: 500, message: '更新失败' });
    }
  }
);

router.delete('/:id', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!wishlist) {
      return res.status(404).json({ code: 404, message: '清单不存在' });
    }
    await WishlistItem.destroy({ where: { wishlist_id: wishlist.id } });
    await wishlist.destroy();
    res.json({ code: 0, message: '清单已删除' });
  } catch (err) {
    logger.error('Delete wishlist error:', err);
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

router.post(
  '/:id/items',
  auth,
  [body('product_id').isInt().withMessage('商品ID无效')],
  validate,
  async (req, res) => {
    try {
      const { product_id } = req.body;
      const wishlist = await Wishlist.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      if (!wishlist) {
        return res.status(404).json({ code: 404, message: '清单不存在' });
      }
      const product = await Product.findByPk(product_id);
      if (!product || product.status !== 'active') {
        return res.status(404).json({ code: 404, message: '商品不存在' });
      }
      const existing = await WishlistItem.findOne({
        where: { wishlist_id: wishlist.id, product_id }
      });
      if (existing) {
        return res.json({ code: 0, data: existing, message: '商品已在清单中' });
      }
      const item = await WishlistItem.create({
        wishlist_id: wishlist.id,
        product_id
      });
      await updateWishlistCover(wishlist.id);
      res.json({ code: 0, data: item, message: '已添加到清单' });
    } catch (err) {
      logger.error('Add wishlist item error:', err);
      res.status(500).json({ code: 500, message: '添加失败' });
    }
  }
);

router.delete('/:id/items/:itemId', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!wishlist) {
      return res.status(404).json({ code: 404, message: '清单不存在' });
    }
    const deleted = await WishlistItem.destroy({
      where: { id: req.params.itemId, wishlist_id: wishlist.id }
    });
    if (!deleted) {
      return res.status(404).json({ code: 404, message: '商品不在清单中' });
    }
    await updateWishlistCover(wishlist.id);
    res.json({ code: 0, message: '已从清单移除' });
  } catch (err) {
    logger.error('Remove wishlist item error:', err);
    res.status(500).json({ code: 500, message: '移除失败' });
  }
});

router.post('/:id/share', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!wishlist) {
      return res.status(404).json({ code: 404, message: '清单不存在' });
    }
    if (!wishlist.share_code) {
      let shareCode;
      let attempts = 0;
      do {
        shareCode = generateShareCode();
        const existing = await Wishlist.findOne({ where: { share_code: shareCode } });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);
      if (attempts >= 10) {
        return res.status(500).json({ code: 500, message: '生成分享码失败，请重试' });
      }
      wishlist.share_code = shareCode;
    }
    wishlist.is_public = true;
    await wishlist.save();
    res.json({
      code: 0,
      data: {
        share_code: wishlist.share_code,
        is_public: wishlist.is_public
      },
      message: '分享链接已生成'
    });
  } catch (err) {
    logger.error('Generate share code error:', err);
    res.status(500).json({ code: 500, message: '生成分享链接失败' });
  }
});

router.post('/:id/unshare', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!wishlist) {
      return res.status(404).json({ code: 404, message: '清单不存在' });
    }
    wishlist.is_public = false;
    await wishlist.save();
    res.json({ code: 0, message: '已取消分享' });
  } catch (err) {
    logger.error('Unshare wishlist error:', err);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

router.get('/share/:shareCode', optionalAuth, async (req, res) => {
  try {
    const { shareCode } = req.params;
    const wishlist = await Wishlist.findOne({
      where: { share_code: shareCode, is_public: true },
      include: [
        {
          model: WishlistItem,
          include: [{ model: Product, attributes: ['id', 'name', 'price', 'image', 'stock', 'status'] }]
        },
        {
          model: User,
          attributes: ['id', 'nickname', 'username']
        }
      ]
    });
    if (!wishlist) {
      return res.status(404).json({ code: 404, message: '清单不存在或已取消分享' });
    }
    const isOwner = req.user && req.user.id === wishlist.user_id;
    const data = {
      id: wishlist.id,
      name: wishlist.name,
      share_code: wishlist.share_code,
      cover_image: wishlist.cover_image,
      owner: {
        id: wishlist.User.id,
        nickname: wishlist.User.nickname || wishlist.User.username
      },
      item_count: wishlist.WishlistItems ? wishlist.WishlistItems.length : 0,
      items: wishlist.WishlistItems
        ? wishlist.WishlistItems.filter((i) => i.Product).map((i) => ({
            id: i.id,
            product_id: i.product_id,
            product: i.Product
          }))
        : [],
      is_owner: isOwner,
      createdAt: wishlist.createdAt
    };
    res.json({ code: 0, data });
  } catch (err) {
    logger.error('Get shared wishlist error:', err);
    res.status(500).json({ code: 500, message: '获取清单失败' });
  }
});

router.post(
  '/share/:shareCode/add-to-cart',
  optionalAuth,
  [body('product_ids').optional().isArray().withMessage('商品ID列表格式错误')],
  validate,
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ code: 401, message: '请先登录' });
      }
      const { shareCode } = req.params;
      const { product_ids } = req.body;
      const wishlist = await Wishlist.findOne({
        where: { share_code: shareCode, is_public: true },
        include: [
          {
            model: WishlistItem,
            include: [{ model: Product }]
          }
        ]
      });
      if (!wishlist) {
        return res.status(404).json({ code: 404, message: '清单不存在或已取消分享' });
      }
      let items = wishlist.WishlistItems || [];
      if (product_ids && product_ids.length > 0) {
        items = items.filter((i) => product_ids.includes(i.product_id));
      }
      items = items.filter((i) => i.Product && i.Product.status === 'active' && i.Product.stock > 0);
      if (items.length === 0) {
        return res.status(400).json({ code: 400, message: '没有可添加的商品' });
      }
      let cart = await Cart.findOne({ where: { user_id: req.user.id } });
      if (!cart) {
        cart = await Cart.create({ user_id: req.user.id });
      }
      let addedCount = 0;
      for (const item of items) {
        const product = item.Product;
        if (product.stock < 1) continue;
        let existing = await CartItem.findOne({
          where: { cart_id: cart.id, product_id: product.id }
        });
        if (existing) {
          const newQty = Math.min(existing.quantity + 1, product.stock);
          existing.quantity = newQty;
          await existing.save();
        } else {
          await CartItem.create({
            cart_id: cart.id,
            product_id: product.id,
            quantity: 1
          });
        }
        addedCount++;
      }
      res.json({
        code: 0,
        data: { added_count: addedCount, cart_id: cart.id },
        message: `已将 ${addedCount} 件商品加入购物车`
      });
    } catch (err) {
      logger.error('Add wishlist to cart error:', err);
      res.status(500).json({ code: 500, message: '添加到购物车失败' });
    }
  }
);

module.exports = router;
