<template>
  <div class="gift-card-bind">
    <div class="balance-card" v-if="giftCardStore.totalBalance.value">
      <div class="balance-label">当前礼品卡余额</div>
      <div class="balance-amount">¥{{ giftCardStore.totalBalance.value }}</div>
    </div>

    <el-card shadow="never" class="bind-card">
      <template #header>
        <span>绑定礼品卡</span>
      </template>
      <el-form :model="form" class="bind-form">
        <el-form-item label="礼品卡号" required>
          <el-input
            v-model="form.card_no"
            placeholder="请输入16位礼品卡号"
            maxlength="32"
            show-word-limit
            clearable
            size="large"
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="bind-btn"
          :loading="binding"
          @click="handleBind"
        >
          {{ binding ? '绑定中...' : '立即绑定' }}
        </el-button>
      </el-form>
    </el-card>

    <h3 class="section-title">我的礼品卡</h3>
    <div v-loading="giftCardStore.loading.value" class="card-list">
      <template v-if="giftCardStore.cards.value.length">
        <div
          v-for="card in giftCardStore.cards.value"
          :key="card.id"
          :class="['card-item', { 'card-used': card.status === 'used' }]"
        >
          <div class="card-header">
            <span class="card-amount">¥{{ card.amount }}</span>
            <span :class="['card-status', `status-${card.status}`]">
              {{ statusText[card.status] }}
            </span>
          </div>
          <div class="card-no">{{ card.card_no }}</div>
          <div class="card-footer">
            <div class="card-balance">
              余额：<span>¥{{ card.balance }}</span>
            </div>
            <div class="card-expire" v-if="card.expire_at">
              有效期至：{{ formatDate(card.expire_at) }}
            </div>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无礼品卡" />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useGiftCardStore } from '@/stores/giftCard';

const giftCardStore = useGiftCardStore();
const form = reactive({ card_no: '' });
const binding = ref(false);

const statusText = {
  unused: '未绑定',
  bound: '已绑定',
  used: '已用完'
};

onMounted(async () => {
  await giftCardStore.fetchMyCards();
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function handleBind() {
  if (!form.card_no.trim()) {
    ElMessage.warning('请输入礼品卡号');
    return;
  }

  binding.value = true;
  try {
    await giftCardStore.bind(form.card_no.trim());
    ElMessage.success('绑定成功');
    form.card_no = '';
    await giftCardStore.fetchMyCards();
  } finally {
    binding.value = false;
  }
}
</script>

<style scoped>
.gift-card-bind {
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
.bind-card {
  margin-bottom: 24px;
}
.bind-form {
  max-width: 400px;
}
.bind-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #1e293b;
}
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card-item {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.card-item.card-used {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  opacity: 0.7;
}
.card-item::before {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}
.card-amount {
  font-size: 28px;
  font-weight: 700;
  color: #92400e;
}
.card-item.card-used .card-amount {
  color: #64748b;
}
.card-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}
.status-bound {
  background: #dcfce7;
  color: #166534;
}
.status-unused {
  background: #fef9c3;
  color: #854d0e;
}
.status-used {
  background: #e2e8f0;
  color: #475569;
}
.card-no {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #78350f;
  letter-spacing: 2px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}
.card-item.card-used .card-no {
  color: #64748b;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #92400e;
  position: relative;
  z-index: 1;
}
.card-item.card-used .card-footer {
  color: #64748b;
}
.card-balance span {
  font-weight: 600;
  font-size: 15px;
}
@media (max-width: 480px) {
  .card-amount {
    font-size: 24px;
  }
  .card-no {
    font-size: 14px;
  }
}
</style>
