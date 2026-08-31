"use client";

export function EnamadImage({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      referrerPolicy="origin"
      src="https://trustseal.enamad.ir/logo.aspx?id=7053706&Code=C4T58bHVn5wGpSxKgRaItrYMiUVnk2oR"
      alt="نماد اعتماد الکترونیکی"
      // @ts-expect-error — enamad requires this custom attribute for verification
      code="C4T58bHVn5wGpSxKgRaItrYMiUVnk2oR"
      loading="lazy"
      decoding="async"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = "/enamad_icon.png";
      }}
      className={className}
      style={{ cursor: "pointer" }}
    />
  );
}
