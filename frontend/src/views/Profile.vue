<template>
  <div class="page-container">
    <h1 class="page-title">个人中心</h1>
    <el-card shadow="never" class="profile-card">
      <div class="profile-header">
        <el-avatar :size="80">{{ userStore.user?.nickname?.[0] || 'U' }}</el-avatar>
        <div class="profile-info">
          <div class="name-row">
            <h2>{{ userStore.user?.nickname || userStore.user?.username }}</h2>
            <div
              v-if="userStore.memberLevel"
              class="member-badge"
              :style="{ background: userStore.memberLevel.gradient }"
            >
              <span class="member-icon">{{ userStore.memberLevel.icon }}</span>
              <span class="member-name">{{ userStore.memberLevel.name }}</span>
            </div>
          </div>
          <p>{{ userStore.user?.email }}</p>
          <div class="total-spent" v-if="userStore.isLoggedIn">
            累计消费：<strong>¥{{ userStore.totalSpent.toFixed(2) }}</strong>
          </div>
        </div>
      </div>

      <div v-if="userStore.memberProgress" class="member-progress-section">
        <div class="progress-header">
          <span class="current-level">
            {{ userStore.memberProgress.currentLevel.icon }} {{ userStore.memberProgress.currentLevel.name }}
          </span>
          <span v-if="userStore.memberProgress.nextLevel" class="next-level">
            距离 {{ userStore.memberProgress.nextLevel.name }} 还需 ¥{{ userStore.memberProgress.amountToNext.toFixed(2) }}
          </span>
          <span v-else class="next-level max-level">
            已达最高等级
          </span>
        </div>
        <el-progress
          :percentage="userStore.memberProgress.progress"
          :color="userStore.memberProgress.currentLevel.color"
          :stroke-width="12"
          :show-text="false"
        />
        <div class="progress-labels">
          <span>¥{{ userStore.memberProgress.currentLevel.min_spent }}</span>
          <span v-if="userStore.memberProgress.nextLevel">
            ¥{{ userStore.memberProgress.nextLevel.min_spent }}
          </span>
        </div>
      </div>

      <div class="member-benefits-section" v-if="userStore.isLoggedIn">
        <h3 class="section-title">会员等级与权益</h3>
        <div class="levels-grid">
          <div
            v-for="level in userStore.memberLevels"
            :key="level.level"
            :class="['level-card', { active: userStore.memberLevel?.level >= level.level, current: userStore.memberLevel?.level === level.level }]"
          >
            <div class="level-icon" :style="{ background: level.gradient }">
              {{ level.icon }}
            </div>
            <div class="level-name">{{ level.name }}</div>
            <div class="level-discount">{{ Math.round(level.discount * 10) }}折</div>
            <div class="level-threshold">满¥{{ level.min_spent }}</div>
            <div class="level-benefits">
              <div v-for="(benefit, idx) in level.benefits" :key="idx" class="benefit-item">
                <el-icon :size="14" color="#10b981"><CircleCheck /></el-icon>
                <span>{{ benefit }}</span>
              </div>
            </div>
          </div>
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
        <router-link to="/notifications" class="link-item notification-link">
          <el-icon :size="24"><Bell /></el-icon>
          <span>消息通知</span>
          <el-badge v-if="unreadCount > 0" :value="unreadCount" :max="99" class="notification-badge" />
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
import { ref, onMounted } from 'vue';
import { Document, Location, ShoppingCart, Wallet, ArrowRight, Bell, CircleCheck } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { useGiftCardStore } from '@/stores/giftCard';
import { notificationsApi } from '@/api';

const userStore = useUserStore();
const giftCardStore = useGiftCardStore();
const unreadCount = ref(0);

onMounted(async () => {
  await userStore.fetchUser();
  await giftCardStore.fetchMyCards();
  await loadUnreadCount();
});

async function loadUnreadCount() {
  try {
    const res = await notificationsApi.getUnreadCount();
    unreadCount.value = res.unread_count || 0;
  } catch (e) {
    unreadCount.value = 0;
  }
}
</script>

<style scoped>
.profile-card { max-width: 800px; }
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.profile-info h2 { font-size: 22px; margin: 0; }
.profile-info p { margin: 0 0 4px; color: #64748b; }
.total-spent {
  font-size: 14px;
  color: #475569;
}
.total-spent strong {
  color: #ef4444;
  font-size: 16px;
}
.member-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.member-icon { font-size: 14px; }

.member-progress-section {
  margin-top: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.current-level {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}
.next-level {
  font-size: 13px;
  color: #64748b;
}
.next-level.max-level {
  color: #10b981;
  font-weight: 500;
}
.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.member-benefits-section {
  margin-top: 24px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #1e293b;
}
.levels-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.level-card {
  padding: 20px 16px;
  background: #f8fafc;
  border-radius: 12px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s;
  opacity: 0.5;
}
.level-card.active {
  opacity: 1;
}
.level-card.current {
  border-color: #6366f1;
  background: #eef2ff;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
}
.level-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.level-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}
.level-discount {
  font-size: 20px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 4px;
}
.level-threshold {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 12px;
}
.level-benefits {
  text-align: left;
}
.benefit-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #475569;
  margin-bottom: 6px;
}

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
  grid-template-columns: repeat(5, 1fr);
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
  position: relative;
}
.link-item:hover {
  background: #eef2ff;
  color: #6366f1;
}
.notification-link {
  position: relative;
}
.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}
@media (max-width: 768px) {
  .levels-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .quick-links { grid-template-columns: repeat(3, 1fr); }
  .balance-value { font-size: 24px; }
  .name-row { flex-direction: column; align-items: flex-start; }
  .member-badge { margin-top: 4px; }
  .levels-grid { grid-template-columns: 1fr; }
}
</style>
