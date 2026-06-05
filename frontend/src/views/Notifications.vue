<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">消息通知</h1>
      <div class="header-actions">
        <el-button type="primary" plain size="small" @click="handleMarkAllRead" :disabled="unreadCount === 0">
          全部已读
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="typeFilter" @change="load">
        <el-radio-button value="">全部消息</el-radio-button>
        <el-radio-button value="stock_arrival">到货通知</el-radio-button>
        <el-radio-button value="order">订单消息</el-radio-button>
        <el-radio-button value="system">系统消息</el-radio-button>
      </el-radio-group>
    </div>

    <div v-loading="loading" class="notifications-list">
      <template v-if="!loading">
        <div
          v-for="item in notifications"
          :key="item.id"
          class="notification-card"
          :class="{ unread: !item.is_read }"
          @click="handleNotificationClick(item)"
        >
          <div class="notification-icon" :class="item.type">
            <el-icon v-if="item.type === 'stock_arrival'" :size="24"><BellFilled /></el-icon>
            <el-icon v-else-if="item.type === 'order'" :size="24"><Document /></el-icon>
            <el-icon v-else :size="24"><InfoFilled /></el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <span class="notification-title">{{ item.title }}</span>
              <span class="notification-time">{{ formatTime(item.created_at) }}</span>
            </div>
            <p class="notification-body">{{ item.content }}</p>
            <div v-if="item.type === 'stock_arrival' && item.extra" class="notification-product">
              <img :src="item.extra.product_image || placeholderImg" :alt="item.extra.product_name" />
              <div class="product-info">
                <div class="product-name">{{ item.extra.product_name }}</div>
                <div class="product-price">¥{{ item.extra.product_price }}</div>
              </div>
              <el-button type="primary" size="small" @click.stop="goToProduct(item)">
                立即查看
              </el-button>
            </div>
          </div>
          <div class="notification-actions">
            <el-button
              v-if="!item.is_read"
              type="primary"
              plain
              size="small"
              @click.stop="handleMarkRead(item.id)"
            >
              标记已读
            </el-button>
            <el-button
              type="danger"
              plain
              size="small"
              @click.stop="handleDelete(item.id)"
            >
              删除
            </el-button>
          </div>
        </div>
        <el-empty v-if="!notifications.length" description="暂无消息" />
      </template>
    </div>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="10"
        :total="total"
        layout="prev, pager, next"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { BellFilled, Document, InfoFilled } from '@element-plus/icons-vue';
import { notificationsApi } from '@/api';
import { useConfirm } from '@/composables/useConfirm';

const router = useRouter();
const confirm = useConfirm();

const loading = ref(true);
const notifications = ref([]);
const total = ref(0);
const page = ref(1);
const typeFilter = ref('');
const unreadCount = ref(0);
const placeholderImg = '/images/products/placeholder-80x80.png';

const typeText = {
  stock_arrival: '到货通知',
  order: '订单消息',
  system: '系统消息',
  promotion: '活动消息'
};

onMounted(async () => {
  await load();
  await loadUnreadCount();
});

async function load() {
  loading.value = true;
  try {
    const res = await notificationsApi.list({
      page: page.value,
      limit: 10,
      type: typeFilter.value || undefined
    });
    notifications.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

async function loadUnreadCount() {
  try {
    const res = await notificationsApi.getUnreadCount();
    unreadCount.value = res.unread_count || 0;
  } catch (e) {
    unreadCount.value = 0;
  }
}

async function handleMarkRead(id) {
  try {
    await notificationsApi.markRead(id);
    ElMessage.success('已标记为已读');
    notifications.value = notifications.value.map((item) =>
      item.id === id ? { ...item, is_read: true } : item
    );
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  } catch (e) {
    // message shown by interceptor
  }
}

async function handleMarkAllRead() {
  try {
    await notificationsApi.markAllRead(typeFilter.value || undefined);
    ElMessage.success('已全部标记为已读');
    notifications.value = notifications.value.map((item) => ({ ...item, is_read: true }));
    unreadCount.value = 0;
  } catch (e) {
    // message shown by interceptor
  }
}

async function handleDelete(id) {
  const ok = await confirm({
    title: '删除消息',
    message: '确定要删除这条消息吗？',
    type: 'warning'
  });
  if (!ok) return;

  try {
    await notificationsApi.remove(id);
    ElMessage.success('已删除');
    load();
    loadUnreadCount();
  } catch (e) {
    // message shown by interceptor
  }
}

function handleNotificationClick(item) {
  if (!item.is_read) {
    handleMarkRead(item.id);
  }
  if (item.related_type === 'product' && item.related_id) {
    goToProduct(item);
  }
}

function goToProduct(item) {
  if (item.related_id) {
    router.push(`/product/${item.related_id}`);
  }
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN');
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.filter-bar {
  margin-bottom: 24px;
}
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.notification-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}
.notification-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.notification-card.unread {
  background: #f0f9ff;
  border-left-color: #3b82f6;
}
.notification-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.notification-icon.stock_arrival {
  background: #fef3c7;
  color: #f59e0b;
}
.notification-icon.order {
  background: #dbeafe;
  color: #3b82f6;
}
.notification-icon.system {
  background: #e0e7ff;
  color: #6366f1;
}
.notification-icon.promotion {
  background: #fce7f3;
  color: #ec4899;
}
.notification-content {
  flex: 1;
  min-width: 0;
}
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.notification-title {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}
.notification-time {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}
.notification-body {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}
.notification-product {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}
.notification-product img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}
.product-info {
  flex: 1;
  min-width: 0;
}
.product-name {
  font-size: 13px;
  color: #334155;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.product-price {
  font-size: 14px;
  color: #ef4444;
  font-weight: 600;
}
.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
@media (max-width: 600px) {
  .notification-card {
    flex-direction: column;
  }
  .notification-actions {
    flex-direction: row;
  }
}
</style>
