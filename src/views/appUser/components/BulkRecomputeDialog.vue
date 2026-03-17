<template>
  <el-dialog v-model="visible" title="批量重算" width="520px">
    <div class="mb-2">将一键重算所有用户统计。</div>
    <div class="mb-2">高风险操作，为确保误操作，请在下方输入 <b>我确认</b> 后再执行。</div>
    <el-input v-model="confirmText" placeholder="请输入：我确认" />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :disabled="confirmText !== '我确认'" :loading="submitting" @click="handleConfirm">
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="js">
import { computed, defineEmits, defineProps, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { recomputeAllStats } from '@/api/stats';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'done']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const confirmText = ref('');
const submitting = ref(false);

function close() {
  emit('update:modelValue', false);
  confirmText.value = '';
  submitting.value = false;
}

async function handleConfirm() {
  if (confirmText.value !== '我确认' || submitting.value) return;
  submitting.value = true;
  try {
    const res = await recomputeAllStats();
    // 接口不再返回总数，提示统一文案
    ElMessage.success('任务提交成功，请不要短时间内多次提交此任务!');
    emit('done');
    close();
  } catch (e) {
    submitting.value = false;
  }
}
</script>

<style scoped>
.mb-2 { margin-bottom: 8px; }
</style>
