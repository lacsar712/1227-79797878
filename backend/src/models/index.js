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
const GiftCard = require('./GiftCard');
const GiftCardUsage = require('./GiftCardUsage');
const StockSubscription = require('./StockSubscription');
const Notification = require('./Notification');
const SupportTicket = require('./SupportTicket');
const SupportTicketReply = require('./SupportTicketReply');
const Wishlist = require('./Wishlist');
const WishlistItem = require('./WishlistItem');

User.hasMany(Address, { foreignKey: 'user_id' });
User.hasMany(GiftCard, { foreignKey: 'user_id' });
GiftCard.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(GiftCardUsage, { foreignKey: 'user_id' });
GiftCardUsage.belongsTo(User, { foreignKey: 'user_id' });
GiftCard.hasMany(GiftCardUsage, { foreignKey: 'gift_card_id' });
GiftCardUsage.belongsTo(GiftCard, { foreignKey: 'gift_card_id' });
Order.hasMany(GiftCardUsage, { foreignKey: 'order_id' });
GiftCardUsage.belongsTo(Order, { foreignKey: 'order_id' });
GiftCard.hasMany(Order, { foreignKey: 'gift_card_id' });
Order.belongsTo(GiftCard, { foreignKey: 'gift_card_id' });
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

User.hasMany(StockSubscription, { foreignKey: 'user_id' });
StockSubscription.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(StockSubscription, { foreignKey: 'product_id' });
StockSubscription.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(SupportTicket, { foreignKey: 'user_id' });
SupportTicket.belongsTo(User, { foreignKey: 'user_id' });

SupportTicket.hasMany(SupportTicketReply, { foreignKey: 'ticket_id', as: 'replies' });
SupportTicketReply.belongsTo(SupportTicket, { foreignKey: 'ticket_id' });
SupportTicketReply.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Wishlist, { foreignKey: 'user_id' });
Wishlist.belongsTo(User, { foreignKey: 'user_id' });

Wishlist.hasMany(WishlistItem, { foreignKey: 'wishlist_id' });
WishlistItem.belongsTo(Wishlist, { foreignKey: 'wishlist_id' });
WishlistItem.belongsTo(Product, { foreignKey: 'product_id' });

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
  GroupBuyMember,
  GiftCard,
  GiftCardUsage,
  StockSubscription,
  Notification,
  SupportTicket,
  SupportTicketReply,
  Wishlist,
  WishlistItem
};
