<template>
  <el-dialog
    v-model="dialogVisible"
    title="键位类型管理"
    width="70%"
    @close="handleClose"
    :append-to-body="true"
    :destroy-on-close="true"
    align-center
  >
    <div class="mb-2">
      <el-button type="success" @click="handleAdd">新增</el-button>
    </div>

    <el-table
      v-loading="loading"
      border
      :data="keyTypes"
      empty-text="暂时没有数据哟"
      class="mb-4"
    >
      <el-table-column label="ID" prop="id" width="80px" align="center"></el-table-column>
      <el-table-column label="键位名称" prop="name" align="center"></el-table-column>
      <el-table-column label="键位图片" width="220px" align="center">
        <template #default="scope">
          <el-image
            v-if="scope.row.image_url"
            class="w-40 h-20"
            :preview-teleported="true"
            :preview-src-list="[baseUrl + scope.row.image_url]"
            :src="baseUrl + scope.row.image_url"
          >
            <template #error>
              <el-image class="c-[--el-color-primary]" :size="20">
                <CircleCloseFilled/>
              </el-image>
            </template>
          </el-image>
          <span v-else>暂无图片</span>
        </template>
      </el-table-column>
      <el-table-column label="键位数量" prop="key_count" width="100px" align="center"></el-table-column>
      <el-table-column label="行数" prop="row" width="80px" align="center"></el-table-column>
      <el-table-column label="列数" prop="column" width="80px" align="center"></el-table-column>
      <el-table-column label="描述" prop="description" align="center" :show-overflow-tooltip="true"></el-table-column>
      <el-table-column label="操作" align="center" width="150">
        <template #default="{ row }">
          <el-tooltip content="修改" placement="top">
            <el-button
              type="primary"
              icon="Edit"
              circle
              plain
              @click="handleUpdate(row)"
            ></el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button
              type="danger"
              icon="Delete"
              circle
              plain
              @click="handleDelete(row)"
            ></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-2 flex justify-end">
      <el-pagination
        v-model:current-page="searchParams.page"
        v-model:page-size="searchParams.limit"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSearch"
        @current-change="handleSearch"
      />
    </div>

    <!-- 新增/修改对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="formType === 'add' ? '新增键位类型' : '修改键位类型'"
      width="500px"
      append-to-body
    >
      <el-form ref="formRef" :rules="rules" :model="form" label-width="100px" status-icon>
        <el-form-item label="键位名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入键位名称" clearable/>
        </el-form-item>
        <el-form-item label="键位图片" prop="image_url">
          <KoiUploadImage
            v-model:imageUrl="form.image_url"
            action="/api/admin/upload">
            <template #content>
              <el-icon><Picture/></el-icon>
              <span>请上传键位图片</span>
            </template>
            <template #tip>图片最大为 3M</template>
          </KoiUploadImage>
        </el-form-item>
        <el-form-item label="键位数量" prop="key_count">
          <el-input-number
            v-model="form.key_count"
            :min="0"
            controls-position="right"
            placeholder="请输入键位数量"
          />
        </el-form-item>
        <el-form-item label="行数" prop="row">
          <el-input-number
            v-model="form.row"
            :min="1"
            controls-position="right"
            placeholder="请输入行数"
          />
        </el-form-item>
        <el-form-item label="列数" prop="column">
          <el-input-number
            v-model="form.column"
            :min="1"
            controls-position="right"
            placeholder="请输入列数"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入键位类型描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="formDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleFormSubmit" :loading="submitLoading">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { koiMsgBox, koiMsgError, koiNoticeError, koiNoticeSuccess } from '@/utils/koi'
import { getGameKeyTypeList, createGameKeyType, updateGameKeyType, deleteGameKeyType } from '@/api/gameType/index.js'
import { CircleCloseFilled, Picture } from '@element-plus/icons-vue'

const baseUrl = import.meta.env.VITE_SERVER

const props = defineProps({
  modelValue: Boolean,
  gameId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref()
const loading = ref(false)
const keyTypes = ref([])
const total = ref(0)
const formDialogVisible = ref(false)
const formType = ref('add')
const submitLoading = ref(false)

const searchParams = ref({
  page: 1,
  limit: 10,
  name: ''
})

const form = ref({
  id: null,
  name: '',
  image_url: '',
  key_count: 0,
  row: 1,
  column: 1,
  description: '',
  game_id: props.gameId
})

const rules = reactive({
  name: [{required: true, message: "请输入键位名称", trigger: "blur"}],
  key_count: [{required: true, message: "请输入键位数量", trigger: "blur"}],
  row: [{required: true, message: "请输入行数", trigger: "blur"}],
  column: [{required: true, message: "请输入列数", trigger: "blur"}]
})

// 监听对话框显示状态
watch(dialogVisible, (val) => {
  if (val) {
    loadKeyTypes()
  }
})

// 加载键位类型列表
const loadKeyTypes = async () => {
  try {
    loading.value = true
    const res = await getGameKeyTypeList(props.gameId)
    keyTypes.value = res.data
    total.value = res.pagination?.totalRecords || res.data.length
  } catch (error) {
    console.log(error)
    koiNoticeError("获取键位类型列表失败")
  } finally {
    loading.value = false
  }
}

// 新增
const handleAdd = () => {
  formType.value = 'add'
  resetForm()
  formDialogVisible.value = true
}

// 修改
const handleUpdate = (row) => {
  formType.value = 'update'
  form.value = { ...row }
  formDialogVisible.value = true
}

// 删除
const handleDelete = (row) => {
  koiMsgBox("确认删除该键位类型吗？")
    .then(async () => {
      try {
        await deleteGameKeyType(row.id)
        await loadKeyTypes()
        koiNoticeSuccess("删除成功")
      } catch (error) {
        console.log(error)
        koiNoticeError("删除失败，请重试")
      }
    })
    .catch(() => {
      koiMsgInfo("已取消删除")
    })
}

// 提交表单
const handleFormSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      koiMsgError("验证失败，请检查填写内容")
      return
    }
    try {
      submitLoading.value = true
      const {id, ...params} = form.value
      if (formType.value === 'update') {
        await updateGameKeyType(id, params)
        koiNoticeSuccess("修改成功")
      } else {
        await createGameKeyType(params)
        koiNoticeSuccess("创建成功")
      }
      formDialogVisible.value = false
      await loadKeyTypes()
    } catch (error) {
      console.log(error)
      koiNoticeError("操作失败，请重试")
    } finally {
      submitLoading.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  form.value = {
    id: null,
    name: '',
    image_url: '',
    key_count: 0,
    row: 1,
    column: 1,
    description: '',
    game_id: props.gameId
  }
}

// 关闭对话框
const handleClose = () => {
  resetForm()
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
</style> 