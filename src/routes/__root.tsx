import { useEffect } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { BookOpen, Calendar } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bible Memory" },
      { name: "description", content: "Save and memorize your favorite scriptures." },
      { property: "og:title", content: "Bible Memory" },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "icon",
        href: "/icon-192.png",
        type: "image/png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const location = useLocation();
  
  useEffect(() => {
    import("@/lib/pwa-register").then(({ registerServiceWorker }) => {
      registerServiceWorker();
    });
  }, []);

  const navItems = [
    { label: "Verses", icon: BookOpen, to: "/" },
    { label: "Schedule", icon: Calendar, to: "/schedule" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 sm:pb-0 sm:pt-0">
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg sm:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "fill-primary/10" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side/Top Nav placeholder - simple link for now */}
      <nav className="hidden border-b bg-background/80 backdrop-blur-lg sm:block">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link to="/" className="font-serif text-xl font-bold text-primary">Bible Memory</Link>
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.to ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

