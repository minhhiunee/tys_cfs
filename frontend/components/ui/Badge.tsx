import * as React from "react";

export type BadgeStatus = "PENDING" | "APPROVED" | "REJECTED" | "POSTED" | "HIDDEN";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
}

const statusConfig: Record<BadgeStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Chờ duyệt",
    className: "bg-[#FFF7ED] text-[#C2410C]", // Warning palette
  },
  APPROVED: {
    label: "Đã duyệt",
    className: "bg-[#F0F9FF] text-[#0369A1]", // Primary palette
  },
  REJECTED: {
    label: "Từ chối",
    className: "bg-[#FEF2F2] text-[#B91C1C]", // Error palette
  },
  POSTED: {
    label: "Đã đăng",
    className: "bg-[#F0FDF4] text-[#15803D]", // Success palette
  },
  HIDDEN: {
    label: "Đã ẩn",
    className: "bg-[#F1F5F9] text-[#475569]", // Secondary palette
  },
};

export function Badge({ status, className = "", ...props }: BadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[12px] font-medium ${config.className} ${className}`}
      {...props}
    >
      {config.label}
    </span>
  );
}
