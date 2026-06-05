<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <h1 class="page-title">工单详情</h1>
      </div>
      <div class="header-right">
        <el-button
          v-if="ticket && ticket.status !== 'closed'"
          type="danger"
          plain
          @click="handleClose"
        >
          <el-icon><CircleClose /></el-icon>
          关闭工单
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="ticket-detail">
      <template v-if="ticket">
        <el-card class="ticket-info-card">
          <div class="ticket-info-header">
            <div class="ticket-id">#{{ ticket.id }}</div>
            <el-tag
              :type="getStatusType(ticket.status)"
              effect="light"
              size="large"
            >
              {{ ticket.status_label }}
            </el-tag>
          </div>
          <h2 class="ticket-subject">{{ ticket.subject }}</h2>
          <div class="ticket-meta">
            <span class="meta-item">
              <el-icon :size="16"><FolderOpened /></el-icon>
              {{ ticket.category_label }}
            </span>
            <span class="meta-item">
              <el-icon :size="16"><Timer /></el-icon>
              {{ formatFullTime(ticket.created_at) }}
            </span>
            <span class="meta-item">
              <el-icon :size="16"><Flag /></el-icon>
              优先级：
              <el-tag
                :type="getPriorityType(ticket.priority)"
                size="small"
              >
                {{ getPriorityLabel(ticket.priority) }}
              </el-tag>
            </span>
          </div>
        </el-card>

        <div class="timeline-section">
          <h3 class="section-title">
            <el-icon :size="20" color="#6366f1"><ChatDotRound /></el-icon>
            沟通记录
          </h3>
          <div class="timeline">
            <div
              v-for="(reply, index) in ticket.replies"
              :key="reply.id"
              class="timeline-item"
              :class="{ 'is-staff': reply.is_staff }"
            >
              <div class="timeline-dot">
                <el-icon v-if="reply.is_staff" :size="18"><Service /></el-icon>
                <el-icon v-else :size="18"><User /></el-icon>
              </div>
              <div class="timeline-line" v-if="index < ticket.replies.length - 1"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="author">
                    <el-tag
                      v-if="reply.is_staff"
                      type="primary"
                      effect="light"
                      size="small"
                    >
                      官方客服
                    </el-tag>
                    <span>{{ reply.author_name }}</span>
                  </span>
                  <span class="time">{{ formatFullTime(reply.created_at) }}</span>
                </div>
                <div class="timeline-body">
                  <p
                    v-for="(paragraph, pIndex) in formatContent(reply.content)"
                    :key="pIndex"
                    class="content-paragraph"
                  >
                    {{ paragraph }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-card v-if="ticket.status !== 'closed'" class="reply-card">
          <template #header>
            <div class="reply-header">
              <el-icon :size="20" color="#6366f1"><Edit /></el-icon>
              <span>补充回复</span>
            </div>
          </template>
          <el-form>
            <el-form-item>
              <el-input
                v-model="replyContent"
                type="textarea"
                :rows="5"
                placeholder="请输入您的补充说明，我们会尽快回复您..."
                maxlength="5000"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                @click="handleReply"
                :loading="replying"
                :disabled="!replyContent.trim()"
              >
                <el-icon><Promotion /></el-icon>
                提交回复
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-else class="closed-card">
          <div class="closed-content">
            <el-icon :size="48" color="#94a3b8"><CircleCheck /></el-icon>
            <h3>工单已关闭</h3>
            <p>该工单已于 {{ formatFullTime(ticket.closed_at) }} 关闭</p>
            <el-button type="primary" @click="goToCreate">提交新工单</el-button>
          </div>
        </el-card>
      </template>

      <el-empty v-if="!loading && !ticket" description="工单不存在" />
    </div>

    <el-dialog
      v-model="closeDialogVisible"
      title="关闭工单"
      width="400px"
    >
      <p>确定要关闭这个工单吗？关闭后将无法继续回复。</p>
      <template #footer>
        <el-button @click="closeDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmClose" :loading="closing">确认关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  CircleClose,
  FolderOpened,
  Timer,
  Flag,
  ChatDotRound,
  Service,
  User,
  Edit,
  Promotion,
  CircleCheck
} from '@element-plus/icons-vue';
import { ticketsApi } from '@/api';
import { useConfirm } from '@/composables/useConfirm';

const route = useRoute();
const router = useRouter();
const confirm = useConfirm();

const loading = ref(true);
const replying = ref(false);
const closing = ref(false);
const ticket = ref(null);
const replyContent = ref('');
const closeDialogVisible = ref(false);

onMounted(loadDetail);

async function loadDetail() {
  loading.value = true;
  try {
    const id = route.params.id;
    ticket.value = await ticketsApi.detail(id);
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function scrollToBottom() {
  const timeline = document.querySelector('.timeline');
  if (timeline) {
    timeline.scrollTop = timeline.scrollHeight;
  }
}

function formatContent(content) {
  if (!content) return [];
  return content.split(/\n+/).filter(p => p.trim());
}

function getStatusType(status) {
  const map = {
    open: 'warning',
    replied: 'success',
    closed: 'info'
  };
  return map[status] || 'info';
}

function getPriorityType(priority) {
  const map = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  };
  return map[priority] || 'info';
}

function getPriorityLabel(priority) {
  const map = {
    low: '低',
    medium: '中',
    high: '高'
  };
  return map[priority] || '中';
}

function formatFullTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function handleReply() {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容');
    return;
  }
  replying.value = true;
  try {
    const reply = await ticketsApi.reply(ticket.value.id, replyContent.value.trim());
    ticket.value.replies.push({
      ...reply,
      author_name: reply.author_name || '我'
    });
    replyContent.value = '';
    ElMessage.success('回复成功');
    await nextTick();
    scrollToBottom();
  } finally {
    replying.value = false;
  }
}

async function handleClose() {
  closeDialogVisible.value = true;
}

async function confirmClose() {
  closing.value = true;
  try {
    await ticketsApi.close(ticket.value.id);
    ticket.value.status = 'closed';
    ticket.value.status_label = '已关闭';
    ticket.value.closed_at = new Date().toISOString();
    ElMessage.success('工单已关闭');
    closeDialogVisible.value = false;
  } finally {
    closing.value = false;
  }
}

function goBack() {
  router.push('/support/tickets');
}

function goToCreate() {
  router.push('/support');
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.ticket-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ticket-info-card {
  margin-bottom: 8px;
}

.ticket-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ticket-id {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 16px;
  color: #64748b;
  font-weight: 600;
}

.ticket-subject {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px;
  line-height: 1.5;
}

.ticket-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #64748b;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 24px;
  color: #1e293b;
}

.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline-item {
  position: relative;
  padding-bottom: 32px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -40px;
  top: 4px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  z-index: 1;
}

.timeline-item.is-staff .timeline-dot {
  background: #e0e7ff;
  color: #6366f1;
}

.timeline-line {
  position: absolute;
  left: -25px;
  top: 36px;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
}

.timeline-content {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.timeline-item.is-staff .timeline-content {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  border-left: 4px solid #3b82f6;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e293b;
}

.time {
  font-size: 13px;
  color: #94a3b8;
}

.content-paragraph {
  margin: 0 0 12px;
  color: #334155;
  font-size: 14px;
  line-height: 1.8;
}

.content-paragraph:last-child {
  margin-bottom: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.closed-card {
  text-align: center;
}

.closed-content {
  padding: 40px 20px;
}

.closed-content h3 {
  margin: 16px 0 8px;
  font-size: 20px;
  color: #1e293b;
}

.closed-content p {
  margin: 0 0 24px;
  color: #64748b;
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .timeline {
    padding-left: 32px;
  }

  .timeline-dot {
    left: -32px;
    width: 28px;
    height: 28px;
  }

  .timeline-line {
    left: -19px;
  }

  .ticket-meta {
    gap: 12px;
  }
}
</style>
