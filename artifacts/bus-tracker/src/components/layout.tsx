import { Link, useLocation } from "wouter";
import { Bus, Search, MapPin, CalendarDays, Navigation } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Search },
    { href: "/buses", label: "Find Bus", icon: Bus },
    { href: "/nearby", label: "Near Me", icon: Navigation },
    { href: "/bookings", label: "My Bookings", icon: CalendarDays },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
            <Bus className="h-6 w-6" />
            <span>BusTrack</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile nav */}
          <nav className="md:hidden flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors text-xs ${
                  location === item.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

      <footer className="border-t border-border mt-auto bg-muted/40">
        <div className="container px-4 py-8 max-w-5xl mx-auto text-center md:text-left md:flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center md:justify-start gap-2 font-semibold text-foreground mb-4 md:mb-0">
            <MapPin className="h-4 w-4 text-primary" />
            Rural Transport Service
          </div>
          <p>Connecting villages with care and certainty.</p>
        </div>
      </footer>
    </div>
  );
}
