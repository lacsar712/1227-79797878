<template>
  <div class="page-container" v-loading="loading">
    <template v-if="wishlist">
      <div class="share-header">
        <div class="owner-info">
          <el-avatar :size="48" class="owner-avatar">
            {{ wishlist.owner?.nickname?.[0] || 'U' }}
          </el-avatar>
          <div class="owner-meta">
            <div class="owner-name">{{ wishlist.owner?.nickname }}</div>
            <div class="list-name">的购物清单「{{ wishlist.name }}」</div>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            v-if="wishlist.is_owner"
            type="primary"
            @click="goToManage"
          >
            <el-icon><Setting /></el-icon>
            管理清单
          </el-button>
          <el-button @click="copyLink">
            <el-icon><Share /></el-icon>
            复制链接
          </el-button>
        </div>
      </div>

      <div class="cover-section">
        <div class="cover-image">
          <img
            v-if="wishlist.cover_image || wishlist.items?.[0]?.product?.image"
            :src="wishlist.cover_image || wishlist.items?.[0]?.product?.image"
            :alt="wishlist.name"
          />
          <div v-else class="cover-placeholder">
            <el-icon :size="64" color="#cbd5e1"><Collection /></el-icon>
          </div>
        </div>
        <div class="cover-info">
          <h1 class="wishlist-title">{{ wishlist.name }}</h1>
          <div class="wishlist-meta">
            <span>{{ wishlist.item_count }} 件精选商品</span>
            <span>·</span>
            <span>分享于 {{ formatDate(wishlist.createdAt) }}</span>
          </div>
          <div class="total-price">
            清单总价：<span class="price">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
          <div class="action-bar">
            <el-button
              type="primary"
              size="large"
              :loading="addingToCart"
              @click="addAllToCart"
              :disabled="availableItems.length === 0"
            >
              <el-icon><ShoppingCart /></el-icon>
              一键全部加购（{{ availableItems.length }}）
            </el-button>
            <el-button size="large" @click="scrollToItems">
              浏览商品
            </el-button>
          </div>
          <el-alert
            v-if="!userStore.isLoggedIn && availableItems.length > 0"
            type="info"
            show-icon
            :closable="false"
            style="margin-top: 16px"
          >
            加购需要先 <router-link to="/login">登录</router-link>
          </el-alert>
        </div>
      </div>

      <div class="items-section" id="items-section">
        <div class="items-header">
          <h2>清单商品</h2>
          <div class="header-right">
            <el-checkbox
              v-model="selectAll"
              :indeterminate="isIndeterminate"
              @change="handleSelectAll"
            >
              全选
            </el-checkbox>
            <el-button
              type="primary"
              :loading="addingToCart"
              @click="addSelectedToCart"
              :disabled="selectedProductIds.length === 0"
            >
              加购选中（{{ selectedProductIds.length }}）
            </el-button>
          </div>
        </div>

        <template v-if="wishlist.items && wishlist.items.length">
          <div class="items-grid">
            <div
              v-for="item in wishlist.items"
              :key="item.id"
              :class="['product-card', { 'out-of-stock': item.product?.stock === 0 }]"
            >
              <div class="product-checkbox">
                <el-checkbox
                  v-model="selectedItemIds"
                  :value="item.id"
                  :disabled="item.product?.stock === 0"
                />
              </div>
              <div class="product-img">
                <img
                  :src="item.product?.image || placeholderImg"
                  :alt="item.product?.name"
                />
                <div v-if="item.product?.stock === 0" class="stock-badge">
                  暂时缺货
                </div>
              </div>
              <div class="product-info">
                <router-link
                  :to="`/product/${item.product_id}`"
                  class="product-name"
                >
                  {{ item.product?.name }}
                </router-link>
                <div class="product-price">
                  <span class="current-price">¥{{ item.product?.price }}</span>
                </div>
              </div>
              <div class="product-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="addSingleToCart(item)"
                  :disabled="item.product?.stock === 0 || !userStore.isLoggedIn"
                >
                  <el-icon><ShoppingCart /></el-icon>
                  加入购物车
                </el-button>
              </div>
            </div>
          </div>
        </template>
        <el-empty v-else description="清单还没有商品" />
      </div>
    </template>
    <el-empty v-else-if="!loading" description="清单不存在或已取消分享">
      <router-link to="/products">
        <el-button type="primary">去逛逛</el-button>
      </router-link>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Share,
  ShoppingCart,
  Collection,
  Setting
} from '@element-plus/icons-vue';
import { wishlistApi } from '@/api';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const wishlist = ref(null);
const addingToCart = ref(false);
const selectedItemIds = ref([]);

const placeholderImg = '/images/products/placeholder-200x200.png';

const availableItems = computed(() => {
  if (!wishlist.value?.items) return [];
  return wishlist.value.items.filter((i) => i.product && i.product.stock > 0);
});

const totalPrice = computed(() => {
  if (!wishlist.value?.items) return 0;
  return wishlist.value.items.reduce((sum, item) => {
    return sum + (item.product?.price || 0);
  }, 0);
});

const selectedProductIds = computed(() => {
  if (!wishlist.value?.items) return [];
  const selectedProducts = wishlist.value.items.filter((i) =>
    selectedItemIds.value.includes(i.id)
  );
  return selectedProducts.map((i) => i.product_id);
});

const isIndeterminate = computed(() => {
  const total = availableItems.value.length;
  const selected = selectedItemIds.value.filter((id) => {
    const item = wishlist.value?.items?.find((i) => i.id === id);
    return item && item.product?.stock > 0;
  }).length;
  return selected > 0 && selected < total;
});

const selectAll = computed({
  get() {
    return availableItems.value.length > 0 && availableItems.value.every((i) =>
      selectedItemIds.value.includes(i.id)
    );
  },
  set(val) {}
});

onMounted(async () => {
  await loadWishlist();
});

watch(
  () => route.params.shareCode,
  async () => {
    await loadWishlist();
  }
);

async function loadWishlist() {
  loading.value = true;
  try {
    const data = await wishlistApi.getShared(route.params.shareCode);
    wishlist.value = data;
    if (data) {
      document.title = `${data.name} - 优选商城`;
    }
  } catch (e) {
    wishlist.value = null;
  } finally {
    loading.value = false;
  }
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function handleSelectAll(val) {
  if (val) {
    selectedItemIds.value = availableItems.value.map((i) => i.id);
  } else {
    selectedItemIds.value = [];
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    ElMessage.success('链接已复制到剪贴板');
  } catch (e) {
    ElMessage.info(`分享链接: ${window.location.href}`);
  }
}

function goToManage() {
  router.push(`/profile/wishlist/${wishlist.value.id}`);
}

function scrollToItems() {
  const el = document.getElementById('items-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

async function addAllToCart() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  addingToCart.value = true;
  try {
    const productIds = availableItems.value.map((i) => i.product_id);
    const result = await wishlistApi.addToCart(route.params.shareCode, productIds);
    ElMessage.success(result.message || '已加入购物车');
  } catch (e) {
    // error handled by interceptor
  } finally {
    addingToCart.value = false;
  }
}

async function addSelectedToCart() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  if (selectedProductIds.value.length === 0) {
    ElMessage.warning('请选择要加购的商品');
    return;
  }
  addingToCart.value = true;
  try {
    const result = await wishlistApi.addToCart(
      route.params.shareCode,
      selectedProductIds.value
    );
    ElMessage.success(result.message || '已加入购物车');
    selectedItemIds.value = [];
  } catch (e) {
    // error handled by interceptor
  } finally {
    addingToCart.value = false;
  }
}

async function addSingleToCart(item) {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  addingToCart.value = true;
  try {
    const result = await wishlistApi.addToCart(route.params.shareCode, [item.product_id]);
    ElMessage.success(result.message || '已加入购物车');
  } catch (e) {
    // error handled by interceptor
  } finally {
    addingToCart.value = false;
  }
}
</script>

<style scoped>
.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.owner-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.owner-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}
.owner-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}
.list-name {
  font-size: 14px;
  color: #64748b;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.cover-section {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 32px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  align-items: center;
}
.cover-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
}
.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wishlist-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #1e293b;
}
.wishlist-meta {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
}
.total-price {
  font-size: 16px;
  color: #475569;
  margin-bottom: 24px;
}
.total-price .price {
  font-size: 32px;
  font-weight: 700;
  color: #ef4444;
  margin-left: 8px;
}
.action-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.items-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 12px;
}
.items-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.product-card {
  display: grid;
  grid-template-columns: auto 80px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  transition: all 0.2s;
}
.product-card:hover {
  background: #f1f5f9;
}
.product-card.out-of-stock {
  opacity: 0.6;
}
.product-checkbox {
  display: flex;
  align-items: center;
}
.product-img {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}
.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.stock-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}
.product-name {
  font-size: 14px;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
  color: #1e293b;
  line-height: 1.4;
}
.product-name:hover {
  color: #6366f1;
}
.current-price {
  color: #ef4444;
  font-weight: 600;
  font-size: 16px;
}
@media (max-width: 768px) {
  .cover-section {
    grid-template-columns: 1fr;
  }
  .cover-image {
    max-width: 300px;
    margin: 0 auto;
  }
  .wishlist-title {
    font-size: 22px;
  }
  .items-grid {
    grid-template-columns: 1fr;
  }
}
</style>
