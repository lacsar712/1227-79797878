const { Op } = require('sequelize');
const {
  sequelize,
  Order,
  OrderItem,
  Cart,
  CartItem,
  Address,
  Product,
  GiftCard,
  GiftCardUsage
} = require('../models');
const logger = require('../utils/logger');

class OrderService {
  static _generateOrderNo() {
    return 'O' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8);
  }

  static async _deductStock(items, transaction) {
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction });
      if (!product) {
        throw new Error(`商品 ${item.product_id} 不存在`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`商品 ${product.name} 库存不足`);
      }
      await product.update(
        {
          stock: product.stock - item.quantity,
          sales_count: product.sales_count + item.quantity
        },
        { transaction }
      );
    }
  }

  static async _restoreStock(orderId, transaction) {
    const orderItems = await OrderItem.findAll({
      where: { order_id: orderId },
      transaction
    });
    for (const oi of orderItems) {
      const product = await Product.findByPk(oi.product_id, { transaction });
      if (product) {
        await product.update(
          {
            stock: product.stock + oi.quantity,
            sales_count: Math.max(0, product.sales_count - oi.quantity)
          },
          { transaction }
        );
      }
    }
  }

  static async _applyGiftCards(userId, totalAmount, useGiftCard, giftCardId, orderId, transaction) {
    if (!useGiftCard) return { deduction: 0, selectedGiftCard: null };

    const whereCondition = {
      user_id: userId,
      status: 'bound',
      balance: { [Op.gt]: 0 }
    };
    if (giftCardId) {
      whereCondition.id = giftCardId;
    }

    const giftCards = await GiftCard.findAll({
      where: whereCondition,
      order: [['balance', 'DESC']],
      transaction
    });

    let totalDeduction = 0;
    let remainingAmount = totalAmount;
    let selectedGiftCard = null;

    for (const card of giftCards) {
      if (remainingAmount <= 0) break;
      const cardBalance = parseFloat(card.balance);
      if (cardBalance <= 0) continue;

      const deduction = Math.min(cardBalance, remainingAmount);
      const newBalance = (cardBalance - deduction).toFixed(2);

      await card.update(
        {
          balance: newBalance,
          status: parseFloat(newBalance) <= 0 ? 'used' : 'bound'
        },
        { transaction }
      );

      await GiftCardUsage.create(
        {
          gift_card_id: card.id,
          user_id: userId,
          order_id: orderId,
          amount: deduction,
          balance_before: cardBalance,
          balance_after: newBalance
        },
        { transaction }
      );

      totalDeduction += deduction;
      remainingAmount -= deduction;
      selectedGiftCard = card;

      if (remainingAmount <= 0) break;
    }

    if (totalDeduction > totalAmount) {
      totalDeduction = totalAmount;
    }

    return { deduction: totalDeduction, selectedGiftCard };
  }

  static async _calculateGiftCardDeduction(userId, totalAmount, useGiftCard, giftCardId) {
    if (!useGiftCard) return { deduction: 0, selectedGiftCard: null };

    const whereCondition = {
      user_id: userId,
      status: 'bound'
    };
    if (giftCardId) {
      whereCondition.id = giftCardId;
    }

    const giftCards = await GiftCard.findAll({
      where: whereCondition,
      order: [['balance', 'DESC']]
    });

    let totalDeduction = 0;
    let remainingAmount = totalAmount;
    let selectedGiftCard = null;

    for (const card of giftCards) {
      if (remainingAmount <= 0) break;
      const cardBalance = parseFloat(card.balance);
      if (cardBalance <= 0) continue;

      const deduction = Math.min(cardBalance, remainingAmount);
      totalDeduction += deduction;
      remainingAmount -= deduction;
      selectedGiftCard = card;

      if (remainingAmount <= 0) break;
    }

    if (totalDeduction > totalAmount) {
      totalDeduction = totalAmount;
    }

    return { deduction: totalDeduction, selectedGiftCard };
  }

  static async createOrder(userId, orderData) {
    const { address_id, payment_method, remark, use_gift_card, gift_card_id } = orderData;

    const t = await sequelize.transaction();

    try {
      const address = await Address.findOne({
        where: { id: address_id, user_id: userId },
        transaction: t
      });
      if (!address) {
        throw new Error('收货地址无效');
      }

      const cart = await Cart.findOne({
        where: { user_id: userId },
        transaction: t
      });
      if (!cart) {
        throw new Error('购物车为空');
      }

      const cartItems = await CartItem.findAll({
        where: { cart_id: cart.id },
        include: [Product],
        transaction: t
      });
      if (!cartItems.length) {
        throw new Error('购物车为空');
      }

      const items = [];
      let totalAmount = 0;
      for (const ci of cartItems) {
        if (!ci.Product) continue;
        const product = ci.Product;
        const qty = Math.min(ci.quantity, product.stock);
        if (qty <= 0) {
          throw new Error(`商品 ${product.name} 库存不足`);
        }
        const price = parseFloat(product.price);
        const subtotal = price * qty;
        totalAmount += subtotal;
        items.push({
          product_id: product.id,
          product_name: product.name,
          product_image: product.image,
          price,
          quantity: qty,
          subtotal
        });
      }

      const { deduction: giftCardDeduction, selectedGiftCard } = await this._calculateGiftCardDeduction(
        userId,
        totalAmount,
        use_gift_card,
        gift_card_id
      );

      const order = await Order.create(
        {
          user_id: userId,
          order_no: this._generateOrderNo(),
          address_id,
          total_amount: totalAmount,
          gift_card_deduction: giftCardDeduction,
          gift_card_id: selectedGiftCard?.id || null,
          payment_method,
          remark: remark || null
        },
        { transaction: t }
      );

      await this._applyGiftCards(
        userId,
        totalAmount,
        use_gift_card,
        gift_card_id,
        order.id,
        t
      );

      for (const it of items) {
        await OrderItem.create(
          {
            order_id: order.id,
            ...it
          },
          { transaction: t }
        );
      }

      await this._deductStock(items, t);

      await CartItem.destroy({
        where: { cart_id: cart.id },
        transaction: t
      });

      await t.commit();

      const created = await Order.findByPk(order.id, {
        include: [Address, { model: OrderItem, as: 'OrderItems' }]
      });

      return created;
    } catch (err) {
      await t.rollback();
      logger.error('Create order transaction error:', err);
      throw err;
    }
  }

  static async payOrder(orderId, userId) {
    const t = await sequelize.transaction();

    try {
      const order = await Order.findOne({
        where: { id: orderId, user_id: userId },
        transaction: t
      });
      if (!order) {
        throw new Error('订单不存在');
      }
      if (order.payment_status === 'paid') {
        throw new Error('订单已支付');
      }

      await order.update(
        { payment_status: 'paid', status: 'paid' },
        { transaction: t }
      );

      await t.commit();

      return order;
    } catch (err) {
      await t.rollback();
      logger.error('Pay order transaction error:', err);
      throw err;
    }
  }

  static async cancelOrder(orderId, userId) {
    const t = await sequelize.transaction();

    try {
      const order = await Order.findOne({
        where: { id: orderId, user_id: userId },
        transaction: t
      });
      if (!order) {
        throw new Error('订单不存在');
      }
      if (order.status !== 'pending' && order.status !== 'paid') {
        throw new Error('订单无法取消');
      }

      await order.update({ status: 'cancelled' }, { transaction: t });

      if (order.payment_status === 'paid') {
        await this._restoreStock(orderId, t);
      }

      await t.commit();

      return order;
    } catch (err) {
      await t.rollback();
      logger.error('Cancel order transaction error:', err);
      throw err;
    }
  }
}

module.exports = OrderService;
