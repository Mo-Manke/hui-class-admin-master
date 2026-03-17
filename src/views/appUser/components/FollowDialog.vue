<template>
  <el-dialog  v-model="visible" :title="title" width="880px" :append-to-body="true">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="用户关注" name="following" />
      <el-tab-pane label="用户粉丝" name="followers" />
      <el-tab-pane label="用户互相关注" name="mutual" />
    </el-tabs>

    <el-table class="dialog-body-scroll" :data="list" v-loading="loading" border size="small">
      <el-table-column label="用户ID" prop="id" width="90" align="center" />
      <el-table-column label="用户账号" prop="username" width="160" align="center" :show-overflow-tooltip="true" />
      <el-table-column label="用户昵称" prop="nickname" width="160" align="center" :show-overflow-tooltip="true" />
      <el-table-column label="音乐数" width="90" align="center">
        <template #default="{ row }">{{ row.stats?.music_count ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="粉丝数" width="90" align="center">
        <template #default="{ row }">{{ row.stats?.followers_count ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="关注数" width="90" align="center">
        <template #default="{ row }">{{ row.stats?.following_count ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="互关数" width="90" align="center">
        <template #default="{ row }">{{ row.stats?.mutual_count ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="收藏总数" width="110" align="center">
        <template #default="{ row }">{{ row.stats?.music_collection_total ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="热度总数" width="110" align="center">
        <template #default="{ row }">{{ row.stats?.music_heat_total ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="歌单数" width="90" align="center">
        <template #default="{ row }">{{ row.stats?.gather_count ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="歌单播放总数" width="140" align="center">
        <template #default="{ row }">{{ row.stats?.gather_play_total ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="歌单浏览总数" width="140" align="center">
        <template #default="{ row }">{{ row.stats?.gather_view_total ?? 0 }}</template>
      </el-table-column>
    </el-table>

    <div class="mt-3 flex justify-end">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="pagination.totalRecords"
        :page-size="pagination.pageSize" :current-page="pagination.currentPage" :page-sizes="[10, 20, 50, 100]"
        @size-change="handleSizeChange" @current-change="handlePageChange" />
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="js">
import { computed, defineEmits, defineProps, reactive, ref, watch } from 'vue';
import { getFollowers, getFollowing, getMutual } from '@/api/follow/index.js';

const props = defineProps({ modelValue: Boolean, userId: [String, Number] });
const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const title = computed(() => '查看关注/粉丝信息');

const activeTab = ref('following');
const loading = ref(false);
const list = ref([]);
const pagination = reactive({ totalRecords: 0, totalPages: 0, currentPage: 1, pageSize: 20 });

watch(visible, (v) => {
  if (v) {
    // reset pagination when open
    pagination.currentPage = 1;
    pagination.pageSize = 20;
    activeTab.value = 'following';
    fetchData();
  }
});

function close() {
  emit('update:modelValue', false);
}

function handleTabChange() {
  pagination.currentPage = 1;
  fetchData();
}

function handlePageChange(page) {
  pagination.currentPage = page;
  fetchData();
}

function handleSizeChange(size) {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchData();
}

async function fetchData() {
  if (!props.userId) return;
  loading.value = true;
  try {
    const args = { user_id: props.userId, page: pagination.currentPage, limit: pagination.pageSize };
    let res;
    switch (activeTab.value) {
      case 'followers':
        res = await getFollowers(args);
        break;
      case 'mutual':
        res = await getMutual(args);
        break;
      default:
        res = await getFollowing(args);
    }
    list.value = res?.data || [];
    const p = res?.pagination || {};
    pagination.totalRecords = p.totalRecords || 0;
    pagination.totalPages = p.totalPages || 0;
    pagination.currentPage = p.currentPage || args.page;
    pagination.pageSize = p.pageSize || args.limit;
  } catch (e) {
    // ignore
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.mt-3 {
  margin-top: 12px;
}

.flex {
  display: flex;
}

.justify-end {
  justify-content: flex-end;
}
.dialog-body-scroll {
  max-height: calc(80vh - 240px); /* 👈 核心 */
  overflow-y: auto;
}
</style>
