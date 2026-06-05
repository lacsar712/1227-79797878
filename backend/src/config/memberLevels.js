const MEMBER_LEVELS = [
  {
    level: 1,
    name: '普通会员',
    icon: '🥉',
    min_spent: 0,
    discount: 1.0,
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
    benefits: ['基础购物权益', '订单追踪', '售后保障']
  },
  {
    level: 2,
    name: '银牌会员',
    icon: '🥈',
    min_spent: 500,
    discount: 0.95,
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 50%, #64748b 100%)',
    benefits: ['95折专属优惠', '优先发货', '生日礼品券', '专属客服']
  },
  {
    level: 3,
    name: '金牌会员',
    icon: '🥇',
    min_spent: 2000,
    discount: 0.88,
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #d97706 100%)',
    benefits: ['88折专属优惠', '免费包邮', '优先发货', '生日双倍积分', '专属客服', '新品抢先购']
  },
  {
    level: 4,
    name: '钻石会员',
    icon: '💎',
    min_spent: 5000,
    discount: 0.80,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #a78bfa 50%, #7c3aed 100%)',
    benefits: ['8折专属优惠', '全场包邮', '极速发货', '生日三倍积分', '1对1专属客服', '新品抢先购', '专属活动邀请', '无忧退换货']
  }
];

function getLevelBySpent(totalSpent) {
  let currentLevel = MEMBER_LEVELS[0];
  for (const level of MEMBER_LEVELS) {
    if (totalSpent >= level.min_spent) {
      currentLevel = level;
    } else {
      break;
    }
  }
  return currentLevel;
}

function getNextLevel(totalSpent) {
  const currentLevel = getLevelBySpent(totalSpent);
  const nextLevelIndex = MEMBER_LEVELS.findIndex((l) => l.level === currentLevel.level) + 1;
  if (nextLevelIndex < MEMBER_LEVELS.length) {
    return MEMBER_LEVELS[nextLevelIndex];
  }
  return null;
}

function getLevelProgress(totalSpent) {
  const currentLevel = getLevelBySpent(totalSpent);
  const nextLevel = getNextLevel(totalSpent);

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progress: 100,
      amountToNext: 0,
      totalSpent
    };
  }

  const progressRange = nextLevel.min_spent - currentLevel.min_spent;
  const currentProgress = totalSpent - currentLevel.min_spent;
  const progress = Math.min(100, Math.round((currentProgress / progressRange) * 100));
  const amountToNext = nextLevel.min_spent - totalSpent;

  return {
    currentLevel,
    nextLevel,
    progress,
    amountToNext,
    totalSpent
  };
}

function calculateMemberPrice(originalPrice, discount) {
  return Math.round(originalPrice * discount * 100) / 100;
}

module.exports = {
  MEMBER_LEVELS,
  getLevelBySpent,
  getNextLevel,
  getLevelProgress,
  calculateMemberPrice
};
