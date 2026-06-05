const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Address = require('./Address');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const GroupBuyActivity = require('./GroupBuyActivity');
const GroupBuy = require('./GroupBuy');
const GroupBuyMember = require('./GroupBuyMember');

User.hasMany(Address, { foreignKey: 'user_id' });
Address.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Cart, { foreignKey: 'user_id' });
Cart.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Cart.hasMany(CartItem, { foreignKey: 'cart_id' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'OrderItems' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });
Order.belongsTo(Address, { foreignKey: 'address_id' });

Product.hasMany(GroupBuyActivity, { foreignKey: 'product_id' });
GroupBuyActivity.belongsTo(Product, { foreignKey: 'product_id' });

GroupBuyActivity.hasMany(GroupBuy, { foreignKey: 'group_buy_activity_id' });
GroupBuy.belongsTo(GroupBuyActivity, { foreignKey: 'group_buy_activity_id' });
GroupBuy.belongsTo(Product, { foreignKey: 'product_id' });
GroupBuy.belongsTo(User, { foreignKey: 'leader_id', as: 'leader' });

GroupBuy.hasMany(GroupBuyMember, { foreignKey: 'group_buy_id' });
GroupBuyMember.belongsTo(GroupBuy, { foreignKey: 'group_buy_id' });
GroupBuyMember.belongsTo(User, { foreignKey: 'user_id' });
GroupBuyMember.belongsTo(Order, { foreignKey: 'order_id' });

GroupBuy.hasMany(Order, { foreignKey: 'group_buy_id' });
Order.belongsTo(GroupBuy, { foreignKey: 'group_buy_id' });
Order.belongsTo(GroupBuyMember, { foreignKey: 'group_buy_member_id' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Cart,
  CartItem,
  Address,
  Order,
  OrderItem,
  GroupBuyActivity,
  GroupBuy,
  GroupBuyMember
};
