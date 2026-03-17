<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true">

        <el-form-item label="歌曲编号" prop="loginName">
          <el-input
              type="number"
              placeholder="歌曲id"
              v-model="searchParams.id"
              clearable
              style="width: 200px"
              @keyup.enter.native="handleListPage"
          ></el-input>
        </el-form-item>
        <el-form-item label="歌曲名称" prop="loginName">
          <el-input
              placeholder="歌曲名称"
              v-model="searchParams.music_name"
              clearable
              style="width: 200px"
              @keyup.enter.native="handleListPage"
          ></el-input>
        </el-form-item>
        <el-form-item label="歌曲排序" prop="menuStatus">
          <el-select
              placeholder="请选择歌曲排序"
              v-model="searchParams.sort"
              clearable
              style="width: 240px"
              @keyup.enter.native="handleListPage"
          >
            <el-option :label="item.label" :value="item.value" v-for="item in sortParams" :key="item.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="歌曲类型" prop="musicType">
          <el-select
              placeholder="请选择歌曲类型"
              v-model="searchParams.music_type"
              style="width: 200px"
              @change="handleListPage"
          >
            <el-option label="全部" :value="MUSIC_TYPE.NULL" />
            <el-option label="用户上传歌曲" :value="MUSIC_TYPE.USER_UPLOAD" />
          </el-select>
        </el-form-item>
        <el-form-item label="歌曲作者" prop="userName">
          <el-input
              placeholder="歌曲作者"
              v-model="searchParams.music_author"
              clearable
              style="width: 200px"
              @keyup.enter.native="handleListPage"
          ></el-input>
        </el-form-item>
        <el-form-item label="所属用户" prop="userId">
          <div class="flex items-center">
            <el-button type="primary" plain @click="() => openUserDialog('search')">筛选用户</el-button>
            <div v-if="selectedSearchUser" class="ml-4 flex items-center">
              <el-image
                class="w-24px h-24px rounded-full mr-2"
                :src="selectedSearchUser.avatar && selectedSearchUser.avatar.includes('http') ? selectedSearchUser.avatar : baseUrl + selectedSearchUser.avatar"
              >
                <template #error>
                  <el-icon class="c-[--el-color-primary]" :size="24">
                    <UserFilled />
                  </el-icon>
                </template>
              </el-image>
              <span>{{ selectedSearchUser.nickname || selectedSearchUser.username }}</span>
              <el-button type="danger" link class="ml-2" @click="clearSelectedSearchUser">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
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
      <!-- 数据表格 :data="tableList" -->
      <el-table
          v-loading="loading"
          border
          :data="musicList"
          empty-text="暂时没有数据哟"
          @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"/>
        <el-table-column label="id" prop="id" width="80px" align="center"></el-table-column>
        <el-table-column
            label="歌曲名称"
            prop="music_name"
            width="200px"
            align="center"
            :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column label="歌曲封面" prop="music_cover" width="150px" align="center">
          <template #default="scope">
            <div class="flex justify-center">
              <el-image
                  class="w-36px h-36px"
                  :preview-teleported="true"
                  :preview-src-list="[baseUrl + scope.row.music_cover]"
                  :src="baseUrl + scope.row.music_cover"
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
        <el-table-column label="曲谱内容" prop="music_url" width="100px" align="center">
          <template #default="scope">
            <el-link :href="baseUrl + scope.row.file.music_url" type="primary">曲谱链接</el-link>
          </template>
        </el-table-column>
        <el-table-column
            label="歌曲作者"
            prop="music_author"
            width="150px"
            align="center"
            :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column label="上传用户" width="200px" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center">
              <el-image
                v-if="row.owner?.avatar"
                class="w-28px h-28px mr-8px rounded-full"
                :src="row.owner.avatar && row.owner.avatar.includes('http') ? row.owner.avatar : (row.owner.avatar ? baseUrl + row.owner.avatar : '')"
                :preview-teleported="true"
                :preview-src-list="[row.owner.avatar && row.owner.avatar.includes('http') ? row.owner.avatar : (row.owner.avatar ? baseUrl + row.owner.avatar : '')]"
              >
                <template #error>
                  <el-icon class="c-[--el-color-primary]" :size="28">
                    <CircleCloseFilled />
                  </el-icon>
                </template>
              </el-image>
              <span>{{ row.owner?.nickname || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="歌曲播放数" prop="music_heat" width="120px" align="center"
                         :show-overflow-tooltip="true"></el-table-column>
        <el-table-column label="创建时间" prop="createdAt" width="190px" align="center"></el-table-column>
        <el-table-column label="更新时间" prop="updatedAt" width="190px" align="center"></el-table-column>
        <el-table-column
            label="操作"
            align="center"
            width="150"
            fixed="right"
        >
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
                <el-form-item label="歌曲名称" prop="music_name">
                  <el-input v-model="form.music_name" placeholder="请输入歌曲名称" clearable/>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="歌曲播放数" prop="music_heat">
                  <el-input type="number" v-model.number="form.music_heat" placeholder="请输入歌曲播放数" clearable/>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="歌曲作者" prop="music_author">
                  <el-input v-model="form.music_author" placeholder="请输入歌曲作者" clearable/>
                </el-form-item>
              </el-col>

              <el-col v-if="formType === 'update'" :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="歌曲类型" prop="music_type">
                  <el-select placeholder="请选择歌曲类型" v-model="form.music_type" clearable>
                    <el-option label="全部歌曲" :value="MUSIC_TYPE.NULL"/>
                    <el-option label="用户上传歌曲" :value="MUSIC_TYPE.USER_UPLOAD"/>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="歌曲封面" prop="music_cover">
                  <KoiUploadImage
                      v-model:imageUrl="form.music_cover"
                      action="/api/admin/upload">
                    <template #content>
                      <el-icon>
                        <Picture/>
                      </el-icon>
                      <span>请上传歌曲封面</span>
                    </template>
                    <template #tip>图片最大为 3M</template>
                  </KoiUploadImage>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="所属用户" prop="user_id">
                  <div class="flex items-center">
                    <el-button 
                      type="primary" 
                      @click="openUserDialog"
                      :icon="Plus"
                    >选择所属用户</el-button>
                    <div v-if="selectedUser" class="ml-4 flex items-center">
                      <el-image
                        class="w-24px h-24px rounded-full mr-2"
                        :src="selectedUser.avatar && selectedUser.avatar.includes('http') ? selectedUser.avatar : baseUrl + selectedUser.avatar"
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
                <el-form-item label="歌曲文件" prop="music_file">
                  <KoiUploadFiles
                      :isMultiple="true"
                      acceptType=".json,.txt"
                      :limit="1"
                      :fileList="musicFileList"
                      @fileSuccess="handleFileSuccess"
                      @fileRemove="handleFileRemove"
                      action="/api/admin/upload">
                    <template #content>
                      <span>请上传歌曲文件</span>
                    </template>
                    <template #tip>文件最大为 3M</template>
                  </KoiUploadFiles>
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
    </KoiCard>
  </div>
</template>

<script setup lang="js">
import {nextTick, ref, reactive, onMounted} from "vue";
import {
  createMusic,
  deleteMultipleMusic,
  deleteMusicById,
  getMusicList,
  updateMusic,
} from "@/api/music/index.js";
import {
  koiMsgBox,
  koiMsgError,
  koiMsgInfo,
  koiMsgWarning,
  koiNoticeError,
  koiNoticeSuccess,
} from "@/utils/koi.ts";
import {koiDatePicker} from "@/utils/index.ts";
import {MUSIC_TYPE} from "@/config/index.ts";
import { UserFilled, Plus, Close } from '@element-plus/icons-vue'
import UserSelectDialog from '@/components/Common/UserSelectDialog.vue'

const baseUrl = import.meta.env.VITE_SERVER;
// 数据表格加载页面动画
const loading = ref(false);
//歌曲列表
let musicList = ref([]);
// 查询参数
const searchParams = ref({
  page: 1, // 第几页
  limit: 10, // 每页显示多少条
  id: "",
  music_name: "",
  music_author: "",
  music_heat: "",
  music_type: MUSIC_TYPE.NULL,
  sort: null,
  user_id: null,
});
const ids = ref([]); // 选中数组
const single = ref(true); // 非单个禁用
const multiple = ref(true); // 非多个禁用
/** 是否显示搜索表单 */
const showSearch = ref(true); // 默认显示搜索条件
//总数
const total = ref(0);
// 时间
const dateRange = ref();
// 标题
const title = ref("歌曲管理");
// 对话框确定按钮是否显示loading
const confirmLoading = ref(false);
// form表单Ref
const formRef = ref();
// form表单
let form = ref({
  id: null,
  music_name: "",
  music_author: "",
  music_cover: "",
  music_file: "",
  music_heat: 0,
  music_type: "",
  user_id: null,
});
/** 表单规则 */
const rules = reactive({
  music_name: [{required: true, message: "请输入歌曲名称", trigger: "blur"}],
  music_file: [{
    required: true, 
    validator: (rule, value, callback) => {
      console.log(value);
      
      if (!value || value.trim() === '') {
        callback(new Error('请上传歌曲文件'));
      } else {
        callback();
      }
    }, 
    trigger: 'change'
  }],
  user_id: [{required: true, message: "请选择所属用户", trigger: "change"}],
});
/** 添加 AND 修改抽屉 */
const koiDrawerRef = ref();
//表单类型
let formType = null;
//歌曲文件上传列表
let musicFileList = ref([]);
//路由信息
const musicType = MUSIC_TYPE.NULL;
//排序
const sortParams = [
  { label: "播放倒序", value: "music_heat.desc" },
  { label: "播放正序", value: "music_heat.asc" },
  { label: "创建倒序", value: "createdAt.desc" },
  { label: "创建正序", value: "createdAt.asc" },
  { label: "修改倒序", value: "updatedAt.desc" },
  { label: "修改正序", value: "updatedAt.asc" },
];

// 用户选择相关变量
const userDialogVisible = ref(false)
const selectedUser = ref(null)
const selectedSearchUser = ref(null)
const userSelectMode = ref("form")


/////////////////////////////////////////////////////////////////////////////
/** 是否多选 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1; // 单选
  multiple.value = !selection.length; // 多选
};

// 分页查询，@current-change AND @size-change都会触发分页，调用后端分页接口
/** 数据表格 */
const handleListPage = async () => {
  try {
    loading.value = true;
    musicList.value = []; // 重置表格数据
    const listParams = {
      ...searchParams.value,
    };
    if (listParams.music_type === MUSIC_TYPE.NULL) {
      delete listParams.music_type;
    }
    const res = await getMusicList(koiDatePicker(listParams, dateRange.value));
    musicList.value = res.data.map(item => {
      //自动将更新时间和创建时间改成阅读格式
      item.createdAt && (item.createdAt = new Date(item.createdAt).toLocaleString());
      item.updatedAt && (item.updatedAt = new Date(item.updatedAt).toLocaleString());
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
  console.log("搜索");
  searchParams.value.page = 1;
  handleListPage();
};
/** 重置 */
const resetSearch = () => {
  console.log("重置搜索");
  resetSearchParams();
  handleListPage();
};
// 重置搜索参数
const resetSearchParams = () => {
  searchParams.value = {
    page: 1, // 第几页
    limit: 10, // 每页显示多少条
    id: "",
    music_name: "",
    music_author: "",
    music_heat: "",
    music_type: MUSIC_TYPE.NULL,
    sort: null,
    user_id: null,
  };
  selectedSearchUser.value = null;
  dateRange.value = [];
};
//新增歌曲
const handleAdd = async () => {
  // 打开弹出框
  koiDrawerRef.value.koiOpen();
  // 重置表单
  resetForm();
  // 表单类型
  formType = "create";
  // 标题
  title.value = "添加歌曲";
};

//删除单个歌曲
const handleDelete = async (row) => {
  const music_name = row.music_name;
  if (music_name == null || music_name === "") {
    koiMsgWarning("出错，music_name未知.");
    return;
  }
  koiMsgBox("您确认需要删除[" + row.music_name + "]么？")
      .then(async () => {
        try {
          await deleteMusicById(row.id);
          //刷新列表
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
          console.log("ids", ids.value);
          await deleteMultipleMusic(ids.value);
          //刷新列表
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
  const musicId = row ? row.id : ids.value[0];
  if (musicId == null || musicId === "") {
    koiMsgError("错误，item未被选中");
    return;
  }
  // 重置表单
  resetForm();
  const {file, updatedAt, createdAt, owner, ...musicInfo} = row;
  form.value = {
    music_file: file.music_url,
    ...musicInfo,
  };
  // 设置选中的用户
  if (owner) {
    selectedUser.value = owner;
  }
  musicFileList.value = [{
    name: file.music_url,
    url: file.music_url,
  }];
  // 表单类型
  formType = "update";
  // 标题
  title.value = "修改歌曲信息";
  // 打开弹出框
  koiDrawerRef.value.koiOpen();
};

/** 清空表单数据 */
const resetForm = () => {
  formRef.value && formRef.value.resetFields && formRef.value.resetFields();

  musicFileList.value = [];
  selectedUser.value = null; // 清除选中用户
  //重置所有参数
  form.value = {
    id: null,
    music_name: "",
    music_author: "",
    music_cover: "",
    music_file: "",
    music_heat: 0,
    music_type: musicType,
    user_id: null,
  };
};

/** 确定  */
const handleConfirm = () => {
  if (!formRef.value) return;
  confirmLoading.value = true;
  formRef.value.validate(async (valid, fields) => {
    if (!valid) {
      // 获取第一个验证错误字段的具体错误信息
      const firstError = Object.values(fields)[0];
      const errorMessage = firstError && firstError[0] ? firstError[0].message : "表单验证失败，请检查填写内容";
      
      // 使用弹窗显示具体错误信息
      koiMsgError(errorMessage);
      confirmLoading.value = false;
      return;
    }
    try {
      const {id, ...params} = form.value;
      params.music_heat = Number(params.music_heat ?? 0);
      switch (formType) {
          //创建歌曲
        case "create":
          await createMusic(params);
          koiNoticeSuccess("创建成功.");
          break;
          //更新数据
        case "update":
          await updateMusic(id, params);
          koiNoticeSuccess("更新成功.");
          break;
      }
      //确定的按钮取消加载状态
      confirmLoading.value = false;
      //关闭对话框
      koiDrawerRef.value.koiQuickClose();
      //清空表单
      resetForm();
      //刷新列表
      await handleListPage();
    } catch (error) {
      console.log(error);
      confirmLoading.value = false;
      // 显示更具体的错误信息
      const errorMessage = error?.response?.data?.message || error?.message || "操作失败，请刷新重试.";
      koiNoticeError(errorMessage);
    }
  });
};

/** 取消 */
const handleCancel = () => {
  koiDrawerRef.value.koiClose();
};
//文件上传
const handleFileSuccess = (data) => {
  console.log("handleFileSuccess data:", data);
  form.value.music_file = data.filePath;
  // 文件上传后重新验证该字段
  nextTick(() => {
    formRef.value?.validateField('music_file');
  });
};
//文件移除
const handleFileRemove = () => {
  form.value.music_file = "";
  // 文件移除后重新验证该字段
  nextTick(() => {
    formRef.value?.validateField('music_file');
  });
};

onMounted(async _ => {
  loading.value = true;
  form.value.music_type = musicType;
  //初始化加载歌曲列表
  await handleListPage();
  loading.value = false;
});

// 用户选择相关方法
// 打开用户选择对话框
const openUserDialog = (mode = "form") => {
  userSelectMode.value = mode;
  userDialogVisible.value = true;
};

// 选择用户
const handleSelectUser = (row) => {
  if (userSelectMode.value === "search") {
    selectedSearchUser.value = row;
    searchParams.value.user_id = row.id;
  } else {
    selectedUser.value = row;
    form.value.user_id = row.id;
  }
  userDialogVisible.value = false;
};

// 清除已选用户
const clearSelectedUser = () => {
  selectedUser.value = null;
  form.value.user_id = null;
};

const clearSelectedSearchUser = () => {
  selectedSearchUser.value = null;
  searchParams.value.user_id = null;
};
</script>

<style lang="scss" scoped>
// 穿梭框高度调整
:deep(.el-transfer-panel__body) {
  height: 400px;
}
</style>
