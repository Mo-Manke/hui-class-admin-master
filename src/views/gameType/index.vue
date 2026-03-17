<template>
  <div class="koi-flex">
    <KoiCard>
      <el-form v-show="showSearch" :inline="true">
        <el-form-item label="游戏id" prop="loginName">
          <el-input
              type="number"
              placeholder="id"
              v-model="searchParams.id"
              clearable
              style="width: 200px"
              @keyup.enter.native="handleListPage"
          ></el-input>
        </el-form-item>
        <el-form-item label="游戏名称" prop="loginName">
          <el-input
              placeholder="游戏名称"
              v-model="searchParams.game_name"
              clearable
              style="width: 200px"
              @keyup.enter.native="handleListPage"
          ></el-input>
        </el-form-item>
        <el-form-item label="游戏Key" prop="loginName">
          <el-input
              placeholder="key"
              v-model="searchParams.game_key"
              clearable
              style="width: 200px"
              @keyup.enter.native="handleListPage"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" plain v-debounce="handleSearch">搜索</el-button>
          <el-button type="danger" icon="refresh" plain v-throttle="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <!-- 表格头部按钮 -->
      <el-row :gutter="10">
        <el-col :span="1.5" >
          <el-button type="primary" icon="plus" plain @click="handleAdd()">新增</el-button>
        </el-col>
        <el-col :span="1.5" >
          <el-button type="danger" icon="delete" plain @click="handleBatchDelete()" :disabled="multiple">删除
          </el-button>
        </el-col>
        <KoiToolbar v-model:showSearch="showSearch" @refreshTable="handleListPage"></KoiToolbar>
      </el-row>
      <br/>
      <el-table
          v-loading="loading"
          border
          :data="gameTypes"
          empty-text="暂时没有数据哟"
          @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"/>
        <el-table-column label="id" prop="id" width="80px" align="center"></el-table-column>
        <el-table-column
            label="游戏名称"
            prop="game_name"
            width="200px"
            align="center"
            :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column label="游戏封面" prop="game_cover" width="150px" align="center">
          <template #default="scope">
            <div class="flex justify-center">
              <el-image
                  class="w-36px h-36px"
                  :preview-teleported="true"
                  :preview-src-list="[baseUrl + scope.row.game_cover]"
                  :src="baseUrl + scope.row.game_cover"
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
            label="游戏Key"
            prop="game_key"
            width="100px"
            align="center"
            :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column
            label="游戏热度"
            prop="game_hot"
            width="100px"
            align="center"
        ></el-table-column>
        <el-table-column
            label="游戏状态"
            prop="game_status"
            width="100px"
            align="center"
        >
          <template #default="scope">
            <el-tag :type="scope.row.game_status === 1 ? 'success' : 'danger'">
              {{ scope.row.game_status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
            label="卡片标题"
            prop="card_title"
            width="150px"
            align="center"
            :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column
            label="游戏子标题"
            prop="game_subtitle"
            width="200px"
            align="center"
            :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column
            label="卡片背景"
            prop="card_background"
            width="150px"
            align="center"
        >
          <template #default="scope">
            <div class="flex justify-center">
              <el-image
                  class="w-120px h-36px"
                  :preview-teleported="true"
                  :preview-src-list="[baseUrl + scope.row.card_background]"
                  :src="baseUrl + scope.row.card_background"
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
            label="游戏链接"
            prop="game_url"
            width="200px"
            align="center"
            :show-overflow-tooltip="true"
        ></el-table-column>
        <el-table-column label="创建时间" prop="createdAt" width="190px" align="center"></el-table-column>
        <el-table-column label="更新时间" prop="updatedAt" width="190px" align="center"></el-table-column>
        <el-table-column
            label="操作"
            align="center"
            width="200"
            fixed="right"
        >
          <template #default="{ row }">
            <el-tooltip content="键位类型" placement="top">
              <el-button
                  type="success"
                  icon="Key"
                  circle
                  plain
                  @click="handleKeyType(row)"
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
                <el-form-item label="游戏名称" prop="game_name">
                  <el-input v-model="form.game_name" placeholder="游戏名称" clearable/>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="游戏Key" prop="game_key">
                  <el-input v-model="form.game_key" placeholder="游戏Key" clearable/>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="游戏封面" prop="game_cover">
                  <KoiUploadImage
                      v-model:imageUrl="form.game_cover"
                      action="/api/admin/upload">
                    <template #content>
                      <el-icon><Picture/></el-icon>
                      <span>请上传游戏封面</span>
                    </template>
                    <template #tip>图片最大为 3M</template>
                  </KoiUploadImage>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="游戏热度" prop="game_hot">
                  <el-input-number
                      v-model="form.game_hot"
                      :min="0"
                      controls-position="right"
                      placeholder="请输入游戏热度"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="游戏子标题" prop="game_subtitle">
                  <el-input v-model="form.game_subtitle" placeholder="请输入游戏子标题" clearable/>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="游戏状态" prop="game_status">
                  <el-select v-model="form.game_status" placeholder="请选择游戏状态">
                    <el-option label="正常" :value="1"/>
                    <el-option label="禁用" :value="0"/>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="卡片标题" prop="card_title">
                  <el-input v-model="form.card_title" placeholder="请输入卡片标题" clearable/>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="卡片背景" prop="card_background">
                  <KoiUploadImage
                      v-model:imageUrl="form.card_background"
                      action="/api/admin/upload">
                    <template #content>
                      <el-icon><Picture/></el-icon>
                      <span>请上传卡片背景</span>
                    </template>
                    <template #tip>图片最大为 3M</template>
                  </KoiUploadImage>
                </el-form-item>
              </el-col>
              <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                <el-form-item label="游戏链接" prop="game_url">
                  <el-input v-model="form.game_url" placeholder="请输入游戏详情链接" clearable/>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>
      </KoiDrawer>

      <!-- 键位类型管理对话框 -->
      <GameKeyTypeDialog
          v-model="keyTypeDialogVisible"
          :game-id="currentGameId"
      />
    </KoiCard>
  </div>
</template>


<script setup lang="js">
import {onMounted, reactive, ref} from "vue";
import {koiDatePicker} from "@/utils/index.ts";
import {koiMsgBox, koiMsgError, koiMsgInfo, koiMsgWarning, koiNoticeError, koiNoticeSuccess} from "@/utils/koi.ts";
import {
  createGameType,
  deleteGameType,
  deleteMultipleGameType,
  getGameTypeList,
  updateGameType,
  getGameKeyTypeList,
  createGameKeyType,
  updateGameKeyType,
  deleteGameKeyType
} from "@/api/gameType/index.js";
import GameKeyTypeDialog from './GameKeyTypeDialog.vue'

const baseUrl = import.meta.env.VITE_SERVER;
// 数据表格加载页面动画
const loading = ref(false);
//歌曲列表
let gameTypes = ref([]);
//总数
const total = ref(0);
// 选中数组
const ids = ref([]);
// 非单个禁用
const single = ref(true);
// 非多个禁用
const multiple = ref(true);
/** 是否显示搜索表单 */
const showSearch = ref(true); // 默认显示搜索条件
// 对话框标题
const title = ref("歌曲管理");
// 对话框确定按钮是否显示loading
const confirmLoading = ref(false);
// form表单Ref
const formRef = ref();
// 修改&创建抽屉
const koiDrawerRef = ref();
//游戏
let formType = null;

// 表单验证规则
const rules = reactive({
  game_name: [{required: true, message: "请输入游戏类型名称", trigger: "blur"}],
  game_key: [{required: true, message: "请输入游戏标识", trigger: "blur"}],
  game_cover: [{required: true, message: "请上传游戏封面", trigger: "blur"}],
  game_subtitle: [{required: true, message: "请输入游戏子标题", trigger: "blur"}],
  card_title: [{required: true, message: "请输入卡片标题", trigger: "blur"}],
  card_background: [{required: true, message: "请上传卡片背景", trigger: "blur"}],
  game_url: [{required: true, message: "请输入游戏详情链接", trigger: "blur"}],
});

// form表单
let form = ref({
  id: null,
  game_name: "",
  game_key: "",
  game_cover: "",
  game_hot: 0,
  game_subtitle: "",
  game_status: 1,
  card_title: "",
  card_background: "",
  game_url: "",
});

// 查询参数
const searchParams = ref({
  page: 1, // 第几页
  limit: 10, // 每页显示多少条
  game_name: "",
  game_key: "",
});

// 键位类型相关
const keyTypeDialogVisible = ref(false)
const currentGameId = ref(null)

//////////////////////////////////////////////////////////
//多选监听
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1; // 单选
  multiple.value = !selection.length; // 多选
}

//刷新表格数据
async function handleListPage() {
  try {
    loading.value = true;
    gameTypes.value = []; // 重置表格数据
    const res = await getGameTypeList(
        koiDatePicker(searchParams.value, null),
    );
    gameTypes.value = res.data.map(item => {
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
}

// 搜索
function handleSearch() {
  console.log("搜索");
  searchParams.value.page = 1;
  handleListPage();
}

// 重置
function resetSearch() {
  console.log("重置搜索");
  resetSearchParams();
  handleListPage();
}

// 重置搜索参数
function resetSearchParams() {
  searchParams.value = {
    page: 1, // 第几页
    limit: 10, // 每页显示多少条
    game_name: "",
    game_key: "",
  };
}

// 对话框确认按钮
function handleConfirm() {
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
      switch (formType) {
          //创建歌曲
        case "create":
          console.log(params);
          await createGameType(params);
          koiNoticeSuccess("创建成功.");
          break;
          //更新数据
        case "update":
          await updateGameType(id, params);
          koiNoticeSuccess("修改成功.");
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
      koiNoticeError("操作失败，请刷新重试.");
    }
  });
}

// 清空表单数据
function resetForm() {
  formRef.value && formRef.value.resetFields && formRef.value.resetFields();

  //重置所有参数
  Object.keys(form.value).forEach(key => {
    form.value[key] = "";
  });
}

//对话框取消按钮
const handleCancel = () => {
  koiDrawerRef.value.koiClose();
};

// 创建游戏类型
function handleAdd() {
  // 打开弹出框
  koiDrawerRef.value.koiOpen();
  // 重置表单
  resetForm();
  // 游戏
  formType = "create";
  // 标题
  title.value = "添加歌曲";
}

// 修改游戏类型
function handleUpdate(row) {
  const id = row ? row.id : ids.value[0];
  if (id == null || id === "") {
    koiMsgError("错误，item未被选中");
    return;
  }
  if (id == null || id === "") {
    koiMsgError("错误，item未被选中");
    return;
  }
  // 重置表单
  resetForm();
  const {createdAt, updatedAt, ...params} = row;
  form.value = params;
  // 表单类型
  formType = "update";
  // 标题
  title.value = "修改游戏类型信息";
  // 打开弹出框
  koiDrawerRef.value.koiOpen();
}

// 删除多个游戏类型
function handleBatchDelete() {
  if (ids.value.length === 0) {
    koiMsgInfo("请选择需要删除的数据");
    return;
  }
  koiMsgBox("您确认需要进行批量删除么？")
      .then(async () => {
        try {
          await deleteMultipleGameType(ids.value);
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
}

// 删除单个游戏类型
function handleDelete(row) {
  const id = row.id;
  if (id == null || id === "") {
    koiMsgWarning("出错，未知id.");
    return;
  }
  koiMsgBox("您确认需要删除[" + row.game_name + "]么？")
      .then(async () => {
        try {
          await deleteGameType(row.id);
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
}

// 打开键位类型管理
function handleKeyType(row) {
  currentGameId.value = row.id
  keyTypeDialogVisible.value = true
}

onMounted(async _ => {
  loading.value = true;
  //初始化加载歌曲列表
  await handleListPage();
  loading.value = false;
});
</script>

<style lang="scss" scoped>
// 穿梭框高度调整
:deep(.el-transfer-panel__body) {
  height: 400px;
}
</style>

