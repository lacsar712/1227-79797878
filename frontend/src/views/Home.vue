<template>
  <div class="home-page">
    <section v-if="activeStreams.length" class="live-banner" @click="goToLiveList">
      <div class="live-banner-content">
        <div class="live-banner-left">
          <div class="live-icon">
            <el-icon :size="28"><VideoPlay /></el-icon>
          </div>
          <div class="live-banner-text">
            <div class="live-banner-title">
              <span class="live-dot"></span>
              正在直播
            </div>
            <div class="live-banner-desc">
              {{ activeStreams[0].title }}
            </div>
          </div>
        </div>
        <div class="live-banner-right">
          <div class="live-preview">
            <img :src="activeStreams[0].cover_image" alt="" />
            <div class="live-count">
              <el-icon :size="12"><View /></el-icon>
              {{ formatViewerCount(activeStreams[0].viewer_count) }}
            </div>
          </div>
          <el-button type="primary" size="small" class="enter-btn">
            进入
            <el-icon><Right /></el-icon>
          </el-button>
        </div>
      </div>
    </section>

    <section class="hero">
      <div class="hero-content">
        <h1>品质生活，触手可及</h1>
        <p>精选好物，畅享购物新体验</p>
        <router-link to="/products">
          <el-button type="primary" size="large" round>立即选购</el-button>
        </router-link>
      </div>
    </section>
    <section class="categories-section">
      <div class="page-container">
        <h2 class="section-title">热门分类</h2>
        <div class="categories-grid">
          <router-link
            v-for="cat in categories"
            :key="cat.id"
            :to="`/products?category_id=${cat.id}`"
            class="category-card"
          >
            <div class="cat-icon">{{ cat.name[0] }}</div>
            <span>{{ cat.name }}</span>
          </router-link>
        </div>
      </div>
    </section>
    <section class="products-section">
      <div class="page-container">
        <h2 class="section-title">精选推荐</h2>
        <div v-loading="loading" class="products-grid">
          <template v-if="!loading">
            <router-link
              v-for="p in products"
              :key="p.id"
              :to="`/product/${p.id}`"
              class="product-card"
            >
              <div class="product-img">
                <img :src="p.image || placeholderImg" :alt="p.name" />
                <div class="product-badge" v-if="p.original_price">省{{ discount(p) }}%</div>
              </div>
              <div class="product-info">
                <h3>{{ p.name }}</h3>
                <div class="price-row">
                  <span class="price">¥{{ p.price }}</span>
                  <span class="orig" v-if="p.original_price">¥{{ p.original_price }}</span>
                </div>
              </div>
            </router-link>
          </template>
        </div>
        <div class="more-wrap">
          <router-link to="/products">
            <el-button>查看更多</el-button>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { VideoPlay, View, Right } from '@element-plus/icons-vue';
import { categoriesApi, productsApi, liveStreamApi } from '@/api';

const router = useRouter();

const categories = ref([]);
const products = ref([]);
const activeStreams = ref([]);
const loading = ref(true);
const placeholderImg = '/images/products/placeholder-400x400.png';

onMounted(async () => {
  try {
    const [cats, res, liveRes] = await Promise.all([
      categoriesApi.list(),
      productsApi.list({ limit: 8 }),
      liveStreamApi.active()
    ]);
    categories.value = cats;
    products.value = res.list || [];
    activeStreams.value = liveRes || [];
  } finally {
    loading.value = false;
  }
});

function discount(p) {
  if (!p.original_price || p.original_price <= p.price) return 0;
  return Math.round((1 - p.price / p.original_price) * 100);
}

function formatViewerCount(count) {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  }
  return count;
}

function goToLiveList() {
  router.push('/live');
}
</script>

<style scoped>
.live-banner {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.live-banner:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}
.live-banner-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.live-banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}
.live-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
  50% { box-shadow: 0 0 0 16px rgba(255, 255, 255, 0); }
}
.live-banner-text {
  color: #fff;
  min-width: 0;
}
.live-banner-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}
.live-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  animation: blink 1.5s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.live-banner-desc {
  font-size: 14px;
  opacity: 0.95;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.live-banner-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.live-preview {
  position: relative;
  width: 80px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}
.live-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.live-count {
  position: absolute;
  bottom: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 10px;
  border-radius: 4px;
}
.enter-btn {
  background: #fff;
  color: #ef4444;
  border: none;
  font-weight: 600;
}
.enter-btn:hover {
  background: #fef2f2 !important;
  color: #dc2626 !important;
}
.hero {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  padding: 80px 24px 100px;
  text-align: center;
  color: #fff;
}
.hero-content h1 {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}
.hero-content p {
  font-size: 18px;
  opacity: 0.9;
  margin: 0 0 32px;
}
.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 24px;
  color: #1e293b;
}
.categories-section {
  padding: 48px 0;
}
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s ease;
}
.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(99,102,241,0.15);
}
.cat-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}
.products-section {
  padding-bottom: 64px;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
  min-height: 200px;
}
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s ease;
  display: block;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}
.product-img {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}
.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.product-info {
  padding: 16px;
}
.product-info h3 {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.price { font-size: 18px; font-weight: 700; color: #ef4444; }
.orig { font-size: 13px; color: #94a3b8; text-decoration: line-through; }
.more-wrap {
  text-align: center;
  margin-top: 32px;
}
@media (max-width: 768px) {
  .hero-content h1 { font-size: 28px; }
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
