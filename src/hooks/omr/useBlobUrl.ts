import { onBeforeUnmount, ref } from "vue";

export const useBlobUrl = () => {
  const url = ref("");
  let currentUrl = "";

  const revoke = () => {
    if (!currentUrl) return;
    URL.revokeObjectURL(currentUrl);
    currentUrl = "";
  };

  const setBlob = (blob: Blob | null) => {
    revoke();
    if (!blob) {
      url.value = "";
      return;
    }
    currentUrl = URL.createObjectURL(blob);
    url.value = currentUrl;
  };

  onBeforeUnmount(() => {
    revoke();
  });

  return {
    url,
    setBlob
  };
};

