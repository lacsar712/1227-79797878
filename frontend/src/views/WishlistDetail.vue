<template>
  <div class="page-container" v-loading="loading">
    <template v-if="wishlist">
      <div class="detail-header">
        <div class="header-left">
          <el-button text @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h1 class="page-title">{{ wishlist.name }}</h1>
          <el-tag v-if="wishlist.is_public" type="success" size="small">
            <el-icon><Link /></el-icon>
            已分享
          </el-tag>
        </div>
        <div class="header-actions">
          <el-button
            :type="wishlist.is_public ? 'success' : 'default'"
            @click="handleShare"
          >
            <el-icon><Share /></el-icon>
            {{ wishlist.is_public ? '复制分享链接' : '生成分享链接' }}
          </el-button>
          <el-button v-if="wishlist.is_public" type="warning" @click="handleUnshare">
            <el-icon><LinkOff /></el-icon>
            取消分享
          </el-button>
          <el-button @click="handleEditName">
            <el-icon><Edit /></el-icon>
            重命名
          </el-button>
          <el-button type="danger" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除清单
          </el-button>
        </div>
      </div>

      <div class="items-section">
        <div class="items-header">
          <h2>清单商品（{{ wishlist.item_count }}）</h2>
        </div>

        <template v-if="wishlist.items && wishlist.items.length">
          <div class="items-list">
            <div v-for="item in wishlist.items" :key="item.id" class="item-card">
              <div class="item-img">
                <img
                  :src="item.product?.image || placeholderImg"
                  :alt="item.product?.name"
                />
              </div>
              <div class="item-info">
                <router-link
                  :to="`/product/${item.product_id}`"
                  class="item-name"
                >
                  {{ item.product?.name }}
                </router-link>
                <div class="item-price">¥{{ item.product?.price }}</div>
                <div v-if="item.product?.stock === 0" class="out-of-stock">
                  暂时缺货
                </div>
              </div>
              <div class="item-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="addToCart(item)"
                  :disabled="item.product?.stock === 0"
                >
                  <el-icon><ShoppingCart /></el-icon>
                  加入购物车
                </el-button>
                <el-button type="danger" size="small" @click="removeItem(item)">
                  <el-icon><Delete /></el-icon>
                  移除
                </el-button>
              </div>
            </div>
          </div>
        </template>
        <el-empty v-else description="清单还没有商品">
          <router-link to="/products">
            <el-button type="primary">去添加商品</el-button>
          </router-link>
        </el-empty>
      </div>
    </template>
    <el-empty v-else-if="!loading" description="清单不存在" />

    <el-dialog v-model="renameDialogVisible" title="重命名清单" width="400px">
      <el-form :model="renameForm">
        <el-form-item label="清单名称">
          <el-input
            v-model="renameForm.name"
            placeholder="请输入清单名称"
            maxlength="50"
            show-word-limit
            @keyup.enter="handleRenameSubmit"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleRenameSubmit"
          :disabled="!renameForm.name.trim()"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft,
  Share,
  Edit,
  Delete,
  Link,
  LinkOff,
  ShoppingCart
} from '@element-plus/icons-vue';
import { useWishlistStore } from '@/stores/wishlist';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const router = useRouter();
const wishlistStore = useWishlistStore();
const cartStore = useCartStore();

const loading = ref(true);
const wishlist = ref(null);
const renameDialogVisible = ref(false);
const renameForm = ref({ name: '' });

const placeholderImg = '/images/products/placeholder-200x200.png';

onMounted(async () => {
  await loadWishlist();
});

async function loadWishlist() {
  loading.value = true;
  try {
    const data = await wishlistStore.fetchDetail(route.params.id);
    wishlist.value = data;
    if (data) {
      document.title = `${data.name} - 优选商城`;
    }
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/profile/wishlists');
}

function handleEditName() {
  renameForm.value.name = wishlist.value.name;
  renameDialogVisible.value = true;
}

async function handleRenameSubmit() {
  if (!renameForm.value.name.trim()) return;
  try {
    await wishlistStore.update(wishlist.value.id, renameForm.value.name.trim());
    wishlist.value.name = renameForm.value.name.trim();
    renameDialogVisible.value = false;
    ElMessage.success('重命名成功');
  } catch (e) {
    // error handled by interceptor
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${wishlist.value.name}」吗？删除后无法恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    );
    await wishlistStore.remove(wishlist.value.id);
    ElMessage.success('已删除');
    router.push('/profile/wishlists');
  } catch (e) {
    if (e !== 'cancel') {
      // error handled by interceptor
    }
  }
}

async function handleShare() {
  try {
    if (!wishlist.value.is_public || !wishlist.value.share_code) {
      const result = await wishlistStore.share(wishlist.value.id);
      wishlist.value.share_code = result.share_code;
      wishlist.value.is_public = true;
    }
    const shareUrl = `${window.location.origin}/wishlist/${wishlist.value.share_code}`;
    await navigator.clipboard.writeText(shareUrl);
    ElMessage.success('分享链接已复制到剪贴板');
  } catch (e) {
    if (wishlist.value.share_code) {
      const shareUrl = `${window.location.origin}/wishlist/${wishlist.value.share_code}`;
      ElMessage.info(`分享链接: ${shareUrl}`);
    }
  }
}

async function handleUnshare() {
  try {
    await ElMessageBox.confirm('确定要取消分享吗？取消后他人将无法访问此清单。', '确认取消分享', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '继续分享'
    });
    await wishlistStore.unshare(wishlist.value.id);
    wishlist.value.is_public = false;
    ElMessage.success('已取消分享');
  } catch (e) {
    if (e !== 'cancel') {
      // error handled by interceptor
    }
  }
}

async function removeItem(item) {
  try {
    await ElMessageBox.confirm(
      `确定要将「${item.product?.name}」从清单中移除吗？`,
      '确认移除',
      {
        type: 'warning',
        confirmButtonText: '移除',
        cancelButtonText: '取消'
      }
    );
    await wishlistStore.removeItem(wishlist.value.id, item.id);
    wishlist.value.items = wishlist.value.items.filter((i) => i.id !== item.id);
    wishlist.value.item_count--;
    ElMessage.success('已移除');
  } catch (e) {
    if (e !== 'cancel') {
      // error handled by interceptor
    }
  }
}

async function addToCart(item) {
  try {
    await cartStore.add(item.product_id, 1);
    ElMessage.success('已加入购物车');
  } catch (e) {
    // error handled by interceptor
  }
}
</script>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-title {
  margin: 0;
  font-size: 22px;
}
.header-actions {
  display: flex;
  gap: 8px;
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
}
.items-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}
.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.item-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #f8fafc;
  transition: all 0.2s;
}
.item-card:hover {
  background: #f1f5f9;
}
.item-img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-info {
  flex: 1;
  min-width: 0;
}
.item-name {
  font-size: 15px;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
  color: #1e293b;
}
.item-name:hover {
  color: #6366f1;
}
.item-price {
  color: #ef4444;
  font-weight: 600;
  font-size: 16px;
}
.out-of-stock {
  font-size: 12px;
  color: #f59e0b;
  margin-top: 4px;
}
.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
@media (max-width: 600px) {
  .item-card {
    flex-wrap: wrap;
  }
  .item-actions {
    width: 100%;
    justify-content: flex-end;
  }
  .header-actions {
    width: 100%;
  }
  .header-actions .el-button {
    flex: 1;
  }
}
</style>
