import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Image src="/logo.png" alt="Openverse" width={18} height={18} className="rounded-sm opacity-70" />
          <span>&copy; {new Date().getFullYear()} Openverse. All rights reserved.</span>
        </div>
        <p
          className="text-[11px] text-muted-foreground/50 tracking-wide"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
        >
          made with &hearts; and respect by openverse
        </p>
      </div>
    </footer>
  );
}
