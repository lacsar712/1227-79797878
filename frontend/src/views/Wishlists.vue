<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">我的清单</h1>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新建清单
      </el-button>
    </div>

    <div v-loading="loading">
      <template v-if="!loading && wishlists.length">
        <div class="wishlist-grid">
          <div
            v-for="wishlist in wishlists"
            :key="wishlist.id"
            class="wishlist-card"
            @click="goToDetail(wishlist.id)"
          >
            <div class="card-cover">
              <img
                v-if="wishlist.cover_image || wishlist.items?.[0]?.product?.image"
                :src="wishlist.cover_image || wishlist.items?.[0]?.product?.image"
                :alt="wishlist.name"
              />
              <div v-else class="cover-placeholder">
                <el-icon :size="48" color="#cbd5e1"><Collection /></el-icon>
              </div>
              <div v-if="wishlist.is_public" class="public-badge">
                <el-icon :size="12"><Link /></el-icon>
                已分享
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ wishlist.name }}</h3>
              <div class="card-meta">
                <span>{{ wishlist.item_count }} 件商品</span>
                <span class="update-time">
                  更新于 {{ formatDate(wishlist.updatedAt) }}
                </span>
              </div>
            </div>
            <div class="card-actions" @click.stop>
              <el-button
                size="small"
                :type="wishlist.is_public ? 'success' : 'default'"
                @click="handleShare(wishlist)"
              >
                <el-icon><Share /></el-icon>
                {{ wishlist.is_public ? '复制链接' : '分享' }}
              </el-button>
              <el-button size="small" @click="handleEdit(wishlist)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(wishlist)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="还没有创建任何清单">
        <el-button type="primary" @click="openCreateDialog">创建第一个清单</el-button>
      </el-empty>
    </div>

    <el-dialog v-model="createDialogVisible" title="新建清单" width="400px">
      <el-form :model="createForm">
        <el-form-item label="清单名称">
          <el-input
            v-model="createForm.name"
            placeholder="请输入清单名称"
            maxlength="50"
            show-word-limit
            @keyup.enter="handleCreate"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :disabled="!createForm.name.trim()">
          创建
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑清单" width="400px">
      <el-form :model="editForm">
        <el-form-item label="清单名称">
          <el-input
            v-model="editForm.name"
            placeholder="请输入清单名称"
            maxlength="50"
            show-word-limit
            @keyup.enter="handleUpdate"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate" :disabled="!editForm.name.trim()">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Share, Edit, Delete, Collection, Link } from '@element-plus/icons-vue';
import { useWishlistStore } from '@/stores/wishlist';

const router = useRouter();
const wishlistStore = useWishlistStore();

const loading = ref(true);
const wishlists = ref([]);
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const createForm = ref({ name: '' });
const editForm = ref({ id: null, name: '' });

const placeholderImg = '/images/products/placeholder-200x200.png';

onMounted(async () => {
  await loadWishlists();
});

async function loadWishlists() {
  loading.value = true;
  try {
    wishlists.value = await wishlistStore.fetchWishlists();
  } finally {
    loading.value = false;
  }
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function openCreateDialog() {
  createForm.value.name = '';
  createDialogVisible.value = true;
}

async function handleCreate() {
  if (!createForm.value.name.trim()) return;
  try {
    await wishlistStore.create(createForm.value.name.trim());
    createDialogVisible.value = false;
    ElMessage.success('清单创建成功');
  } catch (e) {
    // error handled by interceptor
  }
}

function goToDetail(id) {
  router.push(`/profile/wishlist/${id}`);
}

function handleEdit(wishlist) {
  editForm.value = { id: wishlist.id, name: wishlist.name };
  editDialogVisible.value = true;
}

async function handleUpdate() {
  if (!editForm.value.name.trim()) return;
  try {
    await wishlistStore.update(editForm.value.id, editForm.value.name.trim());
    editDialogVisible.value = false;
    ElMessage.success('更新成功');
  } catch (e) {
    // error handled by interceptor
  }
}

async function handleDelete(wishlist) {
  try {
    await ElMessageBox.confirm(`确定要删除「${wishlist.name}」吗？删除后无法恢复。`, '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
    await wishlistStore.remove(wishlist.id);
    ElMessage.success('已删除');
  } catch (e) {
    if (e !== 'cancel') {
      // error handled by interceptor
    }
  }
}

async function handleShare(wishlist) {
  try {
    if (!wishlist.is_public || !wishlist.share_code) {
      const result = await wishlistStore.share(wishlist.id);
      wishlist.share_code = result.share_code;
      wishlist.is_public = true;
    }
    const shareUrl = `${window.location.origin}/wishlist/${wishlist.share_code}`;
    await navigator.clipboard.writeText(shareUrl);
    ElMessage.success('分享链接已复制到剪贴板');
  } catch (e) {
    if (wishlist.share_code) {
      const shareUrl = `${window.location.origin}/wishlist/${wishlist.share_code}`;
      ElMessage.info(`分享链接: ${shareUrl}`);
    }
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.wishlist-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  cursor: pointer;
}
.wishlist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.card-cover {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: #f8fafc;
}
.card-cover img {
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
.public-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(16, 185, 129, 0.9);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
}
.card-body {
  padding: 16px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #1e293b;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #64748b;
}
.update-time {
  color: #94a3b8;
}
.card-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
}
.card-actions .el-button {
  flex: 1;
}
@media (max-width: 600px) {
  .wishlist-grid {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
