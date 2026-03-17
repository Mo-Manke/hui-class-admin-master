<!-- 会员套餐管理页 -->
<template>
  <PlansList v-if="!showEntitlements" @show-entitlements="openEntitlements" />
  <div v-else class="plans-entitlements">
    <div class="plans-entitlements__toolbar">
      <el-button icon="ArrowLeft" plain @click="backToList">返回套餐管理</el-button>
    </div>
    <PlanEntitlements />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import PlansList from "./PlansList.vue";
import PlanEntitlements from "@/views/admin/membership/plan-entitlements/index.vue";

const route = useRoute();
const router = useRouter();

const showEntitlements = computed(() => route.query.view === "entitlements" && !!route.query.plan_id);

const openEntitlements = (planId: number) => {
  router.replace({
    path: route.path,
    query: { view: "entitlements", plan_id: String(planId) }
  });
};

const backToList = () => {
  const nextQuery = { ...route.query } as Record<string, string>;
  delete nextQuery.view;
  delete nextQuery.plan_id;
  router.replace({ path: route.path, query: nextQuery });
};
</script>

<style lang="scss" scoped>
.plans-entitlements__toolbar {
  margin-bottom: 12px;
}
</style>
