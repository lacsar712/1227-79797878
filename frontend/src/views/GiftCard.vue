<template>
  <div class="page-container">
    <h1 class="page-title">礼品卡中心</h1>
    <el-tabs v-model="activeTab" class="gift-card-tabs">
      <el-tab-pane label="购买礼品卡" name="purchase">
        <GiftCardPurchase @switch-tab="handleSwitchTab" />
      </el-tab-pane>
      <el-tab-pane label="绑定礼品卡" name="bind">
        <GiftCardBind />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import GiftCardPurchase from '@/components/gift/GiftCardPurchase.vue';
import GiftCardBind from '@/components/gift/GiftCardBind.vue';

const activeTab = ref('purchase');

function handleSwitchTab(tabName) {
  activeTab.value = tabName;
}
</script>

<style scoped>
.gift-card-tabs {
  background: #fff;
  border-radius: 12px;
  padding: 8px 16px;
}
.gift-card-tabs :deep(.el-tabs__header) {
  margin-bottom: 8px;
}
.gift-card-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  height: 44px;
  line-height: 44px;
}
</style>
