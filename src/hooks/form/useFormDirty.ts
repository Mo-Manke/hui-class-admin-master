// 表单脏检查
import { computed, ref, Ref } from "vue";

export const useFormDirty = <T extends Record<string, unknown>>(form: Ref<T>) => {
  const snapshot = ref<string>(JSON.stringify(form.value));

  const isDirty = computed(() => JSON.stringify(form.value) !== snapshot.value);

  const resetDirty = (next?: T) => {
    const target = next ?? form.value;
    snapshot.value = JSON.stringify(target);
  };

  return {
    isDirty,
    resetDirty
  };
};
