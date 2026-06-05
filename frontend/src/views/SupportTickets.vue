<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">我的工单</h1>
      <el-button type="primary" @click="goToCreate">
        <el-icon><Edit /></el-icon>
        提交新工单
      </el-button>
    </div>

    <div class="filter-bar">
      <div class="filter-tabs">
        <el-radio-group v-model="statusFilter" @change="load">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="open">
            <el-icon><Clock /></el-icon>
            待处理
          </el-radio-button>
          <el-radio-button value="replied">
            <el-icon><ChatLineRound /></el-icon>
            已回复
          </el-radio-button>
          <el-radio-button value="closed">
            <el-icon><CircleCheck /></el-icon>
            已关闭
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-category">
        <el-select
          v-model="categoryFilter"
          placeholder="问题分类"
          style="width: 160px"
          clearable
          @change="load"
        >
          <el-option
            v-for="cat in categories"
            :key="cat.value"
            :label="cat.label"
            :value="cat.value"
          />
        </el-select>
      </div>
    </div>

    <div v-loading="loading" class="tickets-list">
      <template v-if="!loading">
        <div
          v-for="ticket in tickets"
          :key="ticket.id"
          class="ticket-card"
          @click="goToDetail(ticket.id)"
        >
          <div class="ticket-header">
            <div class="ticket-id">#{{ ticket.id }}</div>
            <el-tag
              :type="getStatusType(ticket.status)"
              effect="light"
              size="small"
            >
              {{ ticket.status_label }}
            </el-tag>
          </div>
          <h3 class="ticket-subject">{{ ticket.subject }}</h3>
          <p class="ticket-description">{{ truncate(ticket.description, 100) }}</p>
          <div class="ticket-footer">
            <div class="ticket-meta">
              <span class="meta-item">
                <el-icon :size="14"><FolderOpened /></el-icon>
                {{ ticket.category_label }}
              </span>
              <span class="meta-item">
                <el-icon :size="14"><Timer /></el-icon>
                {{ formatTime(ticket.created_at) }}
              </span>
              <span
                v-if="ticket.closed_at"
                class="meta-item"
              >
                <el-icon :size="14"><CircleCheck /></el-icon>
                {{ formatTime(ticket.closed_at) }} 关闭
              </span>
            </div>
            <el-button type="primary" text>
              查看详情
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
        <el-empty v-if="!tickets.length" description="暂无工单">
          <el-button type="primary" @click="goToCreate">提交第一个工单</el-button>
        </el-empty>
      </template>
    </div>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="10"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Edit,
  Clock,
  ChatLineRound,
  CircleCheck,
  FolderOpened,
  Timer,
  ArrowRight
} from '@element-plus/icons-vue';
import { ticketsApi } from '@/api';

const router = useRouter();

const loading = ref(true);
const tickets = ref([]);
const total = ref(0);
const page = ref(1);
const statusFilter = ref('');
const categoryFilter = ref('');
const categories = ref([]);

const categoryMap = {
  product: '商品问题',
  order: '订单问题',
  payment: '支付问题',
  account: '账户问题',
  shipping: '物流问题',
  other: '其他问题'
};

onMounted(async () => {
  await loadCategories();
  await load();
});

async function loadCategories() {
  try {
    categories.value = await ticketsApi.getCategories();
  } catch (e) {
    categories.value = Object.entries(categoryMap).map(([value, label]) => ({ value, label }));
  }
}

async function load() {
  loading.value = true;
  try {
    const res = await ticketsApi.list({
      page: page.value,
      limit: 10,
      status: statusFilter.value || undefined,
      category: categoryFilter.value || undefined
    });
    tickets.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function getStatusType(status) {
  const map = {
    open: 'warning',
    replied: 'success',
    closed: 'info'
  };
  return map[status] || 'info';
}

function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
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

function goToCreate() {
  router.push('/support');
}

function goToDetail(id) {
  router.push(`/support/ticket/${id}`);
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ticket-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.ticket-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ticket-id {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.ticket-subject {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px;
  line-height: 1.5;
}

.ticket-description {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 16px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ticket-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.ticket-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #94a3b8;
}

.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 600px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .ticket-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .ticket-meta {
    gap: 12px;
  }
}
</style>
