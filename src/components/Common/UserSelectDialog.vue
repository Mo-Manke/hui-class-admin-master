<template>
  <el-dialog v-model="dialogVisible" title="选择创建者" width="60%" @close="handleClose">
    <el-form :inline="true" class="mb-4">
      <el-form-item label="用户账号">
        <el-input v-model="searchParams.username" placeholder="请输入用户账号" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="用户昵称">
        <el-input v-model="searchParams.nickname" placeholder="请输入用户昵称" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="用户状态">
        <el-select v-model="searchParams.user_state" placeholder="请选择用户状态" clearable style="width: 120px">
          <el-option v-for="item in userStateOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="tableLoading" :data="tableData" height="400" @row-click="handleSelect" highlight-current-row>
      <el-table-column label="用户头像" width="100" align="center">
        <template #default="scope">
          <el-image class="w-36px h-36px rounded-full"
            :src="scope.row.avatar.includes('http') ? scope.row.avatar : baseUrl + scope.row.avatar">
            <template #error>
              <el-icon class="c-[--el-color-primary]" :size="24">
                <UserFilled />
              </el-icon>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户账号" />
      <el-table-column prop="nickname" label="用户昵称" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.user_state ? 'success' : 'danger'">
            {{ scope.row.user_state ? "正常" : "禁用" }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-pagination v-model:current-page="searchParams.page" v-model:page-size="searchParams.limit"
        :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next" @size-change="handleSearch"
        @current-change="handleSearch" />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { UserFilled } from '@element-plus/icons-vue'
import { getAppUserList } from '@/api/appUser'
import { koiNoticeError } from '@/utils/koi'

const baseUrl = import.meta.env.VITE_SERVER

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'select'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const searchParams = ref({
  page: 1,
  limit: 10,
  username: '',
  nickname: '',
  user_state: null
})

const userStateOptions = [
  { label: '全部', value: null },
  { label: '正常', value: true },
  { label: '禁用', value: false }
]

const tableLoading = ref(false)
const tableData = ref([])
const total = ref(0)

const handleSearch = async () => {
  tableLoading.value = true
  try {
    const params = {
      page: searchParams.value.page,
      limit: searchParams.value.limit,
      ...Object.entries(searchParams.value).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && key !== 'page' && key !== 'limit') {
          acc[key] = value
        }
        return acc
      }, {})
    }
    const res = await getAppUserList(params)
    tableData.value = res.data
    total.value = res.pagination.totalRecords
  } catch (error) {
    console.log(error)
    koiNoticeError("获取用户列表失败")
  }
  tableLoading.value = false
}

const resetSearch = () => {
  searchParams.value = {
    page: 1,
    limit: 10,
    username: '',
    nickname: '',
    user_state: null
  }
  handleSearch()
}

const handleSelect = (row) => {
  emit('select', row)
  dialogVisible.value = false
}

const handleClose = () => {
  resetSearch()
}

onMounted(() => {
  handleSearch()
})
</script>
