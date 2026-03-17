<!-- 文件用途：审计日志页面 -->
<template>
  <div class="koi-flex">
    <KoiCard>
      <div class="page-toolbar">
        <div></div>
        <div class="page-toolbar__actions">
          <el-tooltip content="隐藏搜索" placement="top">
            <el-button circle icon="Search" @click="toggleSearch" />
          </el-tooltip>
          <el-tooltip content="刷新" placement="top">
            <el-button circle icon="Refresh" @click="handleRefresh" />
          </el-tooltip>
          <el-tooltip content="导出" placement="top">
            <el-button circle icon="Download" @click="handleExport" />
          </el-tooltip>
          <el-tooltip content="设置" placement="top">
            <el-button circle icon="Setting" @click="handleSettings" />
          </el-tooltip>
        </div>
      </div>
      <div v-show="showSearch" class="search-placeholder">搜索区域占位</div>
      <div class="placeholder">页面建设中</div>
    </KoiCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const showSearch = ref(true);

const toggleSearch = () => {
  showSearch.value = !showSearch.value;
};

const handleRefresh = () => {};

const handleExport = () => {};

const handleSettings = () => {};
</script>

<style lang="scss" scoped>
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.page-toolbar__actions {
  display: flex;
  gap: 8px;
}

.search-placeholder {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px dashed #dcdfe6;
  color: #909399;
}

.placeholder {
  padding: 24px;
  text-align: center;
  color: #909399;
}
</style>
