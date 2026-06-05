<template>
  <div class="page-container">
    <h1 class="page-title">个人中心</h1>
    <el-card shadow="never" class="profile-card">
      <div class="profile-header">
        <el-avatar :size="80">{{ userStore.user?.nickname?.[0] || 'U' }}</el-avatar>
        <div class="profile-info">
          <h2>{{ userStore.user?.nickname || userStore.user?.username }}</h2>
          <p>{{ userStore.user?.email }}</p>
        </div>
      </div>
      <div class="balance-section">
        <router-link to="/gift-card" class="gift-card-balance">
          <div class="balance-icon">
            <el-icon :size="28"><Wallet /></el-icon>
          </div>
          <div class="balance-info">
            <div class="balance-label">礼品卡余额</div>
            <div class="balance-value">¥{{ giftCardStore.totalBalance.value }}</div>
          </div>
          <div class="balance-arrow">
            <el-icon :size="20"><ArrowRight /></el-icon>
          </div>
        </router-link>
      </div>
      <el-divider />
      <div class="quick-links">
        <router-link to="/orders" class="link-item">
          <el-icon :size="24"><Document /></el-icon>
          <span>我的订单</span>
        </router-link>
        <router-link to="/gift-card" class="link-item">
          <el-icon :size="24"><Wallet /></el-icon>
          <span>礼品卡</span>
        </router-link>
        <router-link to="/profile/address" class="link-item">
          <el-icon :size="24"><Location /></el-icon>
          <span>收货地址</span>
        </router-link>
        <router-link to="/cart" class="link-item">
          <el-icon :size="24"><ShoppingCart /></el-icon>
          <span>购物车</span>
        </router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Document, Location, ShoppingCart, Wallet, ArrowRight } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { useGiftCardStore } from '@/stores/giftCard';
import { onMounted } from 'vue';

const userStore = useUserStore();
const giftCardStore = useGiftCardStore();

onMounted(async () => {
  await userStore.fetchUser();
  await giftCardStore.fetchMyCards();
});
</script>

<style scoped>
.profile-card { max-width: 600px; }
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}
.profile-info h2 { font-size: 22px; margin: 0 0 8px; }
.profile-info p { margin: 0; color: #64748b; }
.balance-section {
  margin-top: 20px;
}
.gift-card-balance {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12px;
  transition: all 0.2s;
}
.gift-card-balance:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}
.balance-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}
.balance-info {
  flex: 1;
}
.balance-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}
.balance-value {
  font-size: 28px;
  font-weight: 700;
}
.balance-arrow {
  opacity: 0.8;
}
.quick-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s;
}
.link-item:hover {
  background: #eef2ff;
  color: #6366f1;
}
@media (max-width: 600px) {
  .quick-links { grid-template-columns: repeat(2, 1fr); }
  .balance-value { font-size: 24px; }
}
</style>
