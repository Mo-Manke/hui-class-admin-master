<template>
  <div class="app-version-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>版本管理</span>
          <el-button type="primary" @click="handleAdd">新增版本</el-button>
        </div>
      </template>
      
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="version_name" label="版本名称" width="120" />
        <el-table-column prop="version_code" label="版本号" width="100" />
        <el-table-column prop="min_support_code" label="最低支持版本" width="120" />
        <el-table-column prop="is_force" label="强制更新" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_force ? 'danger' : 'info'">
              {{ scope.row.is_force ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="file_size" label="文件大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column prop="download_url" label="下载地址" show-overflow-tooltip />
        <el-table-column prop="change_log" label="更新说明" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增版本' : '编辑版本'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="文件来源">
          <el-radio-group v-model="fileSource" @change="onFileSourceChange">
            <el-radio label="url">填写URL</el-radio>
            <el-radio label="upload">上传文件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="版本名称" prop="version_name">
          <el-input v-model="form.version_name" placeholder="请输入版本名称" />
        </el-form-item>
        <el-form-item label="版本号" prop="version_code">
          <el-input-number v-model="form.version_code" :min="1" placeholder="请输入版本号" style="width: 40%" />
        </el-form-item>
        <el-form-item label="最低支持版本" prop="min_support_code">
          <el-input-number v-model="form.min_support_code" :min="1" placeholder="请输入最低支持版本" style="width: 40%" />
        </el-form-item>
        <el-form-item label="强制更新" prop="is_force">
          <el-switch v-model="form.is_force" />
        </el-form-item>
        <el-form-item v-if="fileSource === 'upload'" label="文件大小">
          <el-input v-model="form.file_size" disabled>
            <template #append>{{ formatFileSize(form.file_size) }}</template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="fileSource === 'upload'" label="安装包" prop="app_file">
          <KoiUploadFiles
            :isMultiple="false"
            acceptType=".apk,.ipa"
            :limit="1"
            :fileSize="200"
            :fileList="appFileList"
            @fileSuccess="handleFileSuccess"
            @fileRemove="handleFileRemove"
            action="/api/admin/upload">
            <template #content>
              <span>请上传安装包文件</span>
            </template>
            <template #tip>文件最大为 200M</template>
          </KoiUploadFiles>
        </el-form-item>
        <el-form-item v-else label="下载地址" prop="download_url">
          <el-input v-model="form.download_url" placeholder="请输入文件 URL（http/https）" />
        </el-form-item>
        <el-form-item v-if="fileSource === 'url'" label="文件大小(MB)" prop="file_size_mb">
          <el-input-number v-model="form.file_size_mb" :min="1" :precision="0" placeholder="请输入文件大小(MB)" style="width: 40%" />
        </el-form-item>
        <el-form-item label="更新说明" prop="change_log">
          <el-input
            v-model="form.change_log"
            type="textarea"
            :rows="4"
            placeholder="请输入更新说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAppVersionList, createAppVersion, updateAppVersion, deleteAppVersion } from '@/api/appVersion'

// 表格数据
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const form = ref({
  version_name: '',
  version_code: 1,
  min_support_code: 1,
  is_force: false,
  file_size: 0,
  download_url: '',
  change_log: '',
  app_file: '',
  file_size_mb: 0
})

// 文件来源：upload / url（默认 URL 模式）
const fileSource = ref('url')

// 文件上传列表
const appFileList = ref([])

// 表单验证规则
const rules = {
  version_name: [{ required: true, message: '请输入版本名称', trigger: 'blur' }],
  version_code: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  min_support_code: [{ required: true, message: '请输入最低支持版本', trigger: 'blur' }],
  app_file: [
    {
      validator: (rule, value, callback) => {
        if (fileSource.value === 'upload') {
          if (!form.value.download_url) return callback(new Error('请上传安装包'))
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  download_url: [
    {
      validator: (rule, value, callback) => {
        if (fileSource.value === 'url') {
          if (!value) return callback(new Error('请输入下载地址'))
          const ok = /^https?:\/\//.test(value)
          if (!ok) return callback(new Error('URL 必须以 http/https 开头'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  file_size_mb: [
    {
      validator: (rule, value, callback) => {
        if (fileSource.value === 'url') {
          const v = Number(value)
          if (!v || v <= 0) return callback(new Error('请输入文件大小(MB)'))
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// bytes 转 MB（取整显示）
const bytesToMB = (bytes) => {
  if (!bytes) return 0
  return Math.round(bytes / (1024 * 1024))
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 获取版本列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getAppVersionList({
      page: currentPage.value,
      per_page: pageSize.value
    })
    tableData.value = res.data
    total.value = res.total
  } catch (error) {
    console.error('获取版本列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 新增版本
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    version_name: '',
    version_code: 1,
    min_support_code: 1,
    is_force: false,
    file_size: 0,
    download_url: '',
    change_log: '',
    app_file: '',
    file_size_mb: 0
  }
  appFileList.value = []
  fileSource.value = 'url'
  dialogVisible.value = true
}

// 编辑版本
const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = { ...row }
  // 根据数据推断文件来源
  if (row.app_file) {
    fileSource.value = 'upload'
    appFileList.value = [{ name: row.app_file || row.download_url, url: row.download_url }]
    // 从 bytes 推导 MB 显示
    form.value.file_size_mb = bytesToMB(row.file_size)
  } else {
    fileSource.value = 'url'
    appFileList.value = []
    form.value.file_size_mb = bytesToMB(row.file_size)
  }
  dialogVisible.value = true
}

// 删除版本
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该版本吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteAppVersion(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      console.error('删除版本失败:', error)
    }
  })
}

// 文件上传成功
const handleFileSuccess = (data) => {
  form.value.app_file = data.name
  form.value.file_size = data.size
  form.value.download_url = data.filePath
}

// 文件移除
const handleFileRemove = () => {
  form.value.app_file = ''
  form.value.file_size = 0
  form.value.download_url = ''
}

// 切换文件来源
const onFileSourceChange = (val) => {
  if (val === 'upload') {
    // 清空 URL 字段
    form.value.download_url = ''
  } else {
    // 清空上传选择
    appFileList.value = []
    form.value.app_file = ''
    form.value.file_size = 0
    form.value.file_size_mb = 0
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // URL 模式不需要 app_file 与 file_size
        const payload = { ...form.value }
        if (fileSource.value === 'url') {
          payload.app_file = ''
          // 将 MB 转换为字节
          payload.file_size = Math.round(Number(payload.file_size_mb || 0) * 1024 * 1024)
        }
        if (dialogType.value === 'add') {
          await createAppVersion(payload)
          ElMessage.success('新增成功')
        } else {
          await updateAppVersion(form.value.id, payload)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        getList()
      } catch (error) {
        console.error('提交失败:', error)
      }
    }
  })
}

// 分页相关
const handleSizeChange = (val) => {
  pageSize.value = val
  getList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getList()
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-version-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 