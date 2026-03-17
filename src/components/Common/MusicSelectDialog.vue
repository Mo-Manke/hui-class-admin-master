<template>
  <el-dialog
    v-model="dialogVisible"
    title="添加音乐"
    width="70%"
    @close="handleClose"
    :append-to-body="true"
    :destroy-on-close="true"
    align-center
  >
    <el-form :inline="true" class="mb-2">
      <el-form-item label="歌曲名称">
        <el-input
          v-model="searchParams.music_name"
          placeholder="请输入歌曲名称"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="歌曲作者">
        <el-input
          v-model="searchParams.music_author"
          placeholder="请输入歌曲作者"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 已选歌曲展示区域 -->
    <div v-if="selectedMusic.length > 0" class="mb-3">
      <div class="flex justify-between items-center mb-2">
        <div class="font-bold">已选择 {{ selectedMusic.length }} 首歌曲</div>
        <el-button type="primary" size="small" @click="handleBatchAdd">批量添加</el-button>
      </div>
      <div class="selected-music-container">
        <el-tag 
          v-for="item in selectedMusic" 
          :key="item.id" 
          class="mx-1 mb-1"
          closable
          @close="removeSelectedMusic(item)"
        >
          {{ item.music_name }} - {{ item.music_author }}
        </el-tag>
      </div>
    </div>

    <el-table
      ref="tableRef"
      :data="tableData"
      border
      v-loading="tableLoading"
      @selection-change="handleSelectionChange"
      row-key="id"
    >
      <el-table-column type="selection" width="55" :reserve-selection="true" />
      <el-table-column label="歌曲ID" prop="id" width="80" align="center" />
      <el-table-column label="歌曲名称" prop="music_name" />
      <el-table-column label="歌曲作者" prop="music_author" width="150" align="center" />
      <el-table-column label="操作" width="100" align="center">
        <template #default="scope">
          <el-button 
            type="primary" 
            link
            @click="handleSingleSelect(scope.row)"
          >
            添加
          </el-button>
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
  </el-dialog>
</template>

<script setup>
import {ref, computed, onMounted, nextTick} from "vue";
import { getMusicList } from '@/api/music'
import { koiNoticeError, koiNoticeSuccess } from '@/utils/koi'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'select', 'batch-select'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const searchParams = ref({
  page: 1,
  limit: 10,
  music_name: '',
  music_author: ''
})

const tableLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedMusic = ref([])
const tableRef = ref(null)

const handleSearch = async () => {
  tableLoading.value = true
  try {
    const params = {
      page: searchParams.value.page,
      limit: searchParams.value.limit,
      ...(searchParams.value.music_name && { music_name: searchParams.value.music_name }),
      ...(searchParams.value.music_author && { music_author: searchParams.value.music_author })
    }
    const res = await getMusicList(params)
    tableData.value = res.data
    total.value = res.pagination.totalRecords
    
    // 在数据加载完成后，重新恢复表格选中状态
    nextTick(() => {
      restoreSelection()
    })
  } catch (error) {
    console.log(error)
    koiNoticeError("获取音乐列表失败")
  }
  tableLoading.value = false
}

// 恢复表格的选中状态
const restoreSelection = () => {
  if (tableRef.value && selectedMusic.value.length > 0) {
    // 遍历当前页表格数据，如果在已选列表中存在，则选中该行
    tableData.value.forEach(row => {
      if (selectedMusic.value.some(item => item.id === row.id)) {
        tableRef.value.toggleRowSelection(row, true)
      }
    })
  }
}

const resetSearch = () => {
  searchParams.value = {
    page: 1,
    limit: 10,
    music_name: '',
    music_author: ''
  }
  handleSearch()
}

const handleSelectionChange = (selection) => {
  // 获取当前页的所有ID
  const currentPageIds = tableData.value.map(item => item.id)
  
  // 保留不在当前页的选中项
  const notInCurrentPage = selectedMusic.value.filter(item => 
    !currentPageIds.includes(item.id)
  )
  
  // 使用Map确保每个ID只存在一次
  const musicMap = new Map()
  
  // 添加非当前页的已选项
  notInCurrentPage.forEach(item => {
    musicMap.set(item.id, item)
  })
  
  // 添加当前页新选中的项
  selection.forEach(item => {
    musicMap.set(item.id, item)
  })
  
  // 转换回数组
  selectedMusic.value = Array.from(musicMap.values())
}

const handleSingleSelect = (row) => {
  emit('select', row)
  dialogVisible.value = false
}

const handleBatchAdd = () => {
  if (selectedMusic.value.length === 0) {
    koiNoticeError("请至少选择一首歌曲")
    return
  }
  
  emit('batch-select', selectedMusic.value)
  dialogVisible.value = false
}

const removeSelectedMusic = (music) => {
  // 从选中列表中移除
  selectedMusic.value = selectedMusic.value.filter(item => item.id !== music.id)
  
  // 如果当前页面有这条数据，也需要取消表格中的选中状态
  if (tableRef.value) {
    const rowInCurrentPage = tableData.value.find(row => row.id === music.id)
    if (rowInCurrentPage) {
      tableRef.value.toggleRowSelection(rowInCurrentPage, false)
    }
  }
}

const handleClose = () => {
  selectedMusic.value = []
  resetSearch()
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.selected-music-container {
  max-height: 100px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
</style> 
