"use client";

import { useId, useState } from "react";

export function NewsletterSignup() {
  const inputId = useId();
  const [phone, setPhone] = useState("");
  const [registered, setRegistered] = useState(false);

  return (
    <form
      className="w-full max-w-4xl text-center"
      onSubmit={(event) => {
        event.preventDefault();
        if (phone.trim()) setRegistered(true);
      }}
    >
      <h2 className="text-xl font-bold leading-relaxed text-white sm:text-2xl">
        دریافت کد تخفیف اولین خرید
      </h2>
      <p className="mt-1 text-sm font-semibold leading-7 text-white sm:text-base">
        شماره‌ات رو وارد کن و از تخفیف‌ها و کالکشن‌های جدید جا نمون.
      </p>
      <div className="mx-auto mt-4 flex max-w-2xl flex-col gap-3 sm:flex-row sm:gap-2">
        <label htmlFor={inputId} className="sr-only">
          شماره موبایل
        </label>
        <input
          id={inputId}
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setRegistered(false);
          }}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="شماره موبایل"
          className="h-11 min-w-0 w-full flex-1 rounded-full border border-white/60 bg-white px-5 text-right text-sm text-[#33234e] shadow-sm outline-none placeholder:text-[#766d80] focus-visible:ring-4 focus-visible:ring-white/30 sm:px-5"
          aria-describedby={registered ? `${inputId}-success` : undefined}
        />
        <button
          type="submit"
          className="h-11 w-full shrink-0 rounded-full border border-white bg-white px-5 text-sm font-semibold text-[#3f3748] shadow-[0_6px_16px_rgba(47,32,82,0.22)] transition-colors hover:bg-brand-50 sm:w-auto sm:px-7"
        >
          <span className="sm:hidden">دریافت کد</span>
          <span className="hidden sm:inline">دریافت کد تخفیف</span>
        </button>
      </div>
      <p
        id={`${inputId}-success`}
        className="mt-2 min-h-5 text-xs font-medium text-white"
        role="status"
        aria-live="polite"
      >
        {registered ? "شماره شما با موفقیت ثبت شد." : ""}
      </p>
    </form>
  );
}
