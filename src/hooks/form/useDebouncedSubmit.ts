// 提交防抖处理
export const useDebouncedSubmit = <T extends Array<unknown>>(
  submit: (...args: T) => void,
  wait = 300
) => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: T) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      submit(...args);
    }, wait);
  };
};
