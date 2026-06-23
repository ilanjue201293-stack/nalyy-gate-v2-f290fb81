import logoUrl from "@/assets/ng-logo.png";

export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="Nalyy Gate"
      className={`${className} rounded-full object-cover shadow-[0_0_24px_oklch(0.62_0.26_285/0.45)]`}
      draggable={false}
    />
  );
}
