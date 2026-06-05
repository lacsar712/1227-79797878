<template>
  <div class="live-list-page">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">直播中心</h1>
        <div class="tabs">
          <div
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-item"
            :class="{ active: activeTab === tab.value }"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
            <span v-if="getCountByStatus(tab.value) > 0" class="tab-badge">
              {{ getCountByStatus(tab.value) }}
            </span>
          </div>
        </div>
      </div>

      <div v-loading="loading">
        <template v-if="!loading && liveStreams.length">
          <div class="live-grid">
            <div
              v-for="stream in liveStreams"
              :key="stream.id"
              class="live-card"
              @click="goToLive(stream.id)"
            >
              <div class="card-cover">
                <img :src="stream.cover_image" :alt="stream.title" />
                <div class="status-badge" :class="stream.status">
                  <span class="status-dot"></span>
                  {{ getStatusText(stream.status) }}
                </div>
                <div v-if="stream.status === 'live'" class="viewer-count">
                  <el-icon><View /></el-icon>
                  {{ formatViewerCount(stream.viewer_count) }}
                </div>
              </div>
              <div class="card-body">
                <h3 class="card-title">{{ stream.title }}</h3>
                <div class="card-meta">
                  <div class="streamer">
                    <div class="streamer-avatar">
                      {{ stream.streamer_name ? stream.streamer_name[0] : '主' }}
                    </div>
                    <span>{{ stream.streamer_name || '主播' }}</span>
                  </div>
                  <div class="time-info">
                    {{ getTimeText(stream) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <el-empty v-else-if="!loading" :description="getEmptyText()">
          <router-link to="/">
            <el-button type="primary">去首页逛逛</el-button>
          </router-link>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { View } from '@element-plus/icons-vue';
import { liveStreamApi } from '@/api';

const router = useRouter();

const loading = ref(true);
const allStreams = ref([]);
const activeTab = ref('all');

const tabs = [
  { label: '全部', value: 'all' },
  { label: '正在直播', value: 'live' },
  { label: '预告', value: 'upcoming' },
  { label: '已结束', value: 'ended' }
];

const liveStreams = computed(() => {
  if (activeTab.value === 'all') return allStreams.value;
  return allStreams.value.filter((s) => s.status === activeTab.value);
});

onMounted(async () => {
  await loadLiveStreams();
});

async function loadLiveStreams() {
  loading.value = true;
  try {
    allStreams.value = await liveStreamApi.list();
  } finally {
    loading.value = false;
  }
}

function switchTab(tab) {
  activeTab.value = tab;
}

function getCountByStatus(status) {
  if (status === 'all') return allStreams.value.length;
  return allStreams.value.filter((s) => s.status === status).length;
}

function getStatusText(status) {
  const map = {
    live: '直播中',
    upcoming: '预告',
    ended: '已结束'
  };
  return map[status] || status;
}

function formatViewerCount(count) {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  }
  return count;
}

function getTimeText(stream) {
  if (stream.status === 'live') {
    return '正在热播';
  } else if (stream.status === 'upcoming' && stream.start_time) {
    const date = new Date(stream.start_time);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } else if (stream.status === 'ended' && stream.end_time) {
    const date = new Date(stream.end_time);
    return `${date.getMonth() + 1}/${date.getDate()} 结束`;
  }
  return '';
}

function getEmptyText() {
  if (activeTab.value === 'live') return '暂无正在直播的场次';
  if (activeTab.value === 'upcoming') return '暂无预告场次';
  if (activeTab.value === 'ended') return '暂无已结束的场次';
  return '暂无直播场次';
}

function goToLive(id) {
  router.push(`/live/${id}`);
}
</script>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.tabs {
  display: flex;
  gap: 8px;
  background: #f1f5f9;
  padding: 6px;
  border-radius: 12px;
  width: fit-content;
}
.tab-item {
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tab-item:hover {
  color: #475569;
}
.tab-item.active {
  background: #fff;
  color: #6366f1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.tab-badge {
  background: #e0e7ff;
  color: #6366f1;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}
.live-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
.live-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
}
.live-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}
.card-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #f1f5f9;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}
.status-badge.live {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.status-badge.upcoming {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.status-badge.ended {
  background: linear-gradient(135deg, #64748b, #475569);
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
}
.status-badge.live .status-dot {
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.viewer-count {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  border-radius: 20px;
}
.card-body {
  padding: 16px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #64748b;
}
.streamer {
  display: flex;
  align-items: center;
  gap: 8px;
}
.streamer-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
@media (max-width: 768px) {
  .live-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .page-title {
    font-size: 22px;
  }
}
</style>
