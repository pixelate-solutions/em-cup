import Image from "next/image";

import { SITE_SUBTITLE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image src="/em-logo.png" alt="Electro-Matic logo" width={116} height={30} className="h-auto w-28" />
          <p className="font-medium text-foreground">EM Cup</p>
        </div>
        <p>{SITE_SUBTITLE}</p>
        <p>Electro-Matic, a SunSource company. Internal tournament site.</p>
      </div>
    </footer>
  );
}
