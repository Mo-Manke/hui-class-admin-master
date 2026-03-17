// 管理端常用字典与枚举配置
export interface EnumOption<T = string | number> {
  label: string;
  value: T;
  tagType?: string;
}

export const STATUS_OPTIONS: EnumOption<number>[] = [
  { label: "启用", value: 1, tagType: "success" },
  { label: "禁用", value: 0, tagType: "info" }
];

export const VALUE_TYPE_OPTIONS: EnumOption<string>[] = [
  { label: "布尔", value: "BOOL" },
  { label: "整数", value: "INT" },
  { label: "浮点", value: "FLOAT" },
  { label: "字符串", value: "STRING" },
  { label: "JSON", value: "JSON" }
];

export const ORDER_STATUS_OPTIONS: EnumOption<string>[] = [
  { label: "待支付", value: "CREATED", tagType: "info" },
  { label: "已支付", value: "PAID", tagType: "success" },
  { label: "失败", value: "FAILED", tagType: "danger" },
  { label: "已取消", value: "CANCELED", tagType: "warning" },
  { label: "已退款", value: "REFUNDED", tagType: "danger" }
];

export const PAYMENT_STATUS_OPTIONS: EnumOption<string>[] = [
  { label: "处理中", value: "PENDING", tagType: "info" },
  { label: "成功", value: "SUCCESS", tagType: "success" },
  { label: "失败", value: "FAILED", tagType: "danger" }
];

export const REFUND_STATUS_OPTIONS: EnumOption<string>[] = [
  { label: "处理中", value: "PENDING", tagType: "info" },
  { label: "成功", value: "SUCCESS", tagType: "success" },
  { label: "失败", value: "FAILED", tagType: "danger" },
  { label: "已取消", value: "CANCELED", tagType: "warning" }
];

export const SUBSCRIPTION_STATUS_OPTIONS: EnumOption<string>[] = [
  { label: "生效中", value: "ACTIVE", tagType: "success" },
  { label: "已过期", value: "EXPIRED", tagType: "info" }
];

export const REDEEM_CODE_STATUS_OPTIONS: EnumOption<string>[] = [
  { label: "未使用", value: "NEW", tagType: "info" },
  { label: "已使用", value: "USED", tagType: "success" },
  { label: "已作废", value: "VOID", tagType: "danger" }
];

export const REDEEM_RECORD_STATUS_OPTIONS: EnumOption<string>[] = [
  { label: "成功", value: "SUCCESS", tagType: "success" },
  { label: "失败", value: "FAILED", tagType: "danger" }
];

export const REDEEM_BATCH_STATUS_OPTIONS: EnumOption<number>[] = [
  { label: "启用", value: 1, tagType: "success" },
  { label: "禁用", value: 0, tagType: "info" }
];

export const GRANT_ACTION_OPTIONS: EnumOption<string>[] = [
  { label: "手动发放", value: "MANUAL" },
  { label: "兑换发放", value: "REDEEM" },
  { label: "扣减", value: "DEDUCT" },
  { label: "撤销扣减", value: "DEDUCT_REVERT" },
  { label: "订单发放", value: "ORDER" },
  { label: "退款撤销", value: "REFUND_REVOKE" }
];

export const GRANT_SOURCE_OPTIONS: EnumOption<string>[] = [
  { label: "管理员", value: "ADMIN" },
  { label: "兑换码", value: "REDEEM" },
  { label: "退款撤销", value: "REFUND" }
];

export const CHANNEL_OPTIONS: EnumOption<string>[] = [
  { label: "网页", value: "WEB", tagType: "info" },
  { label: "App Store", value: "APP_STORE", tagType: "info" },
  { label: "iOS", value: "IOS", tagType: "info" },
  { label: "Android", value: "ANDROID", tagType: "info" },
  { label: "H5", value: "H5", tagType: "info" }
];

export const CURRENCY_OPTIONS: EnumOption<string>[] = [
  { label: "人民币", value: "CNY", tagType: "info" }
];

export const PAYMENT_PROVIDER_OPTIONS: EnumOption<string>[] = [
  { label: "微信支付", value: "WECHAT", tagType: "success" },
  { label: "支付宝", value: "ALIPAY", tagType: "primary" },
  { label: "QQ支付", value: "QQPAY", tagType: "warning" },
  { label: "苹果内购", value: "APPLE_IAP", tagType: "info" }
];
