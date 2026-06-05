<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">优惠券领取中心</h1>
      <p class="page-subtitle">精选优惠券，先到先得</p>
    </div>

    <div v-loading="loading" class="coupon-grid">
      <div
        v-for="coupon in coupons"
        :key="coupon.id"
        :class="['coupon-card', { 'is-claimed': coupon.is_claimed, 'is-sold-out': coupon.is_sold_out }]"
      >
        <div class="coupon-left">
          <div class="coupon-amount">
            <span class="currency" v-if="coupon.type === 'fixed'">¥</span>
            <span class="value">{{ formatAmount(coupon) }}</span>
            <span class="unit" v-if="coupon.type === 'percent'">%</span>
          </div>
          <div class="coupon-condition">
            满{{ coupon.min_amount }}元可用
          </div>
        </div>
        <div class="coupon-divider">
          <div class="circle top"></div>
          <div class="circle bottom"></div>
        </div>
        <div class="coupon-right">
          <div class="coupon-name">{{ coupon.name }}</div>
          <div class="coupon-desc">{{ coupon.description }}</div>
          <div class="coupon-info">
            <el-icon :size="14" color="#64748b"><Clock /></el-icon>
            <span>{{ formatDate(coupon.start_at) }} - {{ formatDate(coupon.end_at) }}</span>
          </div>
          <div class="coupon-stock">
            剩余 {{ coupon.remaining_quantity }} / {{ coupon.total_quantity }} 张
          </div>
          <el-progress
            :percentage="getStockPercentage(coupon)"
            :stroke-width="6"
            :show-text="false"
            color="#f97316"
            class="stock-progress"
          />
          <el-button
            v-if="!coupon.is_claimed && !coupon.is_sold_out"
            type="danger"
            class="claim-btn"
            @click="handleClaim(coupon)"
          >
            立即领取
          </el-button>
          <el-button
            v-else-if="coupon.is_claimed"
            type="success"
            class="claim-btn"
            disabled
          >
            <el-icon><CircleCheck /></el-icon>
            已领取
          </el-button>
          <el-button
            v-else
            type="info"
            class="claim-btn"
            disabled
          >
            已领完
          </el-button>
        </div>
      </div>

      <el-empty v-if="!loading && coupons.length === 0" description="暂无可领取的优惠券" />
    </div>

    <el-dialog v-model="showSuccessDialog" title="领取成功" width="400px">
      <div class="success-content">
        <el-icon :size="64" color="#10b981" class="success-icon"><CircleCheck /></el-icon>
        <p class="success-text">恭喜您成功领取优惠券！</p>
        <p class="success-coupon">{{ successCoupon?.name }}</p>
        <div class="success-actions">
          <el-button @click="showSuccessDialog = false">继续领取</el-button>
          <el-button type="primary" @click="goToMyCoupons">去使用</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Clock, CircleCheck } from '@element-plus/icons-vue';
import { couponApi } from '@/api';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const coupons = ref([]);
const showSuccessDialog = ref(false);
const successCoupon = ref(null);

onMounted(() => {
  loadCoupons();
});

async function loadCoupons() {
  loading.value = true;
  try {
    const res = await couponApi.getPublicList();
    coupons.value = res.data || [];
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function formatAmount(coupon) {
  if (coupon.type === 'fixed') {
    return parseFloat(coupon.amount).toFixed(0);
  }
  return parseFloat(coupon.amount).toFixed(0);
}

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getStockPercentage(coupon) {
  return Math.round((coupon.remaining_quantity / coupon.total_quantity) * 100);
}

async function handleClaim(coupon) {
  if (!userStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: '/coupon-center' } });
    return;
  }

  try {
    const res = await couponApi.claim(coupon.id);
    coupon.is_claimed = true;
    coupon.remaining_quantity -= 1;
    successCoupon.value = coupon;
    showSuccessDialog.value = true;
    ElMessage.success('领取成功');
  } catch (e) {
    ElMessage.error(e.message || '领取失败');
  }
}

function goToMyCoupons() {
  showSuccessDialog.value = false;
  router.push('/profile/coupons');
}
</script>

<style scoped>
.page-header {
  text-align: center;
  margin-bottom: 32px;
}
.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}
.page-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}
.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}
.coupon-card {
  display: flex;
  background: linear-gradient(135deg, #fff1f0 0%, #fef2f2 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}
.coupon-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.15);
}
.coupon-card.is-claimed {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}
.coupon-card.is-sold-out {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  opacity: 0.7;
}
.coupon-left {
  width: 140px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.coupon-amount {
  display: flex;
  align-items: baseline;
  color: #ef4444;
  font-weight: 700;
}
.coupon-card.is-claimed .coupon-amount {
  color: #10b981;
}
.coupon-card.is-sold-out .coupon-amount {
  color: #94a3b8;
}
.currency {
  font-size: 18px;
}
.value {
  font-size: 48px;
  line-height: 1;
}
.unit {
  font-size: 24px;
}
.coupon-condition {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}
.coupon-divider {
  width: 2px;
  background: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.8) 4px,
    rgba(255, 255, 255, 0.8) 8px
  );
  position: relative;
}
.coupon-divider .circle {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  left: -7px;
}
.coupon-divider .circle.top {
  top: -8px;
}
.coupon-divider .circle.bottom {
  bottom: -8px;
}
.coupon-right {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}
.coupon-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.coupon-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.coupon-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}
.coupon-stock {
  font-size: 12px;
  color: #f97316;
  margin-bottom: 6px;
}
.stock-progress {
  margin-bottom: 12px;
}
.claim-btn {
  width: 100%;
  border-radius: 20px;
}
.success-content {
  text-align: center;
  padding: 16px 0;
}
.success-icon {
  margin-bottom: 16px;
}
.success-text {
  font-size: 16px;
  color: #1e293b;
  margin: 0 0 8px;
}
.success-coupon {
  font-size: 18px;
  font-weight: 600;
  color: #ef4444;
  margin: 0 0 24px;
}
.success-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
@media (max-width: 768px) {
  .coupon-grid {
    grid-template-columns: 1fr;
  }
  .coupon-left {
    width: 120px;
    padding: 20px 12px;
  }
  .value {
    font-size: 36px;
  }
}
</style>
