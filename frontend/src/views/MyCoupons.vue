<template>
  <div class="page-container">
    <h1 class="page-title">我的优惠券</h1>

    <div class="stats-row">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        :class="['stat-item', { active: activeTab === tab.value }]"
        @click="switchTab(tab.value)"
      >
        <span class="stat-count">{{ stats[tab.value] || 0 }}</span>
        <span class="stat-label">{{ tab.label }}</span>
      </div>
    </div>

    <div v-loading="loading" class="coupon-list">
      <div
        v-for="claim in filteredCoupons"
        :key="claim.id"
        :class="['coupon-item', `status-${claim.status}`]"
      >
        <div class="coupon-left">
          <div class="coupon-amount">
            <span class="currency" v-if="claim.Coupon.type === 'fixed'">¥</span>
            <span class="value">{{ formatAmount(claim.Coupon) }}</span>
            <span class="unit" v-if="claim.Coupon.type === 'percent'">%</span>
          </div>
          <div class="coupon-condition">
            满{{ claim.Coupon.min_amount }}元可用
          </div>
        </div>
        <div class="coupon-divider">
          <div class="circle top"></div>
          <div class="circle bottom"></div>
        </div>
        <div class="coupon-right">
          <div class="coupon-header">
            <div class="coupon-name">{{ claim.Coupon.name }}</div>
            <el-tag :type="getStatusType(claim.status)" size="small" effect="light">
              {{ getStatusLabel(claim.status) }}
            </el-tag>
          </div>
          <div class="coupon-desc">{{ claim.Coupon.description }}</div>
          <div class="coupon-code">券码：{{ claim.code }}</div>
          <div class="coupon-expire">
            <el-icon :size="14"><Clock /></el-icon>
            <span>有效期至 {{ formatDate(claim.expire_at) }}</span>
          </div>
          <div class="coupon-footer">
            <el-button
              v-if="claim.status === 'unused'"
              type="danger"
              size="small"
              class="use-btn"
              @click="goToUse"
            >
              立即使用
            </el-button>
            <span v-else-if="claim.status === 'used'" class="used-info">
              <el-icon :size="14" color="#10b981"><CircleCheck /></el-icon>
              于 {{ formatDate(claim.used_at) }} 使用
            </span>
            <span v-else class="expired-info">
              <el-icon :size="14" color="#94a3b8"><Warning /></el-icon>
              已过期
            </span>
          </div>
        </div>
        <div v-if="claim.status !== 'unused'" class="coupon-overlay">
          <el-icon v-if="claim.status === 'used'" :size="80" color="#10b981"><CircleCheck /></el-icon>
          <el-icon v-else :size="80" color="#94a3b8"><Close /></el-icon>
        </div>
      </div>

      <el-empty v-if="!loading && filteredCoupons.length === 0" :description="getEmptyDesc()" />
    </div>

    <div class="bottom-action">
      <el-button type="primary" @click="goToCouponCenter">
        <el-icon><Discount /></el-icon>
        去领券中心领取更多
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Clock, CircleCheck, Warning, Close, Discount } from '@element-plus/icons-vue';
import { couponApi } from '@/api';

const router = useRouter();
const loading = ref(false);
const coupons = ref([]);
const stats = ref({ unused: 0, used: 0, expired: 0 });
const activeTab = ref('unused');

const tabs = [
  { label: '未使用', value: 'unused' },
  { label: '已使用', value: 'used' },
  { label: '已过期', value: 'expired' }
];

const filteredCoupons = computed(() => {
  return coupons.value.filter((c) => c.status === activeTab.value);
});

onMounted(() => {
  loadMyCoupons();
});

async function loadMyCoupons() {
  loading.value = true;
  try {
    const res = await couponApi.getMyList();
    coupons.value = res.data?.list || [];
    stats.value = res.data?.stats || { unused: 0, used: 0, expired: 0 };
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function switchTab(tab) {
  activeTab.value = tab;
}

function formatAmount(coupon) {
  if (coupon.type === 'fixed') {
    return parseFloat(coupon.amount).toFixed(0);
  }
  return parseFloat(coupon.amount).toFixed(0);
}

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getStatusType(status) {
  const map = {
    unused: 'warning',
    used: 'success',
    expired: 'info'
  };
  return map[status] || 'info';
}

function getStatusLabel(status) {
  const map = {
    unused: '未使用',
    used: '已使用',
    expired: '已过期'
  };
  return map[status] || status;
}

function getEmptyDesc() {
  const map = {
    unused: '暂无可用优惠券',
    used: '暂无已使用的优惠券',
    expired: '暂无已过期的优惠券'
  };
  return map[activeTab.value] || '暂无优惠券';
}

function goToUse() {
  router.push('/products');
}

function goToCouponCenter() {
  router.push('/coupon-center');
}
</script>

<style scoped>
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.stat-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.stat-item:hover {
  background: #f8fafc;
}
.stat-item.active {
  background: #fef2f2;
}
.stat-item.active .stat-count {
  color: #ef4444;
}
.stat-count {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 14px;
  color: #64748b;
}
.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.coupon-item {
  display: flex;
  background: linear-gradient(135deg, #fff1f0 0%, #fef2f2 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.coupon-item.status-used {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}
.coupon-item.status-expired {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
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
.coupon-item.status-used .coupon-amount {
  color: #10b981;
}
.coupon-item.status-expired .coupon-amount {
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
  min-width: 0;
}
.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.coupon-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
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
.coupon-code {
  font-size: 12px;
  color: #6366f1;
  margin-bottom: 6px;
  font-family: monospace;
}
.coupon-expire {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 12px;
}
.coupon-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.use-btn {
  border-radius: 20px;
}
.used-info,
.expired-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
}
.coupon-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  pointer-events: none;
  opacity: 0.8;
}
.bottom-action {
  margin-top: 32px;
  text-align: center;
}
@media (max-width: 768px) {
  .coupon-left {
    width: 120px;
    padding: 20px 12px;
  }
  .value {
    font-size: 36px;
  }
  .stats-row {
    flex-direction: column;
  }
}
</style>
