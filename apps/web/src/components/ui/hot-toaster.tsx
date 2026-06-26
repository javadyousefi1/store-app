"use client";

import { Toaster } from "react-hot-toast";

export function HotToaster() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={10}
      containerStyle={{ top: 18 }}
      toastOptions={{
        duration: 3200,
        className: "cn-toast",
      }}
    />
  );
}
