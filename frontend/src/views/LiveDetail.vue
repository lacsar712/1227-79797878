<template>
  <div class="live-detail-page">
    <div v-loading="loading" class="page-container">
      <template v-if="!loading && liveStream">
        <div class="live-layout">
          <div class="video-section">
            <div class="video-player">
              <img :src="liveStream.cover_image" :alt="liveStream.title" class="video-cover" />
              <div class="video-overlay">
                <div v-if="liveStream.status === 'live'" class="live-indicator">
                  <span class="live-dot"></span>
                  <span>直播中</span>
                </div>
                <div v-else-if="liveStream.status === 'upcoming'" class="upcoming-indicator">
                  <el-icon :size="24"><Clock /></el-icon>
                  <span>直播未开始</span>
                </div>
                <div v-else class="ended-indicator">
                  <el-icon :size="24"><VideoPause /></el-icon>
                  <span>直播已结束</span>
                </div>
              </div>
              <div class="play-button">
                <el-icon :size="64"><VideoPlay /></el-icon>
              </div>
            </div>
            <div class="live-info">
              <div class="live-header">
                <h1 class="live-title">{{ liveStream.title }}</h1>
                <div class="live-status" :class="liveStream.status">
                  <span class="status-dot"></span>
                  {{ getStatusText(liveStream.status) }}
                </div>
              </div>
              <div class="live-meta">
                <div class="streamer-info">
                  <div class="streamer-avatar">
                    {{ liveStream.streamer_name ? liveStream.streamer_name[0] : '主' }}
                  </div>
                  <div class="streamer-detail">
                    <div class="streamer-name">{{ liveStream.streamer_name || '主播' }}</div>
                    <div class="viewer-count" v-if="liveStream.status === 'live'">
                      <el-icon :size="14"><View /></el-icon>
                      {{ formatViewerCount(liveStream.viewer_count) }} 观看
                    </div>
                  </div>
                </div>
                <div class="time-info">
                  {{ getTimeInfo(liveStream) }}
                </div>
              </div>
              <p class="live-description" v-if="liveStream.description">
                {{ liveStream.description }}
              </p>
            </div>
          </div>

          <div class="products-section">
            <div class="products-header">
              <h2 class="products-title">
                <el-icon><Goods /></el-icon>
                商品橱窗
                <span class="product-count">({{ liveStream.products?.length || 0 }})</span>
              </h2>
            </div>
            <div class="products-list">
              <div
                v-for="(item, index) in liveStream.products"
                :key="item.id"
                class="product-item"
              >
                <div class="product-index">{{ index + 1 }}</div>
                <div class="product-image" @click="goToProduct(item.Product.id)">
                  <img :src="item.Product.image" :alt="item.Product.name" />
                  <div v-if="item.is_highlight" class="highlight-tag">讲解中</div>
                </div>
                <div class="product-info" @click="goToProduct(item.Product.id)">
                  <h3 class="product-name">{{ item.Product.name }}</h3>
                  <div class="price-row">
                    <span class="live-price">
                      <span class="price-label">直播价</span>
                      ¥{{ parseFloat(item.final_price).toFixed(2) }}
                    </span>
                    <span class="orig-price" v-if="item.Product.original_price">
                      ¥{{ item.Product.original_price }}
                    </span>
                  </div>
                  <div class="member-price" v-if="item.Product.member_price">
                    会员价 ¥{{ parseFloat(item.Product.member_price).toFixed(2) }}
                  </div>
                </div>
                <div class="product-actions">
                  <el-button
                    type="primary"
                    size="small"
                    class="buy-btn"
                    :disabled="item.Product.status !== 'active' || item.Product.stock <= 0"
                    @click.stop="addToCart(item)"
                  >
                    加购
                  </el-button>
                  <el-button
                    size="small"
                    @click.stop="goToProduct(item.Product.id)"
                  >
                    详情
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { View, Clock, VideoPause, VideoPlay, Goods } from '@element-plus/icons-vue';
import { liveStreamApi } from '@/api';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

const loading = ref(true);
const liveStream = ref(null);

onMounted(async () => {
  await loadLiveDetail();
});

async function loadLiveDetail() {
  loading.value = true;
  try {
    liveStream.value = await liveStreamApi.detail(route.params.id);
  } finally {
    loading.value = false;
  }
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

function getTimeInfo(stream) {
  if (stream.status === 'live' && stream.start_time) {
    const start = new Date(stream.start_time);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    if (hours > 0) {
      return `已开播 ${hours}小时${minutes}分钟`;
    }
    return `已开播 ${minutes}分钟`;
  } else if (stream.status === 'upcoming' && stream.start_time) {
    const date = new Date(stream.start_time);
    return `开播时间: ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } else if (stream.status === 'ended' && stream.end_time) {
    const date = new Date(stream.end_time);
    return `结束时间: ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return '';
}

function goToProduct(productId) {
  router.push(`/product/${productId}`);
}

async function addToCart(item) {
  if (item.Product.status !== 'active') {
    ElMessage.warning('该商品已下架');
    return;
  }
  if (item.Product.stock <= 0) {
    ElMessage.warning('该商品库存不足');
    return;
  }
  try {
    await cartStore.add(item.Product.id, 1);
    ElMessage.success('已加入购物车');
  } catch (e) {
    ElMessage.error('加入购物车失败，请先登录');
  }
}
</script>

<style scoped>
.live-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  align-items: start;
}
.video-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.video-player {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
}
.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
}
.live-indicator,
.upcoming-indicator,
.ended-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}
.live-indicator {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.upcoming-indicator {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.ended-indicator {
  background: linear-gradient(135deg, #64748b, #475569);
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: transform 0.2s ease;
}
.play-button:hover {
  transform: translate(-50%, -50%) scale(1.1);
}
.live-info {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.live-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}
.live-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  flex: 1;
}
.live-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}
.live-status.live {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.live-status.upcoming {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.live-status.ended {
  background: linear-gradient(135deg, #64748b, #475569);
}
.live-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.streamer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.streamer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}
.streamer-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.streamer-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.viewer-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
}
.time-info {
  font-size: 13px;
  color: #64748b;
}
.live-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}
.products-section {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
}
.products-header {
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
}
.products-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.product-count {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}
.products-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.product-item {
  display: grid;
  grid-template-columns: 24px 80px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: background 0.2s ease;
  cursor: pointer;
}
.product-item:hover {
  background: #f8fafc;
}
.product-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.product-image {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.highlight-tag {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;
}
.product-info {
  min-width: 0;
}
.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}
.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.live-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
}
.price-label {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 4px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 3px;
  vertical-align: middle;
}
.orig-price {
  font-size: 13px;
  color: #94a3b8;
  text-decoration: line-through;
}
.member-price {
  font-size: 12px;
  color: #f59e0b;
  font-weight: 500;
}
.product-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.buy-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
}
.buy-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
}
@media (max-width: 1024px) {
  .live-layout {
    grid-template-columns: 1fr;
  }
  .products-section {
    position: static;
    max-height: none;
  }
  .products-list {
    max-height: 600px;
  }
}
@media (max-width: 600px) {
  .live-title {
    font-size: 18px;
  }
  .product-item {
    grid-template-columns: 20px 60px 1fr;
    grid-template-rows: auto auto;
  }
  .product-index {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }
  .product-image {
    width: 60px;
    height: 60px;
  }
  .product-actions {
    grid-column: 2 / -1;
    flex-direction: row;
    justify-content: flex-end;
  }
  .product-actions .el-button {
    flex: 1;
  }
}
</style>
