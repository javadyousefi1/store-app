import hotToast from "react-hot-toast";

const baseStyle = {
  background: "#ffffff",
  color: "#2f2938",
  border: "1px solid #ece7f0",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "1.7",
  padding: "10px 14px",
  maxWidth: "420px",
  boxShadow: "0 10px 30px rgba(31, 35, 48, 0.14)",
} as const;

export const toast = {
  success(message: string) {
    return hotToast.success(message, {
      style: baseStyle,
      iconTheme: { primary: "#22c55e", secondary: "#ffffff" },
    });
  },
  error(message: string) {
    return hotToast.error(message, {
      style: baseStyle,
      iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
    });
  },
  info(message: string) {
    return hotToast(message, {
      style: baseStyle,
      icon: "\u2139\ufe0f",
    });
  },
  warning(message: string) {
    return hotToast(message, {
      style: baseStyle,
      icon: "\u26a0\ufe0f",
    });
  },
};
