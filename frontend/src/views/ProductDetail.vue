<template>
  <div class="page-container" v-loading="loading">
    <template v-if="!loading && product">
      <div class="product-detail">
        <div class="gallery">
          <img :src="product.image || placeholderImg" :alt="product.name" />
        </div>
        <div class="info">
          <h1>{{ product.name }}</h1>
          <p class="desc">{{ product.description }}</p>

          <div class="group-buy-card" v-if="product.group_buy">
            <div class="group-buy-header">
              <span class="group-buy-tag">拼团特惠</span>
              <span class="group-buy-people">{{ product.group_buy.min_people }}人成团</span>
            </div>
            <div class="group-buy-price">
              <span class="group-price">¥{{ product.group_buy.group_price }}</span>
              <span class="orig-price">¥{{ product.price }}</span>
              <span class="group-save">省¥{{ (product.price - product.group_buy.group_price).toFixed(2) }}</span>
            </div>
            <div class="group-buy-info">
              <span>已有 {{ product.group_buy.pending_groups_count || 0 }} 个拼团进行中</span>
              <span>拼团有效期 {{ product.group_buy.duration_hours }} 小时</span>
            </div>
          </div>

          <div class="price-box" v-else>
            <div class="main-price-row">
              <span class="price">¥{{ displayPrice }}</span>
              <span class="orig" v-if="showOriginalPrice">¥{{ product.price }}</span>
              <span class="member-tag" v-if="showMemberPrice && product.member_level">
                {{ product.member_level.icon }} {{ product.member_level.name }}专享
              </span>
            </div>
            <div class="original-row" v-if="product.original_price && !showMemberPrice">
              <span class="orig">¥{{ product.original_price }}</span>
              <span class="discount">
                省{{ Math.round((1 - product.price / product.original_price) * 100) }}%
              </span>
            </div>
            <div class="member-save-row" v-if="showMemberPrice && product.member_price">
              <span class="orig">原价 ¥{{ product.price }}</span>
              <span class="member-save">
                会员省¥{{ (product.price - product.member_price).toFixed(2) }}
                ({{ Math.round(product.member_discount * 10) }}折)
              </span>
            </div>
          </div>

          <div class="meta">已售 {{ product.sales_count || 0 }} 件 · 库存 {{ product.stock }} 件</div>
          <template v-if="product.stock > 0">
            <div class="quantity-row">
              <span>数量</span>
              <el-input-number v-model="quantity" :min="1" :max="product.stock" />
            </div>
            <div class="actions">
              <el-button v-if="product.group_buy" type="success" size="large" @click="openGroupBuyDialog" :disabled="!userStore.isLoggedIn">
                <el-icon><UserFilled /></el-icon>
                发起拼团
              </el-button>
              <el-button type="primary" size="large" @click="addToCart" :disabled="!userStore.isLoggedIn">
                <el-icon><ShoppingCart /></el-icon>
                加入购物车
              </el-button>
              <el-button size="large" @click="buyNow" :disabled="!userStore.isLoggedIn">
                立即购买
              </el-button>
            </div>
            <el-alert v-if="!userStore.isLoggedIn" type="info" show-icon :closable="false" style="margin-top: 16px">
              请先 <router-link to="/login">登录</router-link> 后加入购物车或购买
            </el-alert>
          </template>
          <template v-else>
            <div class="out-of-stock-tip">
              <el-icon :size="20" color="#f59e0b"><WarningFilled /></el-icon>
              <span>商品暂时缺货</span>
            </div>
            <div class="actions">
              <el-button
                type="warning"
                size="large"
                :loading="subscriptionLoading"
                @click="handleSubscribe"
                :class="{ 'btn-subscribed': isSubscribed }"
              >
                <el-icon v-if="isSubscribed"><BellFilled /></el-icon>
                <el-icon v-else><Bell /></el-icon>
                {{ isSubscribed ? '取消订阅' : '到货通知我' }}
              </el-button>
            </div>
            <el-alert v-if="!userStore.isLoggedIn" type="info" show-icon :closable="false" style="margin-top: 16px">
              请先 <router-link to="/login">登录</router-link> 后订阅到货通知
            </el-alert>
            <el-alert v-if="isSubscribed" type="success" show-icon :closable="false" style="margin-top: 16px">
              已成功订阅，商品到货后将第一时间通知您。您可以在 <router-link to="/notifications">消息中心</router-link> 查看通知。
            </el-alert>
          </template>
        </div>
      </div>
    </template>
    <el-empty v-else-if="!loading && !product" description="商品不存在" />

    <el-dialog v-model="groupBuyDialogVisible" title="发起拼团" width="500px">
      <el-form :model="groupBuyForm" label-width="100px">
        <el-form-item label="拼团商品">
          <div class="form-product">
            <img :src="product.image" :alt="product.name" class="product-thumb" />
            <div>
              <div class="product-name">{{ product.name }}</div>
              <div class="product-price">
                <span class="group-price">¥{{ product.group_buy.group_price }}</span>
                <span class="orig-price">¥{{ product.price }}</span>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="成团人数">
          <span>{{ product.group_buy.min_people }} 人</span>
        </el-form-item>
        <el-form-item label="有效期">
          <span>{{ product.group_buy.duration_hours }} 小时</span>
        </el-form-item>
        <el-form-item label="收货地址" prop="address_id">
          <el-select v-model="groupBuyForm.address_id" placeholder="请选择收货地址" style="width: 100%">
            <el-option
              v-for="addr in addresses"
              :key="addr.id"
              :label="`${addr.receiver} ${addr.phone} ${addr.province}${addr.city}${addr.district}${addr.detail}`"
              :value="addr.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式" prop="payment_method">
          <el-radio-group v-model="groupBuyForm.payment_method">
            <el-radio value="wechat">微信支付</el-radio>
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="bank">银行卡</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupBuyDialogVisible = false">取消</el-button>
        <el-button type="success" @click="createGroupBuy" :loading="submitting">
          发起拼团
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ShoppingCart, UserFilled, Bell, BellFilled, WarningFilled } from '@element-plus/icons-vue';
import { productsApi, addressesApi, groupBuyApi, stockSubscriptionApi } from '@/api';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();

const product = ref(null);
const loading = ref(true);
const quantity = ref(1);

const showMemberPrice = computed(() => {
  return userStore.isLoggedIn.value && product.value?.member_price != null && product.value.member_price < product.value.price;
});

const showOriginalPrice = computed(() => {
  return showMemberPrice.value;
});

const displayPrice = computed(() => {
  if (showMemberPrice.value) {
    return product.value.member_price.toFixed(2);
  }
  return product.value?.price?.toFixed(2) || '0.00';
});
const placeholderImg = '/images/products/placeholder-600x600.png';
const groupBuyDialogVisible = ref(false);
const submitting = ref(false);
const addresses = ref([]);
const groupBuyForm = ref({
  address_id: null,
  payment_method: 'wechat'
});
const isSubscribed = ref(false);
const subscriptionLoading = ref(false);

onMounted(async () => {
  try {
    product.value = await productsApi.detail(route.params.id);
    if (product.value && product.value.stock === 0 && userStore.isLoggedIn) {
      await loadSubscriptionStatus();
    }
  } catch {
    product.value = null;
  } finally {
    loading.value = false;
  }
});

async function loadSubscriptionStatus() {
  try {
    const res = await stockSubscriptionApi.getStatus(route.params.id);
    isSubscribed.value = res.subscribed;
  } catch (e) {
    isSubscribed.value = false;
  }
}

async function handleSubscribe() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  subscriptionLoading.value = true;
  try {
    if (isSubscribed.value) {
      await stockSubscriptionApi.unsubscribe(route.params.id);
      isSubscribed.value = false;
      ElMessage.success('已取消订阅');
    } else {
      await stockSubscriptionApi.subscribe(route.params.id);
      isSubscribed.value = true;
      ElMessage.success('订阅成功，商品到货后将通知您');
    }
  } catch (e) {
    // message shown by interceptor
  } finally {
    subscriptionLoading.value = false;
  }
}

async function addToCart() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  try {
    await cartStore.add(product.value.id, quantity.value);
    ElMessage.success('已加入购物车');
  } catch (e) {
    // message shown by interceptor
  }
}

function buyNow() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  addToCart().then(() => {
    router.push('/checkout');
  });
}

async function openGroupBuyDialog() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  try {
    addresses.value = await addressesApi.list();
    if (addresses.value.length > 0) {
      const defaultAddr = addresses.value.find((a) => a.is_default) || addresses.value[0];
      groupBuyForm.value.address_id = defaultAddr.id;
    }
    groupBuyDialogVisible.value = true;
  } catch (e) {
    ElMessage.error('获取收货地址失败');
  }
}

async function createGroupBuy() {
  if (!groupBuyForm.value.address_id) {
    ElMessage.warning('请选择收货地址');
    return;
  }
  submitting.value = true;
  try {
    const result = await groupBuyApi.create({
      activity_id: product.value.group_buy.id,
      address_id: groupBuyForm.value.address_id,
      payment_method: groupBuyForm.value.payment_method
    });
    ElMessage.success('拼团发起成功！快去分享给好友吧');
    groupBuyDialogVisible.value = false;
    router.push(`/group/${result.group_buy.id}`);
  } catch (e) {
    // message shown by interceptor
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  padding: 32px 0;
}
.gallery {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.gallery img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
.info h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px;
}
.desc {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 24px;
}
.group-buy-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
}
.group-buy-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.group-buy-tag {
  background: #ef4444;
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
}
.group-buy-people {
  color: #dc2626;
  font-size: 14px;
  font-weight: 500;
}
.group-buy-price {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}
.group-price {
  font-size: 36px;
  font-weight: 700;
  color: #ef4444;
}
.orig-price {
  font-size: 16px;
  color: #94a3b8;
  text-decoration: line-through;
}
.group-save {
  background: #fee2e2;
  color: #dc2626;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 14px;
}
.group-buy-info {
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-size: 14px;
}
.price-box {
  margin-bottom: 16px;
}
.main-price-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}
.original-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.member-save-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.price { font-size: 32px; font-weight: 700; color: #ef4444; }
.orig { font-size: 16px; color: #94a3b8; text-decoration: line-through; }
.discount {
  background: #fef2f2;
  color: #ef4444;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 4px;
}
.member-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
  border-radius: 20px;
  border: 1px solid #fcd34d;
}
.member-save {
  background: #dcfce7;
  color: #166534;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 4px;
}
.meta { color: #64748b; font-size: 14px; margin-bottom: 24px; }
.out-of-stock-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  color: #d97706;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
}
.btn-subscribed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border-color: #10b981 !important;
}
.quantity-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.actions { display: flex; gap: 12px; }
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
  .product-detail { grid-template-columns: 1fr; }
}
</style>
