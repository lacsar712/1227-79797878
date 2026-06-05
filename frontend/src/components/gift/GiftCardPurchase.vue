<template>
  <div class="gift-card-purchase">
    <div class="balance-card" v-if="giftCardStore.totalBalance.value">
      <div class="balance-label">当前礼品卡余额</div>
      <div class="balance-amount">¥{{ giftCardStore.totalBalance.value }}</div>
    </div>

    <h3 class="section-title">选择面额</h3>
    <div class="denomination-list">
      <div
        v-for="d in denominations"
        :key="d"
        :class="['denomination-item', { active: selectedAmount === d }]"
        @click="selectedAmount = d"
      >
        <div class="denomination-amount">¥{{ d }}</div>
        <div class="denomination-desc">售价 ¥{{ d }}</div>
      </div>
    </div>

    <div class="purchase-summary" v-if="selectedAmount">
      <div class="summary-row">
        <span>购买面额</span>
        <span>¥{{ selectedAmount }}</span>
      </div>
      <div class="summary-row total">
        <span>应付金额</span>
        <span class="amount">¥{{ selectedAmount }}</span>
      </div>
    </div>

    <el-button
      type="primary"
      size="large"
      class="purchase-btn"
      :disabled="!selectedAmount"
      :loading="purchasing"
      @click="handlePurchase"
    >
      {{ purchasing ? '支付中...' : '立即购买' }}
    </el-button>

    <el-dialog
      v-model="showSuccess"
      title="购买成功"
      width="420px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="success-content">
        <div class="success-icon">
          <el-icon :size="48" color="#10b981"><Check /></el-icon>
        </div>
        <h3>礼品卡购买成功！</h3>
        <p class="success-card-no">卡号：{{ purchasedCard?.card_no }}</p>
        <p class="success-amount">面额：¥{{ purchasedCard?.amount }}</p>
        <p class="success-tip">请在「绑定礼品卡」Tab 中绑定后使用</p>
      </div>
      <template #footer>
        <el-button @click="showSuccess = false">稍后绑定</el-button>
        <el-button type="primary" @click="goToBind">立即绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { useGiftCardStore } from '@/stores/giftCard';

const emit = defineEmits(['switchTab']);

const giftCardStore = useGiftCardStore();
const denominations = ref([]);
const selectedAmount = ref(null);
const purchasing = ref(false);
const showSuccess = ref(false);
const purchasedCard = ref(null);

onMounted(async () => {
  denominations.value = await giftCardStore.fetchDenominations();
});

async function handlePurchase() {
  if (!selectedAmount.value) {
    ElMessage.warning('请选择面额');
    return;
  }

  purchasing.value = true;
  try {
    const card = await giftCardStore.purchase(selectedAmount.value);
    purchasedCard.value = card;
    showSuccess.value = true;
  } finally {
    purchasing.value = false;
  }
}

function goToBind() {
  showSuccess.value = false;
  emit('switchTab', 'bind');
}
</script>

<style scoped>
.gift-card-purchase {
  padding: 16px 0;
}
.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.balance-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}
.balance-amount {
  font-size: 32px;
  font-weight: 700;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #1e293b;
}
.denomination-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.denomination-item {
  padding: 24px 16px;
  text-align: center;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}
.denomination-item:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
}
.denomination-item.active {
  border-color: #6366f1;
  background: #eef2ff;
}
.denomination-amount {
  font-size: 28px;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 4px;
}
.denomination-desc {
  font-size: 13px;
  color: #64748b;
}
.purchase-summary {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #475569;
}
.summary-row.total {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px dashed #cbd5e1;
  font-size: 16px;
  font-weight: 600;
}
.summary-row .amount {
  color: #ef4444;
  font-size: 22px;
}
.purchase-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}
.success-content {
  text-align: center;
  padding: 16px 0;
}
.success-icon {
  margin-bottom: 16px;
}
.success-content h3 {
  margin: 0 0 16px;
  color: #1e293b;
}
.success-card-no {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 600;
  color: #6366f1;
  margin: 8px 0;
  padding: 12px;
  background: #eef2ff;
  border-radius: 8px;
}
.success-amount {
  font-size: 15px;
  color: #475569;
  margin: 8px 0;
}
.success-tip {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 12px;
}
@media (max-width: 480px) {
  .denomination-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
