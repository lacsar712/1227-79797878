<template>
  <div class="page-container" v-loading="loading">
    <template v-if="!loading && groupBuy">
      <div class="group-detail">
        <div class="status-banner" :class="statusClass">
          <div class="status-icon">
            <el-icon v-if="groupBuy.status === 'pending'"><Clock /></el-icon>
            <el-icon v-else-if="groupBuy.status === 'success'"><CircleCheck /></el-icon>
            <el-icon v-else><CircleClose /></el-icon>
          </div>
          <div class="status-text">
            <h2>{{ statusText }}</h2>
            <p v-if="groupBuy.status === 'pending'">
              还差 <span class="highlight">{{ needMore }}</span> 人成团，剩余时间
              <span class="highlight">{{ countdown }}</span>
            </p>
            <p v-else-if="groupBuy.status === 'success'">
              拼团成功！请前往订单页面完成支付
            </p>
            <p v-else>
              拼团已{{ groupBuy.status === 'expired' ? '过期' : '失败' }}，库存已释放
            </p>
          </div>
        </div>

        <div class="product-card">
          <img :src="groupBuy.Product.image" :alt="groupBuy.Product.name" class="product-image" />
          <div class="product-info">
            <h3>{{ groupBuy.Product.name }}</h3>
            <p class="product-desc">{{ groupBuy.Product.description }}</p>
            <div class="product-price">
              <span class="group-price">¥{{ groupBuy.group_price }}</span>
              <span class="orig-price">¥{{ groupBuy.Product.price }}</span>
              <span class="group-tag">{{ groupBuy.min_people }}人团</span>
            </div>
          </div>
        </div>

        <div class="members-card">
          <div class="members-header">
            <h3>拼团成员</h3>
            <span class="people-count">
              <span class="current">{{ groupBuy.current_people }}</span>
              <span class="separator">/</span>
              <span class="total">{{ groupBuy.min_people }}</span>
              人
            </span>
          </div>
          <div class="members-list">
            <div
              v-for="member in groupBuy.GroupBuyMembers"
              :key="member.id"
              class="member-item"
            >
              <el-avatar :size="48" :src="member.User?.avatar">
                {{ member.User?.username?.charAt(0) || 'U' }}
              </el-avatar>
              <div class="member-info">
                <span class="member-name">
                  {{ member.User?.username || '匿名用户' }}
                  <el-tag v-if="member.is_leader" type="success" size="small" effect="light">
                    团长
                  </el-tag>
                </span>
                <span class="member-time">{{ formatTime(member.joined_at) }} 加入</span>
              </div>
              <el-tag
                v-if="member.status === 'order_created' || member.status === 'paid'"
                type="success"
                size="small"
              >
                已下单
              </el-tag>
              <el-tag v-else-if="member.status === 'cancelled'" type="info" size="small">
                已取消
              </el-tag>
              <el-tag v-else type="warning" size="small">
                待下单
              </el-tag>
            </div>
            <div
              v-for="i in needMore"
              :key="'empty-' + i"
              class="member-item empty"
            >
              <el-avatar :size="48" class="empty-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="member-info">
                <span class="member-name">虚位以待</span>
                <span class="member-time">等待好友加入</span>
              </div>
            </div>
          </div>
        </div>

        <div class="action-bar" v-if="groupBuy.status === 'pending'">
          <div class="share-section">
            <el-button type="primary" plain @click="copyShareLink">
              <el-icon><Share /></el-icon>
              复制分享链接
            </el-button>
            <span class="share-tip">分享给好友，一起拼团更优惠</span>
          </div>
          <div class="join-section" v-if="!isJoined && !isLeader">
            <el-button
              type="success"
              size="large"
              @click="openJoinDialog"
              :disabled="!userStore.isLoggedIn"
            >
              <el-icon><UserFilled /></el-icon>
              立即参团 ¥{{ groupBuy.group_price }}
            </el-button>
            <p v-if="!userStore.isLoggedIn" class="login-tip">
              请先 <router-link to="/login">登录</router-link> 后参团
            </p>
          </div>
          <div class="joined-section" v-else>
            <el-tag type="success" size="large">
              <el-icon><CircleCheck /></el-icon>
              {{ isLeader ? '您是团长' : '您已参团' }}
            </el-tag>
          </div>
        </div>

        <div class="action-bar success-bar" v-else-if="groupBuy.status === 'success'">
          <el-button type="primary" size="large" @click="goToOrder">
            去支付订单
          </el-button>
        </div>
      </div>
    </template>
    <el-empty v-else-if="!loading && !groupBuy" description="拼团不存在或已结束" />

    <el-dialog v-model="joinDialogVisible" title="加入拼团" width="500px">
      <el-form :model="joinForm" label-width="100px">
        <el-form-item label="拼团商品">
          <div class="form-product">
            <img :src="groupBuy.Product.image" :alt="groupBuy.Product.name" class="product-thumb" />
            <div>
              <div class="product-name">{{ groupBuy.Product.name }}</div>
              <div class="product-price">
                <span class="group-price">¥{{ groupBuy.group_price }}</span>
                <span class="orig-price">¥{{ groupBuy.Product.price }}</span>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="成团进度">
          <span>已 {{ groupBuy.current_people }} 人，还差 {{ needMore }} 人</span>
        </el-form-item>
        <el-form-item label="收货地址" prop="address_id">
          <el-select v-model="joinForm.address_id" placeholder="请选择收货地址" style="width: 100%">
            <el-option
              v-for="addr in addresses"
              :key="addr.id"
              :label="`${addr.receiver} ${addr.phone} ${addr.province}${addr.city}${addr.district}${addr.detail}`"
              :value="addr.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式" prop="payment_method">
          <el-radio-group v-model="joinForm.payment_method">
            <el-radio value="wechat">微信支付</el-radio>
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="bank">银行卡</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="joinDialogVisible = false">取消</el-button>
        <el-button type="success" @click="joinGroupBuy" :loading="submitting">
          立即参团
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Clock,
  CircleCheck,
  CircleClose,
  User,
  UserFilled,
  Share
} from '@element-plus/icons-vue';
import { groupBuyApi, addressesApi } from '@/api';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const groupBuy = ref(null);
const loading = ref(true);
const joinDialogVisible = ref(false);
const submitting = ref(false);
const addresses = ref([]);
const joinForm = ref({
  address_id: null,
  payment_method: 'wechat'
});
const countdown = ref('');
let countdownTimer = null;
let refreshTimer = null;

const statusClass = computed(() => {
  if (!groupBuy.value) return '';
  return {
    pending: 'status-pending',
    success: 'status-success',
    expired: 'status-expired',
    failed: 'status-failed'
  }[groupBuy.value.status];
});

const statusText = computed(() => {
  if (!groupBuy.value) return '';
  return {
    pending: '拼团进行中',
    success: '拼团成功',
    expired: '拼团已过期',
    failed: '拼团失败'
  }[groupBuy.value.status];
});

const needMore = computed(() => {
  if (!groupBuy.value) return 0;
  return Math.max(0, groupBuy.value.min_people - groupBuy.value.current_people);
});

const isLeader = computed(() => {
  if (!groupBuy.value || !userStore.user) return false;
  return groupBuy.value.leader_id === userStore.user.id;
});

const isJoined = computed(() => {
  if (!groupBuy.value || !userStore.user) return false;
  return groupBuy.value.GroupBuyMembers?.some((m) => m.user_id === userStore.user.id);
});

onMounted(async () => {
  await fetchGroupDetail();
  startCountdown();
  startAutoRefresh();
});

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
  if (refreshTimer) clearInterval(refreshTimer);
});

async function fetchGroupDetail() {
  try {
    groupBuy.value = await groupBuyApi.detail(route.params.id);
    updateCountdown();
  } catch (e) {
    groupBuy.value = null;
  } finally {
    loading.value = false;
  }
}

function updateCountdown() {
  if (!groupBuy.value || groupBuy.value.status !== 'pending') return;

  const now = new Date().getTime();
  const expire = new Date(groupBuy.value.expire_at).getTime();
  const diff = expire - now;

  if (diff <= 0) {
    countdown.value = '00:00:00';
    fetchGroupDetail();
    return;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  countdown.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startCountdown() {
  countdownTimer = setInterval(() => {
    updateCountdown();
  }, 1000);
}

function startAutoRefresh() {
  refreshTimer = setInterval(() => {
    if (groupBuy.value?.status === 'pending') {
      fetchGroupDetail();
    }
  }, 10000);
}

function formatTime(time) {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

async function copyShareLink() {
  const url = `${window.location.origin}/group/${groupBuy.value.id}`;
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success('分享链接已复制到剪贴板');
  } catch (e) {
    ElMessage.success(`分享链接：${url}`);
  }
}

async function openJoinDialog() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  try {
    addresses.value = await addressesApi.list();
    if (addresses.value.length > 0) {
      const defaultAddr = addresses.value.find((a) => a.is_default) || addresses.value[0];
      joinForm.value.address_id = defaultAddr.id;
    }
    joinDialogVisible.value = true;
  } catch (e) {
    ElMessage.error('获取收货地址失败');
  }
}

async function joinGroupBuy() {
  if (!joinForm.value.address_id) {
    ElMessage.warning('请选择收货地址');
    return;
  }
  submitting.value = true;
  try {
    const result = await groupBuyApi.join(route.params.id, {
      address_id: joinForm.value.address_id,
      payment_method: joinForm.value.payment_method
    });
    ElMessage.success('参团成功！');
    joinDialogVisible.value = false;
    groupBuy.value = result.group_buy;
  } catch (e) {
    // message shown by interceptor
  } finally {
    submitting.value = false;
  }
}

function goToOrder() {
  const myMember = groupBuy.value.GroupBuyMembers?.find((m) => m.user_id === userStore.user?.id);
  if (myMember?.order_id) {
    router.push(`/order/${myMember.order_id}`);
  } else {
    router.push('/orders');
  }
}
</script>

<style scoped>
.group-detail {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 0;
}
.status-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.status-pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
}
.status-success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 1px solid #86efac;
}
.status-expired,
.status-failed {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid #d1d5db;
}
.status-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.status-pending .status-icon {
  background: #fff;
  color: #f59e0b;
}
.status-success .status-icon {
  background: #fff;
  color: #10b981;
}
.status-expired .status-icon,
.status-failed .status-icon {
  background: #fff;
  color: #6b7280;
}
.status-text h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}
.status-text p {
  margin: 0;
  color: #64748b;
}
.highlight {
  color: #ef4444;
  font-weight: 600;
}
.product-card {
  display: flex;
  gap: 16px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.product-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.product-info {
  flex: 1;
}
.product-info h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
}
.product-desc {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.5;
}
.product-price {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.group-price {
  font-size: 28px;
  font-weight: 700;
  color: #ef4444;
}
.orig-price {
  font-size: 16px;
  color: #94a3b8;
  text-decoration: line-through;
}
.group-tag {
  background: #ef4444;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.members-card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.members-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.people-count {
  color: #64748b;
  font-size: 14px;
}
.people-count .current {
  color: #ef4444;
  font-size: 24px;
  font-weight: 700;
}
.people-count .separator {
  margin: 0 4px;
}
.people-count .total {
  font-weight: 600;
}
.members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}
.member-item.empty {
  opacity: 0.6;
  border: 1px dashed #cbd5e1;
  background: #fff;
}
.empty-avatar {
  background: #f1f5f9;
  color: #94a3b8;
}
.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.member-name {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}
.member-time {
  font-size: 12px;
  color: #94a3b8;
}
.action-bar {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.success-bar {
  text-align: center;
}
.share-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.share-tip {
  color: #64748b;
  font-size: 14px;
}
.join-section {
  text-align: center;
}
.login-tip {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}
.joined-section {
  text-align: center;
}
.form-product {
  display: flex;
  gap: 12px;
  align-items: center;
}
.product-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}
.product-name {
  font-weight: 500;
  margin-bottom: 4px;
}
.product-price .group-price {
  font-size: 18px;
}
.product-price .orig-price {
  font-size: 14px;
  margin-left: 8px;
}
@media (max-width: 768px) {
  .product-card {
    flex-direction: column;
  }
  .product-image {
    width: 100%;
    height: 200px;
  }
}
</style>
