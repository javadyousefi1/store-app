import Image from "next/image";

export default function StoreLoading() {
  return (
    <div
      className="flex min-h-[55svh] items-center justify-center bg-white px-6"
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری صفحه"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 shadow-[0_12px_36px_rgba(83,58,147,0.12)]">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-600 motion-reduce:animate-none" />
          <Image
            src="/elina/elina-logo.png"
            alt=""
            width={170}
            height={82}
            className="h-auto w-16"
          />
        </div>
        <p className="text-sm font-semibold text-brand-800">کمی صبر کنید…</p>
      </div>
    </div>
  );
}
