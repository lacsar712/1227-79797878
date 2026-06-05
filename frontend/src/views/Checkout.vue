<template>
  <div class="page-container">
    <h1 class="page-title">确认订单</h1>
    <div v-loading="loading">
      <template v-if="!loading">
        <el-card shadow="never" class="section">
          <template #header>
            <span>收货地址</span>
            <el-button type="primary" text @click="showAddressForm = true">+ 新增地址</el-button>
          </template>
          <div v-if="addresses.length" class="address-list">
            <div
              v-for="addr in addresses"
              :key="addr.id"
              :class="['address-item', { active: form.address_id === addr.id }]"
              @click="form.address_id = addr.id"
            >
              <div class="addr-info">
                <span class="receiver">{{ addr.receiver }}</span>
                <span class="phone">{{ addr.phone }}</span>
                <span class="default" v-if="addr.is_default">默认</span>
              </div>
              <div class="addr-detail">{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无收货地址">
            <el-button type="primary" @click="showAddressForm = true">添加地址</el-button>
          </el-empty>
        </el-card>

        <el-card shadow="never" class="section" v-if="availableCards.length > 0">
          <template #header>
            <span>礼品卡抵扣</span>
            <span class="balance-tip">可用余额：¥{{ totalAvailableBalance }}</span>
          </template>
          <div class="gift-card-section">
            <el-checkbox v-model="form.use_gift_card" class="use-gift-card">
              使用礼品卡抵扣
            </el-checkbox>
            <div v-if="form.use_gift_card" class="gift-card-list">
              <div
                v-for="card in availableCards"
                :key="card.id"
                :class="['gift-card-item', { active: form.gift_card_id === card.id }]"
                @click="selectGiftCard(card)"
              >
                <div class="card-info">
                  <span class="card-amount">¥{{ card.amount }}</span>
                  <span class="card-balance">余额：¥{{ card.balance }}</span>
                </div>
                <span class="card-no">{{ card.card_no }}</span>
              </div>
            </div>
            <div v-if="form.use_gift_card && deductionAmount > 0" class="deduction-info">
              <el-icon :size="18" color="#10b981"><CircleCheck /></el-icon>
              <span>本次可抵扣 <em>¥{{ deductionAmount.toFixed(2) }}</em></span>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="section">
          <template #header>支付方式</template>
          <el-radio-group v-model="form.payment_method">
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="wechat">微信支付</el-radio>
            <el-radio value="bank">银行卡</el-radio>
          </el-radio-group>
        </el-card>
        <el-card shadow="never" class="section">
          <template #header>商品清单</template>
          <div class="order-items">
            <div v-for="item in cartItems" :key="item.id" class="order-item">
              <img :src="item.product?.image || placeholderImg" :alt="item.product?.name" />
              <div class="item-info">
                <div class="name">{{ item.product?.name }}</div>
                <div class="meta">¥{{ item.product?.price }} × {{ item.quantity }}</div>
              </div>
              <div class="subtotal">¥{{ ((item.product?.price || 0) * item.quantity).toFixed(2) }}</div>
            </div>
          </div>
          <el-input v-model="form.remark" placeholder="订单备注（选填）" type="textarea" :rows="2" class="remark" />
        </el-card>
        <div class="submit-bar">
          <div class="price-detail">
            <div class="price-row">
              <span>商品总额</span>
              <span>¥{{ cartTotal.toFixed(2) }}</span>
            </div>
            <div class="price-row deduction" v-if="form.use_gift_card && deductionAmount > 0">
              <span>礼品卡抵扣</span>
              <span>-¥{{ deductionAmount.toFixed(2) }}</span>
            </div>
            <div class="price-row total">
              <span>应付金额</span>
              <span class="total-amount">¥{{ finalAmount.toFixed(2) }}</span>
            </div>
          </div>
          <el-button type="primary" size="large" :loading="submitting" @click="submitOrder">
            {{ finalAmount <= 0 ? '提交订单' : '提交订单' }}
          </el-button>
        </div>
      </template>
    </div>
    <el-dialog v-model="showAddressForm" title="收货地址" width="500px" destroy-on-close @close="editingAddr = null">
      <el-form :model="addrForm" label-width="80px">
        <el-form-item label="收货人" required>
          <el-input v-model="addrForm.receiver" placeholder="请输入收货人" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="addrForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="省份" required>
          <el-input v-model="addrForm.province" placeholder="如：广东省" />
        </el-form-item>
        <el-form-item label="城市" required>
          <el-input v-model="addrForm.city" placeholder="如：深圳市" />
        </el-form-item>
        <el-form-item label="区县" required>
          <el-input v-model="addrForm.district" placeholder="如：南山区" />
        </el-form-item>
        <el-form-item label="详细地址" required>
          <el-input v-model="addrForm.detail" placeholder="街道、门牌号等" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addrForm.is_default">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddressForm = false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { CircleCheck } from '@element-plus/icons-vue';
import { addressesApi, ordersApi } from '@/api';
import { useCartStore } from '@/stores/cart';
import { useGiftCardStore } from '@/stores/giftCard';

const router = useRouter();
const cartStore = useCartStore();
const giftCardStore = useGiftCardStore();
const cartItems = computed(() => cartStore.items?.value ?? []);
const cartTotal = computed(() => cartStore.total?.value ?? 0);
const loading = ref(true);
const submitting = ref(false);
const addresses = ref([]);
const showAddressForm = ref(false);
const editingAddr = ref(null);
const placeholderImg = '/images/products/placeholder-100x100.png';

const availableCards = ref([]);
const totalAvailableBalance = ref('0.00');

const form = reactive({
  address_id: null,
  payment_method: 'alipay',
  remark: '',
  use_gift_card: false,
  gift_card_id: null
});

const deductionAmount = computed(() => {
  if (!form.use_gift_card) return 0;
  const total = cartTotal.value;
  if (total <= 0) return 0;

  if (form.gift_card_id) {
    const card = availableCards.value.find((c) => c.id === form.gift_card_id);
    if (card) {
      const balance = parseFloat(card.balance);
      return Math.min(balance, total);
    }
  }

  const totalBalance = parseFloat(totalAvailableBalance.value);
  return Math.min(totalBalance, total);
});

const finalAmount = computed(() => {
  const total = cartTotal.value - deductionAmount.value;
  return Math.max(0, total);
});

function selectGiftCard(card) {
  form.gift_card_id = form.gift_card_id === card.id ? null : card.id;
}

async function loadGiftCards() {
  const data = await giftCardStore.fetchAvailableCards();
  availableCards.value = data.list || [];
  totalAvailableBalance.value = data.total_balance || '0.00';
}

const addrForm = reactive({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
});

onMounted(async () => {
  await cartStore.fetchCart();
  if (!cartItems.value.length) {
    ElMessage.warning('购物车为空');
    router.push('/cart');
    return;
  }
  addresses.value = await addressesApi.list();
  const defaultAddr = addresses.value.find((a) => a.is_default);
  form.address_id = defaultAddr?.id || addresses.value[0]?.id;
  await loadGiftCards();
  loading.value = false;
});

async function saveAddress() {
  if (!addrForm.receiver || !addrForm.phone || !addrForm.province || !addrForm.city || !addrForm.district || !addrForm.detail) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  try {
    if (editingAddr.value) {
      await addressesApi.update(editingAddr.value.id, addrForm);
      ElMessage.success('更新成功');
    } else {
      await addressesApi.create(addrForm);
      ElMessage.success('添加成功');
    }
    addresses.value = await addressesApi.list();
    showAddressForm.value = false;
    Object.assign(addrForm, { receiver: '', phone: '', province: '', city: '', district: '', detail: '', is_default: false });
  } catch (e) {}
}

async function submitOrder() {
  if (!form.address_id) {
    ElMessage.warning('请选择收货地址');
    return;
  }
  if (form.use_gift_card && deductionAmount.value <= 0) {
    form.use_gift_card = false;
    form.gift_card_id = null;
  }
  submitting.value = true;
  try {
    const orderData = {
      address_id: form.address_id,
      payment_method: form.payment_method,
      remark: form.remark,
      use_gift_card: form.use_gift_card,
      gift_card_id: form.use_gift_card ? form.gift_card_id : null
    };
    const order = await ordersApi.create(orderData);
    await cartStore.fetchCart();
    ElMessage.success('订单创建成功');
    router.push(`/order/${order.id}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.section { margin-bottom: 24px; }
.address-list { display: flex; flex-direction: column; gap: 12px; }
.address-item {
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.address-item:hover { border-color: #6366f1; }
.address-item.active { border-color: #6366f1; background: #eef2ff; }
.addr-info { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
.receiver { font-weight: 600; }
.default { font-size: 12px; color: #6366f1; background: #eef2ff; padding: 2px 8px; border-radius: 4px; }
.addr-detail { color: #64748b; font-size: 14px; }

.balance-tip {
  font-size: 13px;
  color: #10b981;
  font-weight: 500;
}
.gift-card-section {
  padding: 8px 0;
}
.use-gift-card {
  margin-bottom: 16px;
  font-size: 15px;
}
.gift-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.gift-card-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fef3c7;
}
.gift-card-item:hover {
  border-color: #6366f1;
}
.gift-card-item.active {
  border-color: #6366f1;
  background: #eef2ff;
}
.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-amount {
  font-size: 18px;
  font-weight: 700;
  color: #92400e;
}
.card-balance {
  font-size: 13px;
  color: #64748b;
}
.card-no {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #78350f;
}
.deduction-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #dcfce7;
  border-radius: 8px;
  color: #166534;
  font-size: 14px;
}
.deduction-info em {
  font-style: normal;
  font-weight: 700;
  font-size: 16px;
}

.order-items { margin-bottom: 16px; }
.order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.order-item img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
.item-info .name { font-weight: 500; }
.item-info .meta { font-size: 13px; color: #64748b; }
.subtotal { margin-left: auto; font-weight: 600; }
.remark { margin-top: 12px; }
.submit-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.price-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
}
.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #475569;
}
.price-row.deduction {
  color: #ef4444;
}
.price-row.total {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px dashed #cbd5e1;
  font-size: 15px;
  font-weight: 600;
}
.total-amount {
  font-size: 24px;
  font-weight: 700;
  color: #ef4444;
}
@media (max-width: 480px) {
  .submit-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
}
</style>
