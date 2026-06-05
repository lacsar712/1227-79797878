<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">联系客服</h1>
      <el-button type="primary" plain @click="goToTickets">
        <el-icon><List /></el-icon>
        我的工单
      </el-button>
    </div>

    <div v-loading="submitting" class="support-content">
      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <el-icon :size="24" color="#6366f1"><ChatDotRound /></el-icon>
            <span>提交工单</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          label-position="top"
        >
          <el-form-item label="问题分类" prop="category">
            <el-select
              v-model="form.category"
              placeholder="请选择问题分类"
              style="width: 100%"
            >
              <el-option
                v-for="cat in categories"
                :key="cat.value"
                :label="cat.label"
                :value="cat.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="优先级" prop="priority">
            <el-radio-group v-model="form.priority">
              <el-radio-button value="low">
                <el-icon><TrendCharts /></el-icon>
                低
              </el-radio-button>
              <el-radio-button value="medium">
                <el-icon><Operation /></el-icon>
                中
              </el-radio-button>
              <el-radio-button value="high">
                <el-icon><Warning /></el-icon>
                高
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="主题" prop="subject">
            <el-input
              v-model="form.subject"
              placeholder="请简要描述您的问题"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="详细描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="8"
              placeholder="请详细描述您遇到的问题，包括相关的订单号、商品信息、遇到的具体问题等，以便我们更好地为您解决..."
              maxlength="5000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" @click="handleSubmit" :loading="submitting">
              <el-icon><Promotion /></el-icon>
              提交工单
            </el-button>
            <el-button size="large" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <div class="tips-card">
        <el-card>
          <template #header>
            <div class="tips-header">
              <el-icon :size="20" color="#f59e0b"><InfoFilled /></el-icon>
              <span>温馨提示</span>
            </div>
          </template>
          <ul class="tips-list">
            <li>工单提交后，我们的客服专员会在 1-2 个工作日内与您联系</li>
            <li>请确保填写的联系方式准确，以便我们能及时与您沟通</li>
            <li>如需紧急处理，请选择"高"优先级，并在描述中注明</li>
            <li>您可以在"我的工单"中查看所有历史工单及处理进度</li>
          </ul>
        </el-card>
      </div>
    </div>

    <el-dialog
      v-model="successVisible"
      title="提交成功"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="success-content">
        <div class="success-icon">
          <el-icon :size="64" color="#10b981"><CircleCheckFilled /></el-icon>
        </div>
        <h3 class="success-title">工单已成功提交</h3>
        <p class="success-desc">我们已收到您的工单，客服专员会尽快处理。</p>
        <div class="success-info">
          <div class="info-item">
            <span class="label">工单号：</span>
            <span class="value">#{{ ticketId }}</span>
          </div>
          <div class="info-item">
            <span class="label">问题分类：</span>
            <span class="value">{{ categoryMap[form.category] }}</span>
          </div>
          <div class="info-item">
            <span class="label">主题：</span>
            <span class="value">{{ form.subject }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="successVisible = false; handleReset()">继续提交</el-button>
        <el-button type="primary" @click="goToDetail">查看工单详情</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElForm } from 'element-plus';
import {
  ChatDotRound,
  List,
  TrendCharts,
  Operation,
  Warning,
  Promotion,
  InfoFilled,
  CircleCheckFilled
} from '@element-plus/icons-vue';
import { ticketsApi } from '@/api';

const router = useRouter();
const formRef = ref<InstanceType<typeof ElForm>>();

const submitting = ref(false);
const categories = ref([]);
const successVisible = ref(false);
const ticketId = ref(null);

const form = reactive({
  category: '',
  subject: '',
  description: '',
  priority: 'medium'
});

const rules = {
  category: [{ required: true, message: '请选择问题分类', trigger: 'change' }],
  subject: [
    { required: true, message: '请输入问题主题', trigger: 'blur' },
    { min: 2, max: 200, message: '主题长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入详细描述', trigger: 'blur' },
    { min: 10, max: 5000, message: '描述长度在 10 到 5000 个字符', trigger: 'blur' }
  ]
};

const categoryMap = {
  product: '商品问题',
  order: '订单问题',
  payment: '支付问题',
  account: '账户问题',
  shipping: '物流问题',
  other: '其他问题'
};

onMounted(loadCategories);

async function loadCategories() {
  try {
    categories.value = await ticketsApi.getCategories();
  } catch (e) {
    categories.value = Object.entries(categoryMap).map(([value, label]) => ({ value, label }));
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const res = await ticketsApi.create(form);
      ticketId.value = res.id;
      successVisible.value = true;
    } finally {
      submitting.value = false;
    }
  });
}

function handleReset() {
  formRef.value?.resetFields();
  form.category = '';
  form.subject = '';
  form.description = '';
  form.priority = 'medium';
}

function goToTickets() {
  router.push('/support/tickets');
}

function goToDetail() {
  if (ticketId.value) {
    router.push(`/support/ticket/${ticketId.value}`);
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

.support-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.form-card {
  min-height: 600px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
}

.tips-card {
  align-self: flex-start;
  position: sticky;
  top: 24px;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #64748b;
  line-height: 2;
}

.tips-list li {
  margin-bottom: 8px;
}

.success-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  margin-bottom: 16px;
}

.success-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #1e293b;
}

.success-desc {
  color: #64748b;
  margin: 0 0 24px;
}

.success-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #64748b;
  width: 80px;
  flex-shrink: 0;
}

.info-item .value {
  color: #1e293b;
  font-weight: 500;
}

@media (max-width: 900px) {
  .support-content {
    grid-template-columns: 1fr;
  }

  .tips-card {
    position: static;
    order: -1;
  }
}
</style>
