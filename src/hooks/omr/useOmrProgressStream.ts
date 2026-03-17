import { onBeforeUnmount, ref } from "vue";
import { getToken } from "@/utils/storage";

const trimCarriageReturn = (value: string) => (value.endsWith("\r") ? value.slice(0, -1) : value);

export const useOmrProgressStream = () => {
  const logs = ref<string[]>([]);
  const running = ref(false);
  const error = ref("");
  let controller: AbortController | null = null;

  const pushLog = (line: string) => {
    const normalized = trimCarriageReturn(line).trimEnd();
    if (!normalized) return;
    if (normalized.startsWith(":")) return;
    if (normalized.startsWith("data:")) {
      logs.value.push(normalized.slice("data:".length).trim());
    } else {
      logs.value.push(normalized);
    }
    if (logs.value.length > 500) {
      logs.value.splice(0, logs.value.length - 500);
    }
  };

  const stop = () => {
    controller?.abort();
    controller = null;
    running.value = false;
  };

  const start = async (taskId: string) => {
    stop();
    logs.value = [];
    error.value = "";
    running.value = true;

    const base = String(import.meta.env.VITE_WEB_BASE_API || "");
    const url = `${base}/api/admin/omr/tasks/${encodeURIComponent(taskId)}/progress`;
    const token = getToken();

    const localController = new AbortController();
    controller = localController;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        signal: localController.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }
      if (!response.body) {
        throw new Error("EMPTY_STREAM");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let index = buffer.indexOf("\n");
        while (index >= 0) {
          const line = buffer.slice(0, index);
          buffer = buffer.slice(index + 1);
          pushLog(line);
          index = buffer.indexOf("\n");
        }
      }
    } catch (err) {
      if (localController.signal.aborted) return;
      const message = err instanceof Error ? err.message : "连接失败";
      error.value = message;
    } finally {
      if (!localController.signal.aborted) {
        running.value = false;
      }
    }
  };

  onBeforeUnmount(() => {
    stop();
  });

  return {
    logs,
    running,
    error,
    start,
    stop
  };
};
