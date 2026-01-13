import AppLogoIcon from "@/components/app-logo-icon";

export default function AppLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AppLogoIcon />
      <span className="text-base font-semibold tracking-tight text-slate-800">
        Portál praxe
      </span>
    </div>
  );
}
