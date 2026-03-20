import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, LogOut, Menu, X, LayoutDashboard, ShieldCheck, BookOpen } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BroadcastBanner } from "@/components/broadcast-banner";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(search)}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="fixed top-0 z-50 w-full">
      <BroadcastBanner />
      <nav className="w-full border-b border-border bg-white/90 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-base font-black">SX</span>
          </div>
          <span className="font-extrabold tracking-tight text-lg hidden sm:block">
            <span style={{ color: "#078930" }}>Skill</span><span style={{ color: "#FCDD09" }}>X</span><span style={{ color: "#DA121A" }}>ethiopia</span>
          </span>
        </Link>

        {/* Center Search (desktop) */}
        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-10 h-9 rounded-xl text-sm bg-secondary border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/browse">
            <Button
              variant="ghost"
              size="sm"
              className="font-medium text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              Browse
            </Button>
          </Link>

          {user ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  My Learning
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-2 flex items-center justify-center rounded-full ring-2 ring-border hover:ring-primary/40 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal py-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")} className="cursor-pointer gap-2">
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    Dashboard
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="text-destructive focus:text-destructive cursor-pointer gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link href="/auth">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold text-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button size="sm" className="font-semibold text-sm rounded-lg px-4 shadow-sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white p-4 space-y-3">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-10 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex flex-col gap-1">
            <Link href="/browse" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2 font-medium">
                <BookOpen className="h-4 w-4" /> Browse Courses
              </Button>
            </Link>

            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 font-medium">
                    <LayoutDashboard className="h-4 w-4" /> My Learning
                  </Button>
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2 font-medium">
                      <ShieldCheck className="h-4 w-4" /> Admin Panel
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => { logoutMutation.mutate(); setIsMobileMenuOpen(false); }}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full font-semibold">Log in</Button>
                </Link>
                <Link href="/auth?tab=register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full font-semibold">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    </div>
  );
}
