import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut, Sun, Moon, Grid3X3, List } from "lucide-react";
import { Button } from "../common";
import { useTheme } from "../../contexts/ThemeContext";
import { logout } from "../../store/authSlice";
import { cn } from "../common";

export function Header({ title, showBack, onBack, actions }) {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack || (() => navigate(-1))}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </Button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          {actions}
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { darkMode, toggleDarkMode } = useTheme();
  const cartItemCount = useSelector((state) => state.cart.totalItems);

  const navItems = [
    { path: "/", icon: Grid3X3, label: "Tables" },
    { path: "/orders", icon: List, label: "Orders", badge: cartItemCount },
    { path: "/menu", icon: Grid3X3, label: "Menu" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
      <div className="container flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={toggleDarkMode}
          className="flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span>Theme</span>
        </button>
        <button
          onClick={() => dispatch(logout())}
          className="flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

export function Layout({
  children,
  showBottomNav = true,
  title,
  showBack,
  onBack,
  actions,
}) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        title={title}
        showBack={showBack}
        onBack={onBack}
        actions={actions}
      />
      <main className="container px-4 py-4">{children}</main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
