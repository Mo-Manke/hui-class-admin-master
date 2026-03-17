<!-- 文件用途：配置编辑弹窗 -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="720px"
    :body-style="{ maxHeight: '70vh', overflow: 'auto' }"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" status-icon>
      <el-form-item label="配置键" prop="config_key">
        <el-input v-model="form.config_key" :disabled="isEdit" placeholder="请输入配置键" />
      </el-form-item>
      <el-form-item label="配置类型" prop="config_type">
        <el-select v-model="form.config_type" :disabled="isEdit" placeholder="请选择类型">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="配置值" prop="config_value">
        <el-input v-if="activeType === 'string'" v-model="valueState.stringValue" placeholder="请输入配置值" clearable />
        <el-input-number v-else-if="activeType === 'int'" v-model="valueState.numberValue" :precision="0" :controls="false" class="value-input" />
        <el-input-number v-else-if="activeType === 'float'" v-model="valueState.numberValue" :precision="2" :controls="false" class="value-input" />
        <el-switch v-else-if="activeType === 'boolean'" v-model="valueState.booleanValue" />
        <el-input v-else-if="activeType === 'json'" v-model="valueState.jsonValue" type="textarea" :rows="6" placeholder="请输入 JSON" />
        <MdEditor v-else-if="activeType === 'md'" v-model="valueState.mdValue" style="height: 360px" />
        <div v-else-if="activeType === 'richtext'" class="richtext-editor">
          <QuillEditor v-model:content="valueState.richTextValue" content-type="html" theme="snow" :options="quillOptions" />
        </div>
        <el-input v-else v-model="valueState.stringValue" placeholder="请输入配置值" clearable />
      </el-form-item>
      <el-form-item label="说明" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选说明" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import type { AppConfigView } from "@/api/system/appConfigs/type";
import { koiMsgError } from "@/utils/koi";

interface ConfigTypeOption {
  label: string;
  value: string;
}

interface SubmitPayload {
  mode: "create" | "edit";
  id?: number | null;
  data: {
    config_key: string;
    config_type: string;
    config_value: string;
    description?: string | null;
    updatedAt?: string | null;
  };
}

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  record: AppConfigView | null;
  typeOptions: ConfigTypeOption[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", payload: SubmitPayload): void;
}>();

const formRef = ref();

const form = reactive({
  id: null as number | null,
  config_key: "",
  config_type: "string",
  config_value: "",
  description: "",
  updatedAt: ""
});

const valueState = reactive({
  stringValue: "",
  numberValue: null as number | null,
  booleanValue: false,
  jsonValue: "",
  mdValue: "",
  richTextValue: ""
});

const quillOptions = {
  placeholder: "请输入内容"
};

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const isEdit = computed(() => props.mode === "edit");
const dialogTitle = computed(() => (props.mode === "edit" ? "编辑配置" : "新增配置"));

const normalizeType = (value?: string) => {
  const type = String(value || "").toLowerCase();
  if (type === "markdown") return "md";
  if (type === "int" || type === "float" || type === "boolean" || type === "json" || type === "richtext" || type === "string") {
    return type;
  }
  if (type === "md") return "md";
  return "string";
};

const activeType = computed(() => normalizeType(form.config_type));

const resetValueState = () => {
  valueState.stringValue = "";
  valueState.numberValue = null;
  valueState.booleanValue = false;
  valueState.jsonValue = "";
  valueState.mdValue = "";
  valueState.richTextValue = "";
};

const formatJsonValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const normalizeValue = (type: string, value: unknown) => {
  switch (type) {
    case "boolean":
      valueState.booleanValue = value === true || value === "true" || value === 1 || value === "1";
      break;
    case "int":
    case "float": {
      const num = Number(value);
      valueState.numberValue = Number.isNaN(num) ? null : num;
      break;
    }
    case "json":
      valueState.jsonValue = formatJsonValue(value);
      break;
    case "md":
      valueState.mdValue = value ? String(value) : "";
      break;
    case "richtext":
      valueState.richTextValue = value ? String(value) : "";
      break;
    default:
      valueState.stringValue = value ? String(value) : "";
      break;
  }
};

const syncFormFromRecord = () => {
  resetValueState();
  if (props.mode === "edit" && props.record) {
    form.id = props.record.id;
    form.config_key = props.record.config_key;
    form.config_type = props.record.config_type || "string";
    form.config_value = "";
    form.description = props.record.description || "";
    form.updatedAt = props.record.updatedAt || "";
    normalizeValue(normalizeType(form.config_type), props.record.config_value);
  } else {
    form.id = null;
    form.config_key = "";
    form.config_type = "string";
    form.config_value = "";
    form.description = "";
    form.updatedAt = "";
  }
};

watch(
  () => props.modelValue,
  value => {
    if (value) {
      syncFormFromRecord();
    }
  }
);

watch(
  () => props.record,
  () => {
    if (props.modelValue) {
      syncFormFromRecord();
    }
  }
);

watch(
  () => form.config_type,
  () => {
    if (!isEdit.value) {
      resetValueState();
    }
  }
);

const validateValue = (_rule: unknown, _value: string, callback: (error?: Error) => void) => {
  const type = activeType.value;
  if (type === "boolean") {
    callback();
    return;
  }
  if (type === "int" || type === "float") {
    if (valueState.numberValue === null || Number.isNaN(Number(valueState.numberValue))) {
      callback(new Error("请输入数字"));
      return;
    }
    callback();
    return;
  }
  if (type === "json") {
    if (!valueState.jsonValue.trim()) {
      callback(new Error("请输入 JSON"));
      return;
    }
    try {
      JSON.parse(valueState.jsonValue);
      callback();
    } catch {
      callback(new Error("JSON 格式错误"));
    }
    return;
  }
  const textValue = type === "md" ? valueState.mdValue : type === "richtext" ? valueState.richTextValue : valueState.stringValue;
  if (!String(textValue || "").trim()) {
    callback(new Error("请输入配置值"));
    return;
  }
  callback();
};

const rules = reactive({
  config_key: [{ required: true, message: "请输入配置键", trigger: "blur" }],
  config_type: [{ required: true, message: "请选择配置类型", trigger: "change" }],
  config_value: [{ validator: validateValue, trigger: "blur" }]
});

const buildConfigValue = () => {
  const type = activeType.value;
  if (type === "boolean") return valueState.booleanValue ? "true" : "false";
  if (type === "int" || type === "float") return String(valueState.numberValue ?? "");
  if (type === "json") return valueState.jsonValue.trim();
  if (type === "md") return valueState.mdValue.trim();
  if (type === "richtext") return valueState.richTextValue.trim();
  return valueState.stringValue.trim();
};

const handleSubmit = () => {
  if (!formRef.value) return;
  formRef.value.validate((valid: boolean) => {
    if (!valid) {
      koiMsgError("验证失败");
      return;
    }
    const payload: SubmitPayload = {
      mode: props.mode,
      id: form.id,
      data: {
        config_key: form.config_key.trim(),
        config_type: form.config_type,
        config_value: buildConfigValue(),
        description: form.description ? form.description.trim() : null,
        updatedAt: form.updatedAt || null
      }
    };
    emit("submit", payload);
  });
};

const handleClose = () => {
  formRef.value?.clearValidate();
};
</script>

<style lang="scss" scoped>
.value-input {
  width: 100%;
}

.richtext-editor {
  border: 1px solid var(--el-border-color);
}
</style>
