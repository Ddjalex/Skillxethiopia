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
import { Search, MonitorPlay, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(search)}`);
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl md:text-2xl text-white tracking-tight group">
          <div className="flex items-center justify-center h-10 w-10 md:h-11 md:w-11 rounded-xl bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-transform">
            <span className="text-xl md:text-2xl font-black">SX</span>
          </div>
          <span className="font-extrabold tracking-tighter hidden sm:inline-block">
            Skillx<span className="text-slate-400">ethiopia</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/browse" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Browse
          </Link>
          
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                My Learning
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/5 border border-white/10 p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2 bg-slate-900 border-white/10 text-white" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-slate-400">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                    Dashboard
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                     <DropdownMenuItem onClick={() => setLocation("/admin")} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                       Admin Panel
                     </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/auth">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 font-semibold">Log in</Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">Sign up</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          
          <div className="flex flex-col gap-2">
            <Link href="/browse" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Browse Courses</Button>
            </Link>
            
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">My Learning</Button>
                </Link>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => { logoutMutation.mutate(); setIsMobileMenuOpen(false); }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link href="/auth">
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
