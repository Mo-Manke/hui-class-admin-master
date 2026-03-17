<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true">
        <el-form-item label="歌单编号" prop="id">
          <el-input
            type="number"
            placeholder="歌单id"
            v-model="searchParams.id"
            clearable
            style="width: 200px"
            @keyup.enter.native="handleListPage"
          ></el-input>
        </el-form-item>
        <el-form-item label="歌单名称" prop="list_title">
          <el-input
            placeholder="歌单名称"
            v-model="searchParams.list_title"
            clearable
            style="width: 200px"
            @keyup.enter.native="handleListPage"
          ></el-input>
        </el-form-item>
        <el-form-item label="公开状态" prop="is_public">
          <el-select
            placeholder="请选择公开状态"
            v-model="searchParams.is_public"
            clearable
            style="width: 240px"
            @keyup.enter.native="handleListPage"
          >
            <el-option label="公开" :value="1"/>
            <el-option label="私密" :value="0"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格头部按钮 -->
      <el-row :gutter="10">
        <el-col :span="1.5">
          <el-button type="primary" icon="plus" plain @click="handleAdd()">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" icon="delete" plain @click="handleBatchDelete()" :disabled="multiple">删除
          </el-button>
        </el-col>
        <KoiToolbar v-model:showSearch="showSearch" @refreshTable="handleListPage"></KoiToolbar>
      </el-row>

      <br/>
      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        border
        :data="playlistList"
        empty-text="暂时没有数据哟"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"/>
        <el-table-column label="id" prop="id" width="80px" align="center"></el-table-column>
        <el-table-column
          label="歌单名称"
          prop="list_title"
          width="200px"
          align="center"
          :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column label="公开状态" prop="is_public" width="150px" align="center">
          <template #default="scope">
            <el-tag :type="Number(scope.row.is_public) === 1 ? 'success' : 'info'">
              {{ Number(scope.row.is_public) === 1 ? "公开" : "私密" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="歌单封面" prop="list_cover" width="150px" align="center">
          <template #default="scope">
            <div class="flex justify-center">
              <el-image
                class="w-36px h-36px"
                :preview-teleported="true"
                :preview-src-list="[baseUrl + scope.row.list_cover]"
                :src="baseUrl + scope.row.list_cover"
              >
                <template #error>
                  <el-icon class="c-[--el-color-primary]" :size="36">
                    <CircleCloseFilled/>
                  </el-icon>
                </template>
              </el-image>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="播放次数"
          prop="play_number"
          width="120px"
          align="center"
        ></el-table-column>
        <el-table-column
          label="查看次数"
          prop="look_number"
          width="120px"
          align="center"
        ></el-table-column>
        <el-table-column label="创建时间" prop="createdAt" width="190px" align="center"></el-table-column>
        <el-table-column label="更新时间" prop="updatedAt" width="190px" align="center"></el-table-column>
        <el-table-column
          label="创建者"
          width="150px"
          align="center"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <div v-if="scope.row.app_user" class="flex items-center justify-center">
              <el-image
                  class="w-24px h-24px rounded-full mr-2"
                  :src="baseUrl + scope.row.app_user.avatar"
                  :preview-src-list="[baseUrl + scope.row.app_user.avatar]"
              >
                <template #error>
                  <el-icon class="c-[--el-color-primary]" :size="24">
                    <UserFilled/>
                  </el-icon>
                </template>
              </el-image>
              <span>{{ scope.row.app_user.nickname || scope.row.app_user.username }}</span>
            </div>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="歌曲列表" placement="top">
              <el-button
                type="primary"
                icon="List"
                circle
                plain
                @click="handleShowMusicList(row)"
              ></el-button>
            </el-tooltip>
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
      <br/>
      <!-- 分页 -->
      <el-pagination
        background
        v-model:current-page="searchParams.page"
        v-model:page-size="searchParams.limit"
        v-show="total > 0"
        :page-sizes="[10, 20, 50, 100, 200]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleListPage"
        @current-change="handleListPage"
      />

      <!-- 添加 OR 修改 -->
      <KoiDrawer
        ref="koiDrawerRef"
        :title="title"
        @koiConfirm="handleConfirm"
        @koiCancel="handleCancel"
        :loading="confirmLoading"
      >
        <template #content>
          <el-form ref="formRef" :rules="rules" :model="form" label-width="80px" status-icon>
            <el-row>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="歌单名称" prop="list_title">
                  <el-input v-model="form.list_title" placeholder="请输入歌单名称" clearable/>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="创建者" prop="appUserId">
                  <div class="flex items-center">
                    <el-button 
                      type="primary" 
                      @click="openUserDialog"
                      :icon="Plus"
                    >选择创建者</el-button>
                    <div v-if="selectedUser" class="ml-4 flex items-center">
                      <el-image
                        class="w-24px h-24px rounded-full mr-2"
                        :src="baseUrl + selectedUser.avatar"
                      >
                        <template #error>
                          <el-icon class="c-[--el-color-primary]" :size="24">
                            <UserFilled/>
                          </el-icon>
                        </template>
                      </el-image>
                      <span>{{ selectedUser.nickname || selectedUser.username }}</span>
                      <el-button 
                        type="danger" 
                        link 
                        class="ml-2"
                        @click="clearSelectedUser"
                      >
                        <el-icon><Close /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="公开状态" prop="is_public">
                  <el-select placeholder="请选择公开状态" v-model="form.is_public" clearable>
                    <el-option label="公开" :value="1"/>
                    <el-option label="私密" :value="0"/>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="播放次数" prop="play_number">
                  <el-input type="number" v-model.number="form.play_number" placeholder="请输入播放次数" clearable/>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="查看次数" prop="look_number">
                  <el-input type="number" v-model.number="form.look_number" placeholder="请输入查看次数" clearable/>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="歌单封面" prop="list_cover">
                  <KoiUploadImage
                    v-model:imageUrl="form.list_cover"
                    action="/api/admin/upload">
                    <template #content>
                      <el-icon>
                        <Picture/>
                      </el-icon>
                      <span>请上传歌单封面</span>
                    </template>
                    <template #tip>图片最大为 3M</template>
                  </KoiUploadImage>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>
      </KoiDrawer>

      <!-- 用户选择对话框 -->
      <UserSelectDialog
        v-model="userDialogVisible"
        @select="handleSelectUser"
      />

      <!-- 歌曲列表对话框 -->
      <el-dialog
        v-model="musicDialogVisible"
        :title="`歌单 [${currentPlaylist?.list_title || ''}] 的歌曲列表`"
        width="80%"
        :append-to-body="true"
        :destroy-on-close="true"
        align-center
      >
        <el-form :inline="true" class="mb-2">
          <el-form-item>
            <el-button type="primary" icon="Plus" @click="handleShowAddMusic(currentPlaylist)">添加音乐</el-button>
          </el-form-item>
          <el-form-item label="歌曲名称">
            <el-input
              v-model="currentPlaylist.musicSearchParams.music_name"
              placeholder="请输入歌曲名称"
              clearable
              @keyup.enter="() => handleMusicSearch(currentPlaylist)"
            />
          </el-form-item>
          <el-form-item label="歌曲作者">
            <el-input
              v-model="currentPlaylist.musicSearchParams.music_author"
              placeholder="请输入歌曲作者"
              clearable
              @keyup.enter="() => handleMusicSearch(currentPlaylist)"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="() => handleMusicSearch(currentPlaylist)">搜索</el-button>
            <el-button @click="() => resetMusicSearch(currentPlaylist)">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table
          :data="currentPlaylist.musicList"
          border
          v-loading="musicTableLoading"
        >
          <el-table-column label="歌曲ID" prop="id" width="80" align="center" />
          <el-table-column label="歌曲名称" prop="music_name" />
          <el-table-column label="歌曲作者" prop="music_author" width="150" align="center" />
          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <el-button
                type="danger"
                icon="Delete"
                circle
                plain
                @click="handleDeleteMusic(currentPlaylist, scope.row)"
              />
            </template>
          </el-table-column>
        </el-table>

        <div class="mt-2 flex justify-end">
          <el-pagination
            v-model:current-page="currentPlaylist.musicSearchParams.page"
            v-model:page-size="currentPlaylist.musicSearchParams.limit"
            :page-sizes="[10, 20, 50]"
            :total="currentPlaylist.musicTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="() => handleMusicSearch(currentPlaylist)"
            @current-change="() => handleMusicSearch(currentPlaylist)"
          />
        </div>
      </el-dialog>

      <!-- 添加音乐选择对话框 -->
      <MusicSelectDialog
        v-model="addMusicDialogVisible"
        @select="handleSelectMusic"
        @batch-select="handleBatchSelectMusic"
        :append-to-body="true"
        :destroy-on-close="true"
        align-center
      />
    </KoiCard>
  </div>
</template>

<script setup lang="js">
import {onMounted, reactive, ref} from "vue";
import {
  createPlaylist,
  deleteMultiplePlaylists,
  deletePlaylistById,
  getPlaylistList,
  updatePlaylist,
  getPlaylistMusicList,
  deletePlaylistMusic,
  addPlaylistMusic,
  batchAddPlaylistMusic,
} from "@/api/music/playlist/api.ts";
import {koiMsgBox, koiMsgError, koiMsgInfo, koiMsgWarning, koiNoticeError, koiNoticeSuccess} from "@/utils/koi.ts";
import {koiDatePicker} from "@/utils/index.ts";
import { getAppUserList } from "@/api/appUser";
import UserSelectDialog from '@/components/Common/UserSelectDialog.vue'
import MusicSelectDialog from '@/components/Common/MusicSelectDialog.vue'

const baseUrl = import.meta.env.VITE_SERVER;
// 数据表格加载页面动画
const loading = ref(false);
//歌单列表
const playlistList = ref([]);
// 查询参数
const searchParams = ref({
  page: 1,
  limit: 10,
  id: "",
  list_title: "",
  is_public: null,
});
const ids = ref([]); // 选中数组
const single = ref(true); // 非单个禁用
const multiple = ref(true); // 非多个禁用
const showSearch = ref(true); // 默认显示搜索条件
const total = ref(0);
const dateRange = ref();
const title = ref("歌单管理");
const confirmLoading = ref(false);
const formRef = ref();
const form = ref({
  id: null,
  list_title: "",
  list_cover: "",
  play_number: 0,
  look_number: 0,
  status: 1,
  is_public: 1,
  appUserId: null,
});

const rules = reactive({
  list_title: [{required: true, message: "请输入歌单名称", trigger: "blur"}],
  list_cover: [{required: true, message: "请上传歌单封面", trigger: "blur"}],
  appUserId: [{required: true, message: "请选择创建者", trigger: "change"}],
});

const koiDrawerRef = ref();
const formType = ref(null);

// 在导入部分添加
import { UserFilled, Plus, Close } from '@element-plus/icons-vue'
import {getMusicList} from "@/api/music/index.js";

// 在已有的响应式变量后添加用户选择相关的变量
const userDialogVisible = ref(false)
const userTableLoading = ref(false)
const userTableData = ref([])
const selectedUser = ref(null)

// 用户搜索相关变量
const userSearchParams = ref({
  page: 1,
  limit: 10,
  username: '',
  nickname: '',
  user_state: null
})
const userTotal = ref(0)

// 用户状态选项配置
const userStateOptions = [
  { label: '全部', value: null },
  { label: '正常', value: true },
  { label: '禁用', value: false }
]

/** 是否多选 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

/** 数据表格 */
const handleListPage = async () => {
  try {
    loading.value = true;
    playlistList.value = [];
    const listParams = {
      page: searchParams.value.page,
      limit: searchParams.value.limit,
      ...(searchParams.value.id && { id: searchParams.value.id }),
      ...(searchParams.value.list_title && { list_title: searchParams.value.list_title }),
      ...(typeof searchParams.value.is_public === "number" ? { is_public: searchParams.value.is_public } : {}),
    };
    const res = await getPlaylistList(koiDatePicker(listParams, dateRange.value));
    playlistList.value = res.data.map(item => {
      item.createdAt && (item.createdAt = new Date(item.createdAt).toLocaleString());
      item.updatedAt && (item.updatedAt = new Date(item.updatedAt).toLocaleString());
      // 初始化每个歌单的音乐列表相关数据
      item.musicList = [];
      item.musicTotal = 0;
      item.musicSearchParams = {
        id: item.id,
        page: 1,
        limit: 10,
        music_name: ''
      };
      return item;
    });
    total.value = res.pagination.totalRecords;
    loading.value = false;
  } catch (error) {
    console.log(error);
    koiNoticeError("数据查询失败，请刷新重试");
  }
};

/** 搜索 */
const handleSearch = () => {
  searchParams.value.page = 1;
  handleListPage();
};

/** 重置 */
const resetSearch = () => {
  resetSearchParams();
  handleListPage();
};

// 重置搜索参数
const resetSearchParams = () => {
  searchParams.value = {
    page: 1,
    limit: 10,
    id: "",
    list_title: "",
    is_public: null,
  };
  dateRange.value = [];
};

//新增歌单
const handleAdd = async () => {
  koiDrawerRef.value.koiOpen();
  resetForm();
  formType.value = "create";
  title.value = "添加歌单";
};

//删除单个歌单
const handleDelete = async (row) => {
  const list_title = row.list_title;
  if (list_title == null || list_title === "") {
    koiMsgWarning("出错，list_title未知.");
    return;
  }
  koiMsgBox("您确认需要删除[" + row.list_title + "]么？")
    .then(async () => {
      try {
        await deletePlaylistById(row.id);
        await handleListPage();
        koiNoticeSuccess("删除成功");
      } catch (error) {
        console.log(error);
        await handleListPage();
        koiNoticeError("删除失败，请刷新重试");
      }
    })
    .catch(() => {
      koiMsgError("已取消");
    });
};

/** 批量删除 */
const handleBatchDelete = () => {
  if (ids.value.length === 0) {
    koiMsgInfo("请选择需要删除的数据");
    return;
  }
  koiMsgBox("您确认需要进行批量删除么？")
    .then(async () => {
      try {
        await deleteMultiplePlaylists(ids.value);
        await handleListPage();
        koiNoticeSuccess("批量删除成功");
      } catch (error) {
        console.log(error);
        koiNoticeError("批量删除失败，请刷新重试");
      }
    })
    .catch(() => {
      koiMsgError("已取消");
    });
};

/** 修改 */
const handleUpdate = async (row) => {
  const playlistId = row ? row.id : ids.value[0];
  if (playlistId == null || playlistId === "") {
    koiMsgError("错误，item未被选中");
    return;
  }
  resetForm();
  form.value = {
    ...row,
    is_public: Number(row.is_public) ? 1 : 0,
    play_number: Number(row.play_number) || 0,
    look_number: Number(row.look_number) || 0,
  };
  // 设置选中的用户
  if (row.app_user) {
    selectedUser.value = row.app_user
  }
  formType.value = "update";
  title.value = "修改歌单信息";
  koiDrawerRef.value.koiOpen();
};

/** 清空表单数据 */
const resetForm = () => {
  formRef.value && formRef.value.resetFields && formRef.value.resetFields();
  selectedUser.value = null // 清除选中用户
  form.value = {
    id: null,
    list_title: "",
    list_cover: "",
    play_number: 0,
    look_number: 0,
    status: 1,
    is_public: 1,
    appUserId: null,
  };
};

/** 确定  */
const handleConfirm = () => {
  if (!formRef.value) return;
  confirmLoading.value = true;
  formRef.value.validate(async (valid) => {
    if (!valid) {
      koiMsgError("验证失败，请检查填写内容");
      confirmLoading.value = false;
      return;
    }
    try {
      const {id, ...params} = form.value;
      // ??????????????
      params.play_number = Number(params.play_number) || 0;
      params.look_number = Number(params.look_number) || 0;
      switch (formType.value) {
        case "create":
          await createPlaylist(params);
          koiNoticeSuccess("创建成功.");
          break;
        case "update":
          await updatePlaylist(id, params);
          koiNoticeSuccess("更新成功.");
          break;
      }
      confirmLoading.value = false;
      koiDrawerRef.value.koiQuickClose();
      resetForm();
      await handleListPage();
    } catch (error) {
      console.log(error);
      confirmLoading.value = false;
      koiNoticeError("操作失败，请刷新重试.");
    }
  });
};

/** 取消 */
const handleCancel = () => {
  koiDrawerRef.value.koiClose();
};

// 添加用户选择相关的方法
// 打开用户选择对话框
const openUserDialog = async () => {
  userDialogVisible.value = true
  // 重置搜索条件并获取第一页数据
  resetUserSearch()
}

// 选择用户
const handleSelectUser = (row) => {
  selectedUser.value = row
  form.value.appUserId = row.id
  userDialogVisible.value = false
}

// 清除已选用户
const clearSelectedUser = () => {
  selectedUser.value = null
  form.value.appUserId = null
}

// 用户搜索方法
const handleUserSearch = async () => {
  userTableLoading.value = true
  try {
    // 处理搜索参数，过滤掉空值
    const params = {
      page: userSearchParams.value.page,
      limit: userSearchParams.value.limit,
      ...Object.entries(userSearchParams.value).reduce((acc, [key, value]) => {
        // 只保留非空值且不是分页参数的字段
        if (value !== '' && value !== null && key !== 'page' && key !== 'limit') {
          acc[key] = value
        }
        return acc
      }, {})
    }
    const res = await getAppUserList(params)
    userTableData.value = res.data
    userTotal.value = res.pagination.totalRecords
  } catch (error) {
    console.log(error)
    koiNoticeError("获取用户列表失败")
  }
  userTableLoading.value = false
}

// 重置用户搜索
const resetUserSearch = () => {
  userSearchParams.value = {
    page: 1,
    limit: 10,
    username: '',
    nickname: '',
    user_state: null
  }
  handleUserSearch()
}

// 修改音乐搜索方法
const handleMusicSearch = async (row) => {
  try {
    // 过滤掉空字符串参数
    const params = {
      id: row.id,
      page: row.musicSearchParams.page,
      limit: row.musicSearchParams.limit,
      ...(row.musicSearchParams.music_name && { music_name: row.musicSearchParams.music_name }),
      ...(row.musicSearchParams.music_author && { music_author: row.musicSearchParams.music_author })
    };
    const res = await getPlaylistMusicList(params);
    row.musicList = res.data;
    row.musicTotal = res.pagination.totalRecords;
  } catch (error) {
    console.log(error);
    koiNoticeError("获取歌曲列表失败");
  }
};

// 重置音乐搜索
const resetMusicSearch = (row) => {
  row.musicSearchParams = {
    id: row.id,
    page: 1,
    limit: 10,
    music_name: ''
  };
  handleMusicSearch(row);
};

// 删除歌单歌曲
const handleDeleteMusic = async (playlist, music) => {
  try {
    await koiMsgBox(`确定要从歌单[${playlist.list_title}]中删除歌曲[${music.music_name}]吗？`);
    await deletePlaylistMusic({
      id: playlist.id,
      musicId: music.id
    });
    koiNoticeSuccess("删除成功");
    handleMusicSearch(playlist);
  } catch (error) {
    if (error !== 'cancel') {
      console.log(error);
      koiNoticeError("删除失败");
    }
  }
};

// 添加音乐列表对话框相关变量
const musicDialogVisible = ref(false)
const musicTableLoading = ref(false)
const currentPlaylist = ref(null)

// 显示音乐列表对话框
const handleShowMusicList = (row) => {
  currentPlaylist.value = {...row}  // 使用解构赋值避免直接引用
  musicDialogVisible.value = true
  // 加载歌曲列表
  handleMusicSearch(currentPlaylist.value)
}

// 添加音乐选择相关变量
const addMusicDialogVisible = ref(false)
const musicListLoading = ref(false)
const musicListData = ref([])
const musicListTotal = ref(0)
const currentAddPlaylist = ref(null)

const musicSearchParams = ref({
  page: 1,
  limit: 10,
  music_name: '',
  music_author: ''
})

// 显示添加音乐对话框
const handleShowAddMusic = (playlist) => {
  currentAddPlaylist.value = playlist
  addMusicDialogVisible.value = true
  resetMusicListSearch()
}

// 修改音乐列表搜索方法
const handleMusicListSearch = async () => {
  musicListLoading.value = true
  try {
    // 过滤掉空字符串参数
    const params = {
      page: musicSearchParams.value.page,
      limit: musicSearchParams.value.limit,
      ...(musicSearchParams.value.music_name && { music_name: musicSearchParams.value.music_name }),
      ...(musicSearchParams.value.music_author && { music_author: musicSearchParams.value.music_author })
    };
    const res = await getMusicList(params)
    musicListData.value = res.data
    musicListTotal.value = res.pagination.totalRecords
  } catch (error) {
    console.log(error)
    koiNoticeError("获取音乐列表失败")
  }
  musicListLoading.value = false
}

// 重置音乐列表搜索
const resetMusicListSearch = () => {
  musicSearchParams.value = {
    page: 1,
    limit: 10,
    music_name: '',
    music_author: ''
  }
  handleMusicListSearch()
}

// 选择音乐
const handleSelectMusic = async (row) => {
  try {
    await addPlaylistMusic({
      id: currentAddPlaylist.value.id,
      musicId: row.id
    })
    koiNoticeSuccess("添加成功")
    addMusicDialogVisible.value = false
    handleMusicSearch(currentPlaylist.value)
  } catch (error) {
    console.log(error)
    koiNoticeError("添加失败")
  }
}

// 添加批量选择音乐的处理方法
const handleBatchSelectMusic = async (musicList) => {
  try {
    const musicIds = musicList.map(music => music.id)
    const response = await batchAddPlaylistMusic({
      id: currentAddPlaylist.value.id,
      musicIds
    })
    koiNoticeSuccess(`成功添加${response.data.added}首音乐，${response.data.existing}首已存在`)
    addMusicDialogVisible.value = false
    handleMusicSearch(currentPlaylist.value)
  } catch (error) {
    console.log(error)
    koiNoticeError("批量添加失败")
  }
}

onMounted(async () => {
  loading.value = true;
  await handleListPage();
  loading.value = false;
});
</script>

<style lang="scss" scoped>
:deep(.el-transfer-panel__body) {
  height: 400px;
}
</style> 
