import Image from "next/image";

export default function StoreLoading() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری صفحه"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-20 w-20">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-spin rounded-xl border-2 border-[#ede8f4] border-t-brand-600 motion-reduce:animate-none"
          />
          <div className="absolute inset-[3px] flex items-center justify-center rounded-[10px] bg-white">
            <Image
              src="/elina/elina-logo-full.png"
              alt=""
              width={1254}
              height={1254}
              priority
              className="h-14 w-14 object-contain"
            />
          </div>
        </div>
        <p className="text-sm font-semibold text-brand-800">کمی صبر کنید…</p>
      </div>
    </div>
  );
}
