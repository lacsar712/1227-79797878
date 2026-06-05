const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2)
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    image: {
      type: DataTypes.STRING(500)
    },
    images: {
      type: DataTypes.JSON
    },
    sales_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  },
  {
    tableName: 'products',
    hooks: {
      beforeUpdate: async (product, options) => {
        if (product.changed('stock')) {
          const previousStock = product.previous('stock');
          const currentStock = product.stock;
          if (previousStock === 0 && currentStock > 0) {
            product._stockRestored = true;
            product._newStock = currentStock;
          }
        }
      },
      afterUpdate: async (product, options) => {
        if (product._stockRestored) {
          try {
            const { StockSubscription, Notification } = require('./index');
            const t = await sequelize.transaction();
            const subscriptions = await StockSubscription.findAll({
              where: {
                product_id: product.id,
                status: 'active'
              },
              transaction: t
            });

            for (const sub of subscriptions) {
              await Notification.create({
                user_id: sub.user_id,
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
              }, { transaction: t });
            }

            await StockSubscription.update(
              {
                status: 'notified',
                notified_at: new Date()
              },
              {
                where: {
                  product_id: product.id,
                  status: 'active'
                },
                transaction: t
              }
            );

            await t.commit();
            logger.info(`Stock restored for product ${product.id}, notified ${subscriptions.length} users`);
          } catch (err) {
            logger.error('Handle stock restored error:', err);
          }
        }
      }
    }
  }
);

module.exports = Product;
