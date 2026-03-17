<template>
  <div :class="['breadcrumb-box', 'mask-image']">
    <el-breadcrumb :separator-icon="ArrowRight">
      <transition-group name="breadcrumb">
        <el-breadcrumb-item v-for="(item, index) in breadcrumbList" :key="item.path">
          <div class="el-breadcrumb__inner is-link" :class="{ 'item-no-icon': !item.meta?.icon }" @click="handleBreadcrumb(item, index)">
            <KoiGlobalIcon v-if="item.meta?.icon" class="breadcrumb-icon" :name="item.meta.icon" size="16" />
            <span class="breadcrumb-title">{{ item.meta?.title }}</span>
          </div>
        </el-breadcrumb-item>
      </transition-group>
    </el-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowRight } from "@element-plus/icons-vue";
import { HOME_URL, STATIC_URL } from "@/config/index.ts";
import useAuthStore from "@/stores/modules/auth.ts";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const breadcrumbList = computed(() => {
  const breadcrumbMap = authStore.getBreadcrumbList as Record<string, any[]>;
  let breadcrumbData = breadcrumbMap[route.matched[route.matched.length - 1]?.path || ""] ?? [];

  if (breadcrumbData[0]?.path === STATIC_URL && !breadcrumbData[1]?.meta?.activeMenu) {
    return [{ path: HOME_URL, meta: { icon: "HomeFilled", title: "首页" } }];
  }

  if (breadcrumbData[0]?.path === STATIC_URL && breadcrumbData.length > 1 && breadcrumbData[1]?.meta?.activeMenu) {
    const parentMenu = authStore.getMenuList.find((item: any) => item?.path === breadcrumbData[1]?.meta?.activeMenu);
    if (parentMenu) {
      breadcrumbData[0].meta.title = parentMenu.meta?.title || "静态路由";
      breadcrumbData[0].meta.icon = parentMenu.meta?.icon || "House";
    }
  }

  return breadcrumbData;
});

const handleBreadcrumb = (item: any, index: number) => {
  if (breadcrumbList.value[0]?.path === STATIC_URL || breadcrumbList.value[1]?.path === STATIC_URL) {
    router.push(HOME_URL);
    return;
  }
  if (index !== breadcrumbList.value.length - 1) router.push(item.path);
};
</script>

<style scoped lang="scss">
.breadcrumb-enter-active {
  transition: all 0.2s;
}

.breadcrumb-enter-from,
.breadcrumb-leave-active {
  opacity: 0;
  transform: translateX(10px);
}

.breadcrumb-box {
  display: flex;
  align-items: center;
  padding-top: 2px;
  margin-left: 10px;
  overflow: hidden;
  user-select: none;

  .el-breadcrumb {
    line-height: 15px;
    white-space: nowrap;

    .el-breadcrumb__item {
      position: relative;
      display: inline-block;
      float: none;

      .breadcrumb-title {
        font-weight: 600;
      }

      .item-no-icon {
        transform: translateY(-3px);
      }

      .el-breadcrumb__inner {
        display: inline-flex;

        &.is-link {
          color: var(--el-header-text-color);

          &:hover {
            color: var(--el-color-primary);
          }
        }

        .breadcrumb-icon {
          margin-top: 1px;
          margin-right: 6px;
          font-size: 16px;
        }

        .breadcrumb-title {
          margin-top: 2px;
        }
      }

      &:last-child .el-breadcrumb__inner,
      &:last-child .el-breadcrumb__inner:hover {
        color: var(--el-header-text-color-regular);
      }

      :deep(.el-breadcrumb__separator) {
        transform: translateY(-1px);
      }
    }
  }
}

.mask-image {
  padding-right: 50px;
  mask-image: linear-gradient(90deg, #000 0%, #000 calc(100% - 50px), transparent);
}
</style>
