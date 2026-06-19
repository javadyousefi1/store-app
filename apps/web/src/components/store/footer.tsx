import Link from "next/link";

const W = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

export function StoreFooter() {
  return (
    <footer className="border-t border-zinc-100 bg-zinc-50">
      <div className={`${W} py-10`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-right">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <p className="text-2xl font-bold tracking-widest text-zinc-900">YUZ</p>
            <p className="text-sm text-zinc-500 leading-relaxed">لباس‌های مینیمال برای زنان امروزی</p>
            <div className="flex gap-3 justify-end">
              {[["I", "اینستاگرام"], ["T", "تلگرام"], ["@", "ایمیل"]].map(([ch, label]) => (
                <button key={label} aria-label={label} className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors text-sm font-bold text-zinc-600">
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-zinc-800">خرید از یوز</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              {["راهنمای سایزبندی", "شرایط ارسال و پرداخت", "پیگیری سفارش", "سوالات متداول"].map((item) => (
                <li key={item}><Link href="#" className="hover:text-zinc-800 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-zinc-800">دسترسی سریع</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              {["درباره ما", "فروشگاه", "همکاری با ما", "تماس با ما"].map((item) => (
                <li key={item}><Link href="#" className="hover:text-zinc-800 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-zinc-800">ارتباط با ما</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>۰۲۱-۱۲۳۴۵۶۷۸</li>
              <li>پشتیبانی آنلاین</li>
              <li>هر روز ۹ تا ۲۱</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 mt-8 pt-5 text-center text-xs text-zinc-400">
          تمامی حقوق این سایت متعلق به YUZ می‌باشد.
        </div>
      </div>
    </footer>
  );
}
