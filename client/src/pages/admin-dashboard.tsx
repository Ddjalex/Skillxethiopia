import { useQuery, useMutation } from "@tanstack/react-query";
import logoImg from "@assets/ChatGPT_Image_Mar_20,_2026,_03_44_07_PM_1774010974208.png";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Users, BookOpen, Layers, Plus, Video,
  Image as ImageIcon, Settings, Pencil, Trash2,
  CreditCard, Upload, LayoutDashboard, FileText,
  ChevronRight, ShieldCheck, TrendingUp, Menu, X,
  Download, BarChart2, ShoppingCart, Megaphone, Tag,
  Flame, Sparkles, Send, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight,
  Eye, EyeOff, Play, Wifi, Clock, Film, AlertTriangle, KeyRound, Save
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactPlayer from "react-player";
import { insertCourseSchema, insertCategorySchema, insertEpisodeSchema, insertSeasonSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const BUNNY_LIBRARY_ID = "617163";
const BUNNY_PREFIX = BUNNY_LIBRARY_ID + "/";

function BunnyVideoRefInput({
  value,
  onChange,
  placeholder = "paste video UUID here",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const displayValue = value.startsWith(BUNNY_PREFIX) ? value.slice(BUNNY_PREFIX.length) : value;
  return (
    <div className="flex items-center rounded-md border border-input bg-background overflow-hidden h-10 focus-within:ring-1 focus-within:ring-ring">
      <span className="bg-secondary text-xs font-mono text-foreground/60 px-2.5 h-full flex items-center border-r border-input flex-shrink-0 select-none whitespace-nowrap">
        {BUNNY_PREFIX}
      </span>
      <input
        className="flex-1 h-full px-3 text-sm bg-transparent outline-none font-mono min-w-0"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => onChange(e.target.value ? BUNNY_PREFIX + e.target.value.trim() : "")}
      />
    </div>
  );
}

function InstructorImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  return (
    <div
      className="flex items-center gap-5 p-4 rounded-xl border-2 border-dashed border-border bg-secondary/40 hover:border-primary/40 transition-colors"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Avatar preview */}
      <div className="flex-shrink-0">
        <div className="h-20 w-20 rounded-full border-2 border-border bg-background shadow-sm overflow-hidden flex items-center justify-center">
          {value ? (
            <img src={value} alt="Instructor" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </div>

      {/* Upload controls */}
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            {value ? "Photo uploaded" : "Upload instructor photo"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            JPG, PNG or WebP · Max 5MB · Drag & drop or click to browse
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-background"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Uploading..." : value ? "Change photo" : "Choose file"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
              onClick={() => onChange("")}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

type AdminTab = "overview" | "courses" | "categories" | "users" | "settings" | "purchases" | "payments" | "analytics" | "broadcasts";

const sidebarNav: { id: AdminTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "purchases", label: "Purchases", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "broadcasts", label: "Broadcasts", icon: Megaphone },
  { id: "users", label: "Users", icon: Users },
  { id: "payments", label: "Payment Options", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: users, isLoading: loadingUsers } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const { data: categories, isLoading: loadingCategories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const { data: courses, isLoading: loadingCourses } = useQuery<any[]>({ queryKey: ["/api/courses"] });

  if (loadingUsers || loadingCategories || loadingCourses) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const activeNav = sidebarNav.find(n => n.id === activeTab);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex-shrink-0 w-64 flex flex-col bg-card border-r border-border transition-transform duration-200",
        "fixed inset-y-0 left-0 z-40 lg:static lg:translate-x-0",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg overflow-hidden bg-white">
            <img src={logoImg} alt="SkillXethiopia" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none"><span style={{ color: "#078930" }}>Skill</span><span style={{ color: "#FCDD09" }}>X</span><span style={{ color: "#DA121A" }}>ethiopia</span></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="section-label px-3 mb-3 mt-1">Management</p>
          {sidebarNav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setMobileSidebarOpen(false); }}
              className={cn(
                "sidebar-nav-item w-full",
                activeTab === id && "sidebar-nav-item-active"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border">
          <Link href="/">
            <button className="sidebar-nav-item w-full text-muted-foreground">
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to Site
            </button>
          </Link>
        </div>
      </aside>

      {/* Sidebar Overlay (mobile) */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-5 lg:px-8 h-16 border-b border-border bg-card flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>Admin</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{activeNav?.label}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 scrollbar-thin">
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-5xl">
              <div className="page-header">
                <h1 className="page-title">Dashboard Overview</h1>
                <p className="page-subtitle">A quick summary of your platform's performance.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  title="Total Users"
                  value={users?.length || 0}
                  icon={Users}
                  color="blue"
                  change="+12 this month"
                />
                <StatCard
                  title="Categories"
                  value={categories?.length || 0}
                  icon={Layers}
                  color="violet"
                />
                <StatCard
                  title="Total Courses"
                  value={courses?.length || 0}
                  icon={BookOpen}
                  color="emerald"
                  change="Active"
                />
              </div>

              {/* Quick actions */}
              <div>
                <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("courses")} className="gap-2">
                    <BookOpen className="h-4 w-4" /> Manage Courses
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("purchases")} className="gap-2">
                    <FileText className="h-4 w-4" /> Review Purchases
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("users")} className="gap-2">
                    <Users className="h-4 w-4" /> View Users
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "courses" && <CourseManagement courses={courses || []} categories={categories || []} />}
          {activeTab === "categories" && <CategoryManagement categories={categories || []} />}
          {activeTab === "purchases" && <PurchaseManagement />}
          {activeTab === "analytics" && <AnalyticsManagement />}
          {activeTab === "broadcasts" && <BroadcastsManagement />}
          {activeTab === "users" && <UserManagement users={users || []} />}
          {activeTab === "payments" && (
            <PaymentManagement
              fileInputRef={fileInputRef}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
            />
          )}
          {activeTab === "settings" && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, change }: {
  title: string; value: number; icon: any; color: string; change?: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="card-base p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", colors[color])}>
          <Icon className="h-5 w-5" />
        </div>
        {change && (
          <span className="text-xs text-muted-foreground">{change}</span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
    </div>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="page-header mb-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn("sidebar-nav-item w-full", active && "sidebar-nav-item-active")}
    >
      {icon}
      {label}
    </button>
  );
}

function PurchaseManagement() {
  const { toast } = useToast();
  const { data: purchases, isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/purchases"] });

  const approvePurchase = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/purchases/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/purchases"] });
      toast({ title: "Approved", description: "Purchase approved and access granted." });
    }
  });

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Purchase Approvals" subtitle="Review and approve payment submissions from users." />

      {isLoading ? (
        <div className="flex justify-center p-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="card-base overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60">
                <TableHead>User</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No purchase submissions yet.
                  </TableCell>
                </TableRow>
              )}
              {purchases?.map((p) => (
                <TableRow key={p.id} className="hover:bg-secondary/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{p.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="badge-neutral">{p.itemType} #{p.itemId}</span>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">{p.amount} {p.currency}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.transactionRef || "—"}</TableCell>
                  <TableCell>
                    {p.paymentProofUrl && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
                            <ImageIcon className="h-3.5 w-3.5" /> View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Payment Proof</DialogTitle>
                          </DialogHeader>
                          <img src={p.paymentProofUrl} alt="Payment Proof" className="w-full rounded-xl border mt-2" />
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.status === "PAID" || p.status === "APPROVED" ? (
                      <span className="badge-success">{p.status}</span>
                    ) : (
                      <span className="badge-warning">{p.status}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.status === "PENDING" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => approvePurchase.mutate(p.id)}
                        disabled={approvePurchase.isPending}
                      >
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function PaymentManagement({ fileInputRef, previewUrl, setPreviewUrl }: {
  fileInputRef: React.RefObject<HTMLInputElement>;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
}) {
  const { toast } = useToast();
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const { data: options, isLoading } = useQuery<any[]>({ queryKey: ["/api/payment-options"] });

  const createOption = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/payment-options", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-options"] });
      toast({ title: "Success", description: "Payment option added" });
      form.reset();
      setPreviewUrl(null);
      setAddPaymentOpen(false);
    }
  });

  const deleteOption = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/admin/payment-options/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-options"] });
      toast({ title: "Deleted", description: "Payment option removed" });
    }
  });

  const form = useForm({
    defaultValues: { provider: "TELEBIRR", accountName: "", accountNumber: "", merchantId: "", qrCodeUrl: "" }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setPreviewUrl(b64);
        form.setValue("qrCodeUrl", b64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Payment Options"
        subtitle="Configure the payment methods available to learners."
        action={
          <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Option</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Option</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit((data) => createOption.mutate(data))} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Provider</Label>
                  <Select onValueChange={(v) => form.setValue("provider", v)} defaultValue={form.getValues("provider")}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TELEBIRR">Telebirr</SelectItem>
                      <SelectItem value="CBE_BIRR">CBE Birr</SelectItem>
                      <SelectItem value="HELLOCASH">HelloCash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Account Name</Label>
                  <Input {...form.register("accountName")} placeholder="Business Name" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Account / Phone Number</Label>
                  <Input {...form.register("accountNumber")} placeholder="0911..." className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Merchant ID <span className="text-muted-foreground">(Optional)</span></Label>
                  <Input {...form.register("merchantId")} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>QR Code Image</Label>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  {!previewUrl ? (
                    <button
                      type="button"
                      className="w-full h-28 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-secondary/40 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload QR Code</span>
                    </button>
                  ) : (
                    <div className="relative group w-28 h-28 mx-auto rounded-xl border overflow-hidden">
                      <img src={previewUrl} alt="QR preview" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={createOption.isPending}>
                  {createOption.isPending ? "Adding..." : "Add Payment Option"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex justify-center p-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {options?.length === 0 && (
            <div className="col-span-full empty-state border border-dashed border-border rounded-xl py-16">
              <CreditCard className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No payment options yet</p>
            </div>
          )}
          {options?.map((opt) => (
            <div key={opt.id} className="card-base p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{opt.provider}</p>
                  <p className="text-sm text-muted-foreground">{opt.accountName}</p>
                </div>
                <button
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10"
                  onClick={() => deleteOption.mutate(opt.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="font-mono text-sm text-foreground">{opt.accountNumber}</p>
              {opt.qrCodeUrl && (
                <img src={opt.qrCodeUrl} className="w-full aspect-square object-contain border border-border rounded-lg bg-white p-2" alt="QR Code" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditSeasonDialog({ season, courseId }: { season: any; courseId: number }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const updateSeason = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", buildUrl(api.admin.updateSeason.path, { id: season.id }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] });
      toast({ title: "Updated", description: "Season updated successfully" });
      setOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update season", variant: "destructive" });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertSeasonSchema.omit({ courseId: true })),
    defaultValues: { title: season.title, seasonNumber: season.seasonNumber, price: season.price, instructorName: season.instructorName || "" }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Season</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((data) => updateSeason.mutate(data), (errs) => { toast({ title: "Check required fields", description: Object.keys(errs).join(", "), variant: "destructive" }); })} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Season Title</Label>
            <Input {...form.register("title")} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label>Instructor Name <span className="text-muted-foreground text-xs font-normal">(optional — overrides course instructor)</span></Label>
            <Input {...form.register("instructorName")} placeholder="Leave blank to use course instructor" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label>Season Number</Label>
            <Input type="number" {...form.register("seasonNumber", { valueAsNumber: true })} className="h-10" />
          </div>
          <Button type="submit" className="w-full" disabled={updateSeason.isPending}>
            {updateSeason.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditEpisodeDialog({ episode, courseId }: { episode: any; courseId: number }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const updateEpisode = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", buildUrl(api.admin.updateEpisode.path, { id: episode.id }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] });
      toast({ title: "Updated", description: "Episode updated successfully" });
      setOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update episode", variant: "destructive" });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertEpisodeSchema),
    defaultValues: {
      seasonId: episode.seasonId, title: episode.title, episodeNumber: episode.episodeNumber,
      description: episode.description || "", durationSec: episode.durationSec,
      isPreview: episode.isPreview, price: episode.price, videoProvider: episode.videoProvider, videoRef: episode.videoRef
    }
  });

  const editVideoProvider = form.watch("videoProvider");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Edit Episode</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((data) => updateEpisode.mutate(data), (errs) => { toast({ title: "Check required fields", description: Object.keys(errs).join(", "), variant: "destructive" }); })} className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...form.register("title")} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label>Episode Number</Label>
            <Input type="number" {...form.register("episodeNumber", { valueAsNumber: true })} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label>Video Provider</Label>
            <Select onValueChange={(v) => form.setValue("videoProvider", v)} defaultValue={episode.videoProvider}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VIMEO">Vimeo</SelectItem>
                <SelectItem value="YOUTUBE">YouTube</SelectItem>
                <SelectItem value="DAILYMOTION">DailyMotion</SelectItem>
                <SelectItem value="WISTIA">Wistia</SelectItem>
                <SelectItem value="BUNNY">Bunny.net</SelectItem>
                <SelectItem value="URL">Direct URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Video Ref</Label>
            {editVideoProvider === "BUNNY" ? (
              <BunnyVideoRefInput
                value={form.watch("videoRef") || ""}
                onChange={(v) => form.setValue("videoRef", v)}
              />
            ) : (
              <Input {...form.register("videoRef")} className="h-10" />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Duration (seconds)</Label>
            <Input type="number" {...form.register("durationSec", { valueAsNumber: true })} className="h-10" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="editIsPreview" {...form.register("isPreview")} className="h-4 w-4 rounded border-border" />
            <Label htmlFor="editIsPreview" className="font-normal">Preview Episode</Label>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea {...form.register("description")} className="resize-none" rows={3} />
          </div>
          <Button type="submit" className="col-span-2" disabled={updateEpisode.isPending}>
            {updateEpisode.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CourseContentDialog({ courseId }: { courseId: number }) {
  const { toast } = useToast();
  const { data: courseData, isLoading } = useQuery<any>({
    queryKey: [api.protected.dashboardCourse.path, { id: courseId }],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.protected.dashboardCourse.path, { id: courseId }));
      if (!res.ok) throw new Error("Failed to fetch course content");
      return res.json();
    }
  });

  const [inlineEdit, setInlineEdit] = useState<{ type: "season" | "episode"; id: number; value: string } | null>(null);
  const [broadcastingEpId, setBroadcastingEpId] = useState<number | null>(null);

  const broadcastEpisodeMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      const res = await fetch(`/api/admin/episodes/${episodeId}/broadcast-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = "Failed to broadcast";
        try { msg = JSON.parse(text).message ?? msg; } catch { msg = text || msg; }
        throw new Error(msg);
      }
      return { success: true };
    },
    onMutate: (episodeId) => setBroadcastingEpId(episodeId),
    onSuccess: () => {
      setBroadcastingEpId(null);
      toast({ title: "Sent to Telegram!", description: "Episode preview was broadcast to your channel." });
    },
    onError: (err: any) => {
      setBroadcastingEpId(null);
      toast({ title: "Broadcast failed", description: err.message, variant: "destructive" });
    },
  });

  const quickUpdatePrice = useMutation({
    mutationFn: async ({ type, id, price }: { type: "season" | "episode"; id: number; price: string }) => {
      const path = type === "season"
        ? buildUrl(api.admin.updateSeason.path, { id })
        : buildUrl(api.admin.updateEpisode.path, { id });
      const res = await apiRequest("PUT", path, { price });
      if (!res.ok) throw new Error("Failed to update price");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] });
      setInlineEdit(null);
      toast({ title: "Price updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update price", variant: "destructive" });
    }
  });

  const savePrice = (type: "season" | "episode", id: number, price: string) => {
    quickUpdatePrice.mutate({ type, id, price });
  };

  const InlinePrice = ({ type, id, price }: { type: "season" | "episode"; id: number; price: string }) => {
    const isEditing = inlineEdit?.type === type && inlineEdit?.id === id;
    const isFree = price === "0" || price === "0.00";

    if (isEditing) {
      return (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Input
            className="h-7 w-24 text-xs px-2"
            value={inlineEdit.value}
            onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
            onKeyDown={e => {
              if (e.key === "Enter") savePrice(type, id, inlineEdit.value);
              if (e.key === "Escape") setInlineEdit(null);
            }}
            autoFocus
          />
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs px-2 text-green-600 border-green-200 hover:bg-green-50"
            disabled={quickUpdatePrice.isPending}
            onClick={() => savePrice(type, id, "0")}
          >Free</Button>
          <Button
            variant="default" size="sm"
            className="h-7 text-xs px-2"
            disabled={quickUpdatePrice.isPending}
            onClick={() => savePrice(type, id, inlineEdit.value)}
          >Save</Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7"
            onClick={() => setInlineEdit(null)}
          ><X className="h-3 w-3" /></Button>
        </div>
      );
    }

    return (
      <button
        className="flex items-center gap-1.5 group text-left"
        onClick={() => setInlineEdit({ type, id, value: price })}
        title="Click to edit price"
      >
        {isFree
          ? <span className="badge-success text-xs font-semibold">FREE</span>
          : <span className="text-sm text-muted-foreground">{price} ETB</span>
        }
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
      </button>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <Layers className="h-3.5 w-3.5" /> Content
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Content</DialogTitle>
          <DialogDescription>Manage seasons and episodes. Click any price to edit it inline.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-5 mt-4">
            {courseData?.seasons?.map((season: any) => (
              <div key={season.id} className="card-base overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/40">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-sm">Season {season.seasonNumber}: {season.title}</p>
                      {season.instructorName && (
                        <p className="text-xs text-muted-foreground">BY {season.instructorName}</p>
                      )}
                    </div>
                    <InlinePrice type="season" id={season.id} price={season.price} />
                  </div>
                  <div className="flex gap-1">
                    <EditSeasonDialog season={season} courseId={courseId} />
                    <DeleteConfirmDialog
                      type="season"
                      id={season.id}
                      onDelete={() => queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] })}
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/20">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {season.episodes?.map((ep: any) => (
                      <TableRow key={ep.id} className="hover:bg-secondary/30">
                        <TableCell className="text-muted-foreground text-xs">{ep.episodeNumber}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {ep.title}
                          {ep.isPreview && <span className="badge-info ml-2">Preview</span>}
                        </TableCell>
                        <TableCell>
                          <InlinePrice type="episode" id={ep.id} price={ep.price} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                  <Video className="h-3.5 w-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl aspect-video p-0 overflow-hidden bg-black border-none">
                                {ep.videoProvider === "BUNNY" ? (
                                  <iframe
                                    src={ep.videoRef.startsWith("http") ? ep.videoRef : `https://iframe.mediadelivery.net/embed/${ep.videoRef}`}
                                    className="w-full h-full"
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <ReactPlayer
                                    url={ep.videoProvider === "VIMEO"
                                      ? (ep.videoRef.startsWith("http") ? ep.videoRef : `https://vimeo.com/${ep.videoRef}`)
                                      : ep.videoProvider === "YOUTUBE"
                                        ? (ep.videoRef.startsWith("http") ? ep.videoRef : `https://www.youtube.com/watch?v=${ep.videoRef}`)
                                        : ep.videoRef}
                                    width="100%"
                                    height="100%"
                                    controls
                                    playing
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            {ep.isPreview && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-sky-500 hover:text-sky-600 hover:bg-sky-50"
                                title="Broadcast to Telegram channel"
                                data-testid={`broadcast-episode-${ep.id}`}
                                disabled={broadcastingEpId === ep.id}
                                onClick={() => broadcastEpisodeMutation.mutate(ep.id)}
                              >
                                {broadcastingEpId === ep.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Send className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                            <EditEpisodeDialog episode={ep} courseId={courseId} />
                            <DeleteConfirmDialog
                              type="episode"
                              id={ep.id}
                              onDelete={() => queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] })}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourseManagement({ courses, categories }: { courses: any[]; categories: any[] }) {
  const { toast } = useToast();
  const [addCourseOpen, setAddCourseOpen] = useState(false);

  const createCourse = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createCourse.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.public.courses.path] });
      toast({ title: "Success", description: "Course created successfully" });
      form.reset();
      setAddCourseOpen(false);
    }
  });

  const form = useForm({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: { title: "", slug: "", description: "", instructorName: "", instructorImageUrl: "", instructorBio: "", categoryId: 0, thumbnailUrl: "", priceStrategy: "PAID", price: "0" }
  });
  const watchedPriceStrategy = form.watch("priceStrategy");
  const watchedIntroVideoProvider = form.watch("introVideoProvider");

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} course${courses.length !== 1 ? "s" : ""} on the platform`}
        action={
          <Dialog open={addCourseOpen} onOpenChange={setAddCourseOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Course</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] p-0 gap-0">
              <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription className="mt-1">Create a new course for your students.</DialogDescription>
              </div>
              <form onSubmit={form.handleSubmit((data) => createCourse.mutate(data))} className="flex flex-col flex-1 min-h-0">
                <div className="overflow-y-auto flex-1 px-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input {...form.register("title")} placeholder="Course Title" className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Slug</Label>
                      <Input {...form.register("slug")} placeholder="course-slug" className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Instructor Name</Label>
                      <Input {...form.register("instructorName")} placeholder="Instructor Name" className="h-10" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Instructor Photo <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                      <InstructorImageUpload
                        value={form.watch("instructorImageUrl") || ""}
                        onChange={(url) => form.setValue("instructorImageUrl", url)}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Instructor Bio <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                      <Textarea {...form.register("instructorBio")} placeholder="Short bio about the instructor..." rows={2} className="resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select onValueChange={(v) => form.setValue("categoryId", parseInt(v))}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Price Strategy</Label>
                      <Select onValueChange={(v) => form.setValue("priceStrategy", v)} defaultValue="PAID">
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE">Free</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {watchedPriceStrategy === "PAID" && (
                      <div className="space-y-1.5">
                        <Label>Price (ETB)</Label>
                        <Input {...form.register("price")} placeholder="e.g. 500" className="h-10" />
                      </div>
                    )}
                    <div className="space-y-1.5 col-span-2">
                      <Label>Thumbnail URL</Label>
                      <Input {...form.register("thumbnailUrl")} placeholder="https://..." className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Intro Video Provider</Label>
                      <Select onValueChange={(v) => form.setValue("introVideoProvider", v)} defaultValue="BUNNY">
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUNNY">Bunny.net</SelectItem>
                          <SelectItem value="YOUTUBE">YouTube</SelectItem>
                          <SelectItem value="VIMEO">Vimeo</SelectItem>
                          <SelectItem value="URL">Direct URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Intro Video Ref <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                      {watchedIntroVideoProvider === "BUNNY" ? (
                        <BunnyVideoRefInput
                          value={form.watch("introVideoRef") || ""}
                          onChange={(v) => form.setValue("introVideoRef", v)}
                        />
                      ) : (
                        <Input {...form.register("introVideoRef")} placeholder="ID or URL" className="h-10" />
                      )}
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Description</Label>
                      <Textarea {...form.register("description")} placeholder="Describe the course..." rows={3} className="resize-none" />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-border flex-shrink-0 flex justify-end">
                  <Button type="submit" disabled={createCourse.isPending}>
                    {createCourse.isPending ? "Creating..." : "Create Course"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="card-base overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60">
              <TableHead>Course</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No courses yet. Create your first course above.
                </TableCell>
              </TableRow>
            )}
            {courses.map((course) => (
              <TableRow key={course.id} className="hover:bg-secondary/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border" alt={course.title} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium text-sm">{course.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{course.instructorName}</TableCell>
                <TableCell>
                  {course.category?.name
                    ? <span className="badge-neutral">{course.category.name}</span>
                    : <span className="text-xs text-muted-foreground">Uncategorized</span>}
                </TableCell>
                <TableCell>
                  {course.priceStrategy === "FREE"
                    ? <span className="badge-success">Free</span>
                    : <span className="badge-info">Paid</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <EditCourseDialog course={course} categories={categories} />
                    <DeleteConfirmDialog
                      type="course"
                      id={course.id}
                      onDelete={() => queryClient.invalidateQueries({ queryKey: [api.public.courses.path] })}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ type, id, onDelete }: { type: "course" | "season" | "episode" | "category"; id: number; onDelete: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      let path = "";
      if (type === "course") path = buildUrl(api.admin.deleteCourse.path, { id });
      if (type === "season") path = buildUrl(api.admin.deleteSeason.path, { id });
      if (type === "episode") path = buildUrl(api.admin.deleteEpisode.path, { id });
      if (type === "category") path = buildUrl(api.admin.deleteCategory.path, { id });
      const res = await apiRequest("DELETE", path);
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      onDelete();
      setOpen(false);
      toast({ title: "Deleted", description: `The ${type} has been removed.` });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {type}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the {type} and all associated data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCourseDialog({ course, categories }: { course: any; categories: any[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [addingSection, setAddingSection] = useState(false);
  const [addingEpisodeForSeason, setAddingEpisodeForSeason] = useState<number | null>(null);
  const [inlineEdit, setInlineEdit] = useState<{ type: "season" | "episode"; id: number; value: string } | null>(null);

  const { data: courseData, isLoading: contentLoading } = useQuery<any>({
    queryKey: [api.protected.dashboardCourse.path, { id: course.id }],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.protected.dashboardCourse.path, { id: course.id }));
      if (!res.ok) throw new Error("Failed to fetch course content");
      return res.json();
    },
    enabled: open && activeTab === "content",
  });

  const updateCourse = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", buildUrl(api.admin.updateCourse.path, { id: course.id }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.public.courses.path] });
      toast({ title: "Updated", description: "Course updated successfully" });
      setOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update course", variant: "destructive" });
    }
  });

  const createSeason = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createSeason.path, { ...data, courseId: course.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: course.id }] });
      toast({ title: "Session added" });
      seasonForm.reset();
      setAddingSection(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to add section", variant: "destructive" });
    }
  });

  const createEpisode = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createEpisode.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: course.id }] });
      toast({ title: "Episode added" });
      episodeForm.reset({ title: "", episodeNumber: 1, description: "", durationSec: 0, isPreview: false, price: "0", videoProvider: "VIMEO", videoRef: "", seasonId: addingEpisodeForSeason ?? 0 });
      setAddingEpisodeForSeason(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to add episode", variant: "destructive" });
    }
  });

  const quickUpdatePrice = useMutation({
    mutationFn: async ({ type, id, price }: { type: "season" | "episode"; id: number; price: string }) => {
      const path = type === "season"
        ? buildUrl(api.admin.updateSeason.path, { id })
        : buildUrl(api.admin.updateEpisode.path, { id });
      const res = await apiRequest("PUT", path, { price });
      if (!res.ok) throw new Error("Failed to update price");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: course.id }] });
      setInlineEdit(null);
      toast({ title: "Price updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update price", variant: "destructive" });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: course.title, slug: course.slug, description: course.description,
      instructorName: course.instructorName, categoryId: course.categoryId,
      thumbnailUrl: course.thumbnailUrl || "", priceStrategy: course.priceStrategy || "PAID",
      price: course.price || "0",
      introVideoProvider: course.introVideoProvider || "BUNNY",
      introVideoRef: course.introVideoRef || "",
      instructorImageUrl: (course as any).instructorImageUrl || "",
      instructorBio: (course as any).instructorBio || "",
    }
  });

  const seasonForm = useForm({
    resolver: zodResolver(insertSeasonSchema.omit({ courseId: true })),
    defaultValues: { title: "", seasonNumber: 1, price: "0", instructorName: "" }
  });

  const episodeForm = useForm({
    resolver: zodResolver(insertEpisodeSchema),
    defaultValues: { title: "", episodeNumber: 1, description: "", durationSec: 0, isPreview: false, price: "0", videoProvider: "VIMEO", videoRef: "", seasonId: 0 }
  });

  const editWatchedPriceStrategy = form.watch("priceStrategy");
  const editIntroVideoProvider = form.watch("introVideoProvider");
  const epVideoProvider = episodeForm.watch("videoProvider");

  const InlinePrice = ({ type, id, price }: { type: "season" | "episode"; id: number; price: string }) => {
    const isEditing = inlineEdit?.type === type && inlineEdit?.id === id;
    const isFree = price === "0" || price === "0.00";
    if (isEditing) {
      return (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Input
            className="h-7 w-20 text-xs px-2"
            value={inlineEdit.value}
            onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
            onKeyDown={e => {
              if (e.key === "Enter") quickUpdatePrice.mutate({ type, id, price: inlineEdit.value });
              if (e.key === "Escape") setInlineEdit(null);
            }}
            autoFocus
          />
          <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-green-600 border-green-200 hover:bg-green-50" disabled={quickUpdatePrice.isPending} onClick={() => quickUpdatePrice.mutate({ type, id, price: "0" })}>Free</Button>
          <Button variant="default" size="sm" className="h-7 text-xs px-2" disabled={quickUpdatePrice.isPending} onClick={() => quickUpdatePrice.mutate({ type, id, price: inlineEdit.value })}>Save</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setInlineEdit(null)}><X className="h-3 w-3" /></Button>
        </div>
      );
    }
    return (
      <button className="flex items-center gap-1 group text-left" onClick={() => setInlineEdit({ type, id, value: price })} title="Click to edit price">
        {isFree ? <span className="badge-success text-xs font-semibold">FREE</span> : <span className="text-xs text-muted-foreground">{price} ETB</span>}
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setActiveTab("details"); setAddingSection(false); setAddingEpisodeForSeason(null); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl flex flex-col max-h-[90vh] p-0 gap-0">
        <div className="px-6 pt-5 pb-0 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold mb-3">Edit Course</DialogTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Course Details</TabsTrigger>
              <TabsTrigger value="content" className="flex-1">Sessions & Episodes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0">
              <form onSubmit={form.handleSubmit((data) => updateCourse.mutate(data), (errs) => { toast({ title: "Check required fields", description: Object.keys(errs).join(", "), variant: "destructive" }); })} className="flex flex-col">
                <div className="overflow-y-auto px-1 py-4" style={{ maxHeight: "calc(90vh - 160px)" }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input {...form.register("title")} className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Slug</Label>
                      <Input {...form.register("slug")} className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Instructor Name</Label>
                      <Input {...form.register("instructorName")} className="h-10" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Instructor Photo <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                      <InstructorImageUpload
                        value={form.watch("instructorImageUrl") || ""}
                        onChange={(url) => form.setValue("instructorImageUrl", url)}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Instructor Bio <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                      <Textarea {...form.register("instructorBio")} placeholder="Short bio about the instructor..." rows={2} className="resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select onValueChange={(v) => form.setValue("categoryId", parseInt(v))} defaultValue={course.categoryId.toString()}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Price Strategy</Label>
                      <Select onValueChange={(v) => form.setValue("priceStrategy", v)} defaultValue={course.priceStrategy || "PAID"}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE">Free</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editWatchedPriceStrategy === "PAID" && (
                      <div className="space-y-1.5">
                        <Label>Price (ETB)</Label>
                        <Input {...form.register("price")} className="h-10" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label>Thumbnail URL</Label>
                      <Input {...form.register("thumbnailUrl")} className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Intro Video Provider</Label>
                      <Select onValueChange={(v) => form.setValue("introVideoProvider", v)} defaultValue={course.introVideoProvider || "BUNNY"}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUNNY">Bunny.net</SelectItem>
                          <SelectItem value="YOUTUBE">YouTube</SelectItem>
                          <SelectItem value="VIMEO">Vimeo</SelectItem>
                          <SelectItem value="URL">Direct URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Intro Video Ref <span className="text-muted-foreground font-normal text-xs">(optional — leave blank to show thumbnail)</span></Label>
                      {editIntroVideoProvider === "BUNNY" ? (
                        <BunnyVideoRefInput
                          value={form.watch("introVideoRef") || ""}
                          onChange={(v) => form.setValue("introVideoRef", v)}
                        />
                      ) : (
                        <Input {...form.register("introVideoRef")} placeholder="ID or URL" className="h-10" />
                      )}
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Description</Label>
                      <Textarea {...form.register("description")} rows={3} className="resize-none" />
                    </div>
                  </div>
                </div>
                <div className="py-4 border-t border-border flex-shrink-0 flex justify-end">
                  <Button type="submit" disabled={updateCourse.isPending}>
                    {updateCourse.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <div className="overflow-y-auto py-4 space-y-4" style={{ maxHeight: "calc(90vh - 160px)" }}>
                {contentLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
                ) : (
                  <>
                    {courseData?.seasons?.map((season: any) => (
                      <div key={season.id} className="border border-border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-secondary/40 border-b border-border">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold text-sm">Session {season.seasonNumber}: {season.title}</p>
                              {season.instructorName && <p className="text-xs text-muted-foreground">BY {season.instructorName}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 h-7 text-xs"
                              onClick={() => setAddingEpisodeForSeason(addingEpisodeForSeason === season.id ? null : season.id)}
                            >
                              <Plus className="h-3 w-3" /> Episode
                            </Button>
                            <EditSeasonDialog season={season} courseId={course.id} />
                            <DeleteConfirmDialog
                              type="season"
                              id={season.id}
                              onDelete={() => queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: course.id }] })}
                            />
                          </div>
                        </div>

                        {addingEpisodeForSeason === season.id && (
                          <div className="px-4 py-3 bg-secondary/10 border-b border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Add Episode to Session {season.seasonNumber}</p>
                            <form onSubmit={episodeForm.handleSubmit((data) => createEpisode.mutate({ ...data, seasonId: season.id }))} className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Episode Title</Label>
                                <Input {...episodeForm.register("title")} placeholder="Episode Title" className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Episode Number</Label>
                                <Input type="number" {...episodeForm.register("episodeNumber", { valueAsNumber: true })} className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Video Provider</Label>
                                <Select onValueChange={(v) => episodeForm.setValue("videoProvider", v)} defaultValue="VIMEO">
                                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="VIMEO">Vimeo</SelectItem>
                                    <SelectItem value="YOUTUBE">YouTube</SelectItem>
                                    <SelectItem value="BUNNY">Bunny.net</SelectItem>
                                    <SelectItem value="DAILYMOTION">DailyMotion</SelectItem>
                                    <SelectItem value="WISTIA">Wistia</SelectItem>
                                    <SelectItem value="URL">Direct URL</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Video Ref (ID or URL)</Label>
                                {epVideoProvider === "BUNNY" ? (
                                  <BunnyVideoRefInput value={episodeForm.watch("videoRef") || ""} onChange={(v) => episodeForm.setValue("videoRef", v)} />
                                ) : (
                                  <Input {...episodeForm.register("videoRef")} placeholder="ID or URL" className="h-9 text-sm" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Duration (seconds)</Label>
                                <Input type="number" {...episodeForm.register("durationSec", { valueAsNumber: true })} className="h-9 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Price (ETB)</Label>
                                <Input {...episodeForm.register("price")} placeholder="0" className="h-9 text-sm" />
                              </div>
                              <div className="flex items-center gap-2 pt-5">
                                <input type="checkbox" id={`isPreview-${season.id}`} {...episodeForm.register("isPreview")} className="h-4 w-4 rounded border-border" />
                                <Label htmlFor={`isPreview-${season.id}`} className="font-normal text-sm">Preview Episode</Label>
                              </div>
                              <div className="col-span-2 space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Textarea {...episodeForm.register("description")} placeholder="Episode description..." rows={2} className="resize-none text-sm" />
                              </div>
                              <div className="col-span-2 flex gap-2 justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setAddingEpisodeForSeason(null)}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={createEpisode.isPending}>
                                  {createEpisode.isPending ? "Adding..." : "Add Episode"}
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}

                        <Table>
                          <TableHeader>
                            <TableRow className="bg-secondary/10">
                              <TableHead className="w-10 text-xs">#</TableHead>
                              <TableHead className="text-xs">Title</TableHead>
                              <TableHead className="text-xs">Price</TableHead>
                              <TableHead className="text-right text-xs">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {season.episodes?.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">No episodes yet — click "+ Episode" to add one.</TableCell>
                              </TableRow>
                            )}
                            {season.episodes?.map((ep: any) => (
                              <TableRow key={ep.id} className="hover:bg-secondary/20">
                                <TableCell className="text-muted-foreground text-xs">{ep.episodeNumber}</TableCell>
                                <TableCell className="text-sm">
                                  {ep.title}
                                  {ep.isPreview && <span className="badge-info ml-2 text-xs">Preview</span>}
                                </TableCell>
                                <TableCell><InlinePrice type="episode" id={ep.id} price={ep.price} /></TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <EditEpisodeDialog episode={ep} courseId={course.id} />
                                    <DeleteConfirmDialog
                                      type="episode"
                                      id={ep.id}
                                      onDelete={() => queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: course.id }] })}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}

                    {addingSection ? (
                      <div className="border border-dashed border-border rounded-lg px-4 py-4">
                        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">New Session</p>
                        <form onSubmit={seasonForm.handleSubmit((data) => createSeason.mutate(data))} className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Session Title</Label>
                            <Input {...seasonForm.register("title")} placeholder="e.g. Getting Started" className="h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Session Number</Label>
                            <Input type="number" {...seasonForm.register("seasonNumber", { valueAsNumber: true })} className="h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Price (ETB)</Label>
                            <Input {...seasonForm.register("price")} placeholder="0" className="h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Instructor Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                            <Input {...seasonForm.register("instructorName")} placeholder="Leave blank to use course instructor" className="h-9 text-sm" />
                          </div>
                          <div className="col-span-2 flex gap-2 justify-end">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setAddingSection(false)}>Cancel</Button>
                            <Button type="submit" size="sm" disabled={createSeason.isPending}>
                              {createSeason.isPending ? "Adding..." : "Add Session"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full gap-2 border-dashed" onClick={() => setAddingSection(true)}>
                        <Plus className="h-4 w-4" /> Add Session
                      </Button>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddSeasonDialog({ courseId }: { courseId: number }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const createSeason = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createSeason.path, { ...data, courseId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] });
      toast({ title: "Success", description: "Season added" });
      form.reset();
      setOpen(false);
    }
  });

  const form = useForm({
    resolver: zodResolver(insertSeasonSchema.omit({ courseId: true })),
    defaultValues: { title: "", seasonNumber: 1, price: "200", instructorName: "" }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
          <Plus className="h-3 w-3" /> Season
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Season</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((data) => createSeason.mutate(data))} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Season Title</Label>
            <Input {...form.register("title")} placeholder="Getting Started" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label>Instructor Name <span className="text-muted-foreground text-xs font-normal">(optional — overrides course instructor)</span></Label>
            <Input {...form.register("instructorName")} placeholder="Leave blank to use course instructor" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label>Season Number</Label>
            <Input type="number" {...form.register("seasonNumber", { valueAsNumber: true })} className="h-10" />
          </div>
          <Button type="submit" className="w-full" disabled={createSeason.isPending}>
            {createSeason.isPending ? "Adding..." : "Add Season"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManagement({ categories }: { categories: any[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const createCategory = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createCategory.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.public.categories.path] });
      toast({ title: "Success", description: "Category created" });
      form.reset();
      setOpen(false);
    }
  });

  const form = useForm({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: { name: "", slug: "" }
  });

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categor${categories.length !== 1 ? "ies" : "y"} available`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit((data) => createCategory.mutate(data))} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input {...form.register("name")} placeholder="e.g. Design" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input {...form.register("slug")} placeholder="e.g. design" className="h-10" />
                </div>
                <Button type="submit" className="w-full" disabled={createCategory.isPending}>
                  {createCategory.isPending ? "Creating..." : "Create Category"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="card-base overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60">
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-16">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
            {categories.map((cat) => (
              <TableRow key={cat.id} className="hover:bg-secondary/30">
                <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">{cat.slug}</TableCell>
                <TableCell>
                  <DeleteConfirmDialog
                    type="category"
                    id={cat.id}
                    onDelete={() => queryClient.invalidateQueries({ queryKey: [api.public.categories.path] })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function AnalyticsManagement() {
  const { data: analytics, isLoading } = useQuery<any>({ queryKey: ["/api/admin/analytics"] });
  const { data: bunnyData, isLoading: bunnyLoading } = useQuery<any>({ queryKey: ["/api/admin/bunny-analytics"] });

  const bunnyStats = bunnyData?.stats ?? null;
  const bunnyError = bunnyData?.error ?? null;

  const exportToExcel = async () => {
    const xlsx = await import("xlsx");
    const wb = xlsx.utils.book_new();

    const courseRows = (analytics?.courseStats || []).map((c: any) => ({
      "Course Title": c.courseTitle,
      "Instructor": c.instructorName,
      "Type": c.priceStrategy,
      "Total Purchases": c.totalPurchases,
      "Unique Buyers": c.uniqueBuyers,
      "Revenue (ETB)": c.revenue,
    }));
    const ws1 = xlsx.utils.json_to_sheet(courseRows);
    xlsx.utils.book_append_sheet(wb, ws1, "Course Sales");

    const userRows = (analytics?.userStats || []).map((u: any) => ({
      "User Name": u.userName,
      "Email": u.email,
      "Total Purchases": u.totalPurchases,
      "Courses Bought": u.coursesCount,
      "Total Spent (ETB)": u.totalSpent,
    }));
    const ws2 = xlsx.utils.json_to_sheet(userRows);
    xlsx.utils.book_append_sheet(wb, ws2, "User Purchases");

    xlsx.writeFile(wb, "skillxethiopia-analytics.xlsx");
  };

  const totalRevenue = analytics?.courseStats?.reduce((s: number, c: any) => s + c.revenue, 0) || 0;
  const totalPurchases = analytics?.courseStats?.reduce((s: number, c: any) => s + c.totalPurchases, 0) || 0;

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        title="Analytics"
        subtitle="Purchase performance across courses and users."
        action={
          <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={exportToExcel} disabled={isLoading}>
            <Download className="h-4 w-4" /> Export to Excel
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center p-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-base p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{totalPurchases}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Total Paid Purchases</p>
            </div>
            <div className="card-base p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} ETB</p>
              <p className="text-sm text-muted-foreground mt-0.5">Total Revenue</p>
            </div>
            <div className="card-base p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{analytics?.userStats?.filter((u: any) => u.totalPurchases > 0).length || 0}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Paying Users</p>
            </div>
          </div>

          {/* Bunny.net Video Analytics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-foreground">Bunny.net Video Analytics</h2>
              <span className="text-xs text-muted-foreground font-normal">(Library {BUNNY_LIBRARY_ID})</span>
            </div>
            {bunnyLoading ? (
              <div className="card-base p-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading Bunny.net stats...
              </div>
            ) : bunnyError ? (
              <div className="card-base p-4 flex items-start gap-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-700">{bunnyError}</p>
                  {bunnyError.includes("BUNNY_API_KEY") && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add <code className="bg-secondary px-1 rounded">BUNNY_API_KEY</code> to your environment secrets to see real video stats from your Bunny.net stream library.
                    </p>
                  )}
                </div>
              </div>
            ) : bunnyStats ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="card-base p-5">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                    <Play className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(bunnyStats.numberOfPlays)}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Total Video Plays</p>
                </div>
                <div className="card-base p-5">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Eye className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(bunnyStats.numberOfImpressions)}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Video Impressions</p>
                </div>
                <div className="card-base p-5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <Film className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{bunnyStats.totalVideoCount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Uploaded Videos</p>
                </div>
                <div className="card-base p-5">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{formatBytes(bunnyStats.bandwidthBytes)}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">CDN Bandwidth Used</p>
                </div>
                <div className="card-base p-5">
                  <div className="h-10 w-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{(bunnyStats.finishRate * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Average Finish Rate</p>
                </div>
                <div className="card-base p-5">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{(bunnyStats.engagementScore * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Engagement Score</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Course Purchase Stats */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Purchases by Course</h2>
            <div className="card-base overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/60">
                    <TableHead>Course</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Purchases</TableHead>
                    <TableHead className="text-right">Unique Buyers</TableHead>
                    <TableHead className="text-right">Revenue (ETB)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.courseStats?.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No course data yet.</TableCell></TableRow>
                  )}
                  {analytics?.courseStats?.map((c: any) => (
                    <TableRow key={c.courseId} className="hover:bg-secondary/30">
                      <TableCell className="font-medium text-sm">{c.courseTitle}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.instructorName}</TableCell>
                      <TableCell>
                        {c.priceStrategy === "FREE"
                          ? <span className="badge-success">Free</span>
                          : <span className="badge-info">Paid</span>}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">{c.totalPurchases}</TableCell>
                      <TableCell className="text-right text-sm">{c.uniqueBuyers}</TableCell>
                      <TableCell className="text-right font-semibold text-sm text-green-700">{c.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* User Purchase Stats */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Purchases by User</h2>
            <div className="card-base overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/60">
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Courses Bought</TableHead>
                    <TableHead className="text-right">Total Purchases</TableHead>
                    <TableHead className="text-right">Total Spent (ETB)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.userStats?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No user data yet.</TableCell></TableRow>
                  )}
                  {analytics?.userStats?.map((u: any) => (
                    <TableRow key={u.userId} className="hover:bg-secondary/30">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{u.userName?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <span className="font-medium text-sm">{u.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn("font-semibold text-sm", u.coursesCount > 0 ? "text-blue-600" : "text-muted-foreground")}>
                          {u.coursesCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">{u.totalPurchases}</TableCell>
                      <TableCell className="text-right font-semibold text-sm text-green-700">{u.totalSpent.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserManagement({ users }: { users: any[] }) {
  const { data: analytics } = useQuery<any>({ queryKey: ["/api/admin/analytics"] });
  const userStatsMap: Record<number, any> = {};
  (analytics?.userStats || []).forEach((u: any) => { userStatsMap[u.userId] = u; });

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Users"
        subtitle={`${users.length} registered member${users.length !== 1 ? "s" : ""}`}
      />
      <div className="card-base overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Courses Bought</TableHead>
              <TableHead className="text-right">Total Purchases</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No users yet.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => {
              const stats = userStatsMap[user.id];
              return (
                <TableRow key={user.id} className="hover:bg-secondary/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{user.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-sm">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {user.role === "ADMIN"
                      ? <span className="badge-info">Admin</span>
                      : <span className="badge-neutral">User</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role !== "ADMIN" && (
                      <span className={cn("font-semibold text-sm", stats?.coursesCount > 0 ? "text-blue-600" : "text-muted-foreground")}>
                        {stats?.coursesCount ?? 0}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    {user.role !== "ADMIN" ? (stats?.totalPurchases ?? 0) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-green-700">
                    {user.role !== "ADMIN" ? `${(stats?.totalSpent ?? 0).toLocaleString()} ETB` : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AddEpisodeDialog({ courseId, seasons: initialSeasons }: { courseId: number; seasons?: any[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: fetchedData, isLoading: loadingSeasons, refetch } = useQuery<any>({
    queryKey: [api.protected.dashboardCourse.path, { id: courseId }],
    enabled: false,
    queryFn: async () => {
      const res = await fetch(buildUrl(api.protected.dashboardCourse.path, { id: courseId }));
      if (!res.ok) throw new Error("Failed to fetch seasons");
      return res.json();
    }
  });

  const seasons = initialSeasons || fetchedData?.seasons;

  const onOpenChange = (val: boolean) => {
    setOpen(val);
    if (val && !initialSeasons) refetch();
    if (!val) form.reset();
  };

  const createEpisode = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createEpisode.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] });
      toast({ title: "Success", description: "Episode added" });
      setOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to add episode", variant: "destructive" });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertEpisodeSchema),
    defaultValues: {
      title: "", episodeNumber: 1, description: "", durationSec: 0,
      isPreview: false, price: "0", videoProvider: "VIMEO", videoRef: "", seasonId: 0
    }
  });

  const videoProvider = form.watch("videoProvider");

  const detectDuration = async (url: string) => {
    if (!url || videoProvider !== "VIMEO") return;
    try {
      const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/|vimeo\.com\/channels\/.+\/|vimeo\.com\/groups\/.+\/videos\/|vimeo\.com\/manage\/videos\/)([0-9]+)/;
      const match = url.match(vimeoRegex);
      const videoId = match ? match[1] : (/^[0-9]+$/.test(url) ? url : null);
      if (!videoId) return;

      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.duration) {
        form.setValue("durationSec", data.duration);
        toast({ title: "Duration Detected", description: `${Math.round(data.duration / 60)} minutes detected.` });
      }
    } catch (e) {
      console.error("Failed to detect duration", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
          <Plus className="h-3 w-3" /> Episode
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Add Episode</DialogTitle></DialogHeader>

        {loadingSeasons && !initialSeasons ? (
          <div className="flex justify-center p-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : seasons && seasons.length > 0 ? (
          <form onSubmit={form.handleSubmit((data) => createEpisode.mutate(data))} className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <Label>Season</Label>
              <Select onValueChange={(v) => form.setValue("seasonId", parseInt(v))}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select Season" /></SelectTrigger>
                <SelectContent>
                  {seasons.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>Season {s.seasonNumber}: {s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input {...form.register("title")} placeholder="Episode Title" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Episode Number</Label>
              <Input type="number" {...form.register("episodeNumber", { valueAsNumber: true })} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Video Provider</Label>
              <Select onValueChange={(v) => form.setValue("videoProvider", v)} defaultValue="VIMEO">
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIMEO">Vimeo</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="DAILYMOTION">DailyMotion</SelectItem>
                  <SelectItem value="WISTIA">Wistia</SelectItem>
                  <SelectItem value="BUNNY">Bunny.net</SelectItem>
                  <SelectItem value="URL">Direct URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Video Ref (ID or URL)</Label>
              {videoProvider === "BUNNY" ? (
                <BunnyVideoRefInput
                  value={form.watch("videoRef") || ""}
                  onChange={(v) => form.setValue("videoRef", v)}
                />
              ) : (
                <Input
                  {...form.register("videoRef")}
                  placeholder={videoProvider === "VIMEO" ? "Vimeo ID or URL" : "ID or URL"}
                  className="h-10"
                  onBlur={(e) => detectDuration(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Duration (seconds)</Label>
              <Input type="number" {...form.register("durationSec", { valueAsNumber: true })} className="h-10" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="addIsPreview" {...form.register("isPreview")} className="h-4 w-4 rounded border-border" />
              <Label htmlFor="addIsPreview" className="font-normal">Preview Episode</Label>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea {...form.register("description")} placeholder="Episode description..." rows={3} className="resize-none" />
            </div>
            <Button type="submit" className="col-span-2" disabled={createEpisode.isPending}>
              {createEpisode.isPending ? "Adding..." : "Add Episode"}
            </Button>
          </form>
        ) : (
          <div className="py-10 text-center text-muted-foreground text-sm">
            Please add a season to this course first.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TokenInput({
  label, description, value, onChange, placeholder
}: {
  label: string; description: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center rounded-md border border-input bg-background overflow-hidden h-10 focus-within:ring-1 focus-within:ring-ring">
        <input
          type={visible ? "text" : "password"}
          className="flex-1 h-full px-3 text-sm bg-transparent outline-none font-mono"
          placeholder={placeholder ?? `Enter ${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`input-token-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
        />
        <button
          type="button"
          className="px-3 h-full text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          onClick={() => setVisible(v => !v)}
          tabIndex={-1}
          data-testid={`toggle-visibility-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function AdminSettings() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [tokens, setTokens] = useState({
    BUNNY_API_KEY: "",
    TELEGRAM_BOT_TOKEN: "",
    TELEGRAM_CHAT_ID: "",
    TELEGRAM_CHANNEL_ID: "",
  });
  const [detectedChats, setDetectedChats] = useState<{ id: string; type: string; title?: string; first_name?: string; username?: string }[]>([]);
  const [detectedChannelChats, setDetectedChannelChats] = useState<{ id: string; type: string; title?: string; first_name?: string; username?: string }[]>([]);

  const { isLoading: tokensLoading, data: savedSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (savedSettings) {
      setTokens({
        BUNNY_API_KEY: savedSettings.BUNNY_API_KEY ?? "",
        TELEGRAM_BOT_TOKEN: savedSettings.TELEGRAM_BOT_TOKEN ?? "",
        TELEGRAM_CHAT_ID: savedSettings.TELEGRAM_CHAT_ID ?? "",
        TELEGRAM_CHANNEL_ID: savedSettings.TELEGRAM_CHANNEL_ID ?? "",
      });
    }
  }, [savedSettings]);

  const saveTokens = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/settings", tokens);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Tokens saved", description: "API keys updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const detectChats = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/telegram/detect-chats", { credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Failed to detect chats");
      }
      return res.json() as Promise<{ chats: any[] }>;
    },
    onSuccess: (data) => {
      setDetectedChats(data.chats.map(c => ({ ...c, id: String(c.id) })));
      if (data.chats.length === 0) {
        toast({ title: "No chats found", description: "Make sure you added the bot as an admin to your channel, then try again.", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Detection failed", description: err.message, variant: "destructive" });
    },
  });

  const detectChannelChats = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/telegram/detect-chats", { credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Failed to detect chats");
      }
      return res.json() as Promise<{ chats: any[] }>;
    },
    onSuccess: (data) => {
      setDetectedChannelChats(data.chats.map(c => ({ ...c, id: String(c.id) })));
      if (data.chats.length === 0) {
        toast({ title: "No chats found", description: "Make sure you added the bot as an admin to your channel first.", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Detection failed", description: err.message, variant: "destructive" });
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/change-password", { currentPassword, newPassword });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="Settings" subtitle="Manage your admin account and preferences." />

      <div className="card-base p-6 space-y-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-semibold text-sm">API Tokens</p>
            <p className="text-xs text-muted-foreground">Configure third-party integration keys used by the platform.</p>
          </div>
        </div>

        {tokensLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading saved tokens...
          </div>
        ) : (
          <div className="space-y-4">
            <TokenInput
              label="BUNNY_API_KEY"
              description="Used for Bunny.net video analytics and stream management."
              value={tokens.BUNNY_API_KEY}
              onChange={(v) => setTokens(t => ({ ...t, BUNNY_API_KEY: v }))}
              placeholder="Enter Bunny.net API key"
            />
            <TokenInput
              label="TELEGRAM_BOT_TOKEN"
              description="Your Telegram bot token for sending notifications."
              value={tokens.TELEGRAM_BOT_TOKEN}
              onChange={(v) => setTokens(t => ({ ...t, TELEGRAM_BOT_TOKEN: v }))}
              placeholder="123456789:ABC-..."
            />
            <div className="space-y-2">
              <TokenInput
                label="TELEGRAM_CHAT_ID"
                description="The channel ID where notifications will be sent. Must add the bot as admin to your channel first."
                value={tokens.TELEGRAM_CHAT_ID}
                onChange={(v) => setTokens(t => ({ ...t, TELEGRAM_CHAT_ID: v }))}
                placeholder="-100123456789"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs gap-2"
                onClick={() => detectChats.mutate()}
                disabled={detectChats.isPending || !tokens.TELEGRAM_BOT_TOKEN}
                data-testid="button-detect-channel"
              >
                {detectChats.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting chats...</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Auto-detect channel ID</>
                )}
              </Button>
              {detectedChats.length > 0 && (
                <div className="rounded-md border border-border bg-secondary/40 p-2 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium px-1">Select your channel:</p>
                  {detectedChats.map(chat => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        setTokens(t => ({ ...t, TELEGRAM_CHAT_ID: chat.id }));
                        setDetectedChats([]);
                        toast({ title: "Chat ID selected", description: `Set to ${chat.id}` });
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-background border border-border hover:bg-secondary text-sm transition-colors text-left"
                      data-testid={`select-chat-${chat.id}`}
                    >
                      <span className="font-medium truncate">{chat.title || chat.first_name || chat.username || "Unknown"}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground capitalize">{chat.type}</span>
                        <code className="text-xs font-mono text-muted-foreground">{chat.id}</code>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <TokenInput
                label="TELEGRAM_CHANNEL_ID"
                description="The Telegram channel ID where broadcast notifications will be sent. The bot must be an admin of the channel."
                value={tokens.TELEGRAM_CHANNEL_ID}
                onChange={(v) => setTokens(t => ({ ...t, TELEGRAM_CHANNEL_ID: v }))}
                placeholder="-100123456789"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs gap-2"
                onClick={() => detectChannelChats.mutate()}
                disabled={detectChannelChats.isPending || !tokens.TELEGRAM_BOT_TOKEN}
                data-testid="button-detect-channel-id"
              >
                {detectChannelChats.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting chats...</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Auto-detect broadcast channel</>
                )}
              </Button>
              {detectedChannelChats.length > 0 && (
                <div className="rounded-md border border-border bg-secondary/40 p-2 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium px-1">Select your broadcast channel:</p>
                  {detectedChannelChats.map(chat => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        setTokens(t => ({ ...t, TELEGRAM_CHANNEL_ID: chat.id }));
                        setDetectedChannelChats([]);
                        toast({ title: "Channel selected", description: `Broadcast channel set to ${chat.id}` });
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-background border border-border hover:bg-secondary text-sm transition-colors text-left"
                      data-testid={`select-channel-${chat.id}`}
                    >
                      <span className="font-medium truncate">{chat.title || chat.first_name || chat.username || "Unknown"}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground capitalize">{chat.type}</span>
                        <code className="text-xs font-mono text-muted-foreground">{chat.id}</code>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="w-full"
              onClick={() => saveTokens.mutate()}
              disabled={saveTokens.isPending}
              data-testid="button-save-tokens"
            >
              {saveTokens.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Tokens</>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="card-base p-6 space-y-5">
        <div>
          <p className="font-semibold text-sm mb-0.5">Change Password</p>
          <p className="text-xs text-muted-foreground">Update your security credentials.</p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input
              type="password"
              className="h-10"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              data-testid="input-current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input
              type="password"
              className="h-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="input-new-password"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => changePassword.mutate()}
            disabled={changePassword.isPending || !currentPassword || !newPassword}
            data-testid="button-update-password"
          >
            {changePassword.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── BROADCASTS MANAGEMENT ────────────────────────────────────────────────────

const BROADCAST_COLORS = [
  { value: "blue",   label: "Blue",   className: "bg-blue-600" },
  { value: "green",  label: "Green",  className: "bg-emerald-600" },
  { value: "amber",  label: "Amber",  className: "bg-amber-500" },
  { value: "red",    label: "Red",    className: "bg-red-600" },
  { value: "purple", label: "Purple", className: "bg-violet-600" },
];

const BROADCAST_TYPES = [
  { value: "ANNOUNCEMENT", label: "Announcement", Icon: Megaphone },
  { value: "DISCOUNT",     label: "Discount",     Icon: Tag },
  { value: "SALE",         label: "Sale",         Icon: Flame },
  { value: "UPDATE",       label: "Update",       Icon: Sparkles },
];

type BroadcastType = {
  id: number;
  title: string;
  message: string;
  type: string;
  discountPercent: number | null;
  discountCode: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  bgColor: string;
  isActive: boolean;
  createdAt: string;
};

function BroadcastsManagement() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", message: "", type: "ANNOUNCEMENT",
    discountPercent: "", discountCode: "", ctaText: "", ctaUrl: "",
    bgColor: "blue", isActive: false,
  });

  const { data: broadcasts, isLoading } = useQuery<BroadcastType[]>({ queryKey: ["/api/admin/broadcasts"] });

  const resetForm = () => {
    setForm({ title: "", message: "", type: "ANNOUNCEMENT", discountPercent: "", discountCode: "", ctaText: "", ctaUrl: "", bgColor: "blue", isActive: false });
    setEditingId(null);
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        const res = await apiRequest("PATCH", `/api/admin/broadcasts/${editingId}`, data);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/broadcasts", data);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/active"] });
      toast({ title: editingId ? "Broadcast updated" : "Broadcast created", description: "Changes saved successfully." });
      if (data?.isActive && data?.telegramSent === false) {
        toast({ title: "Telegram not configured", description: "Set TELEGRAM_CHANNEL_ID in Settings to send broadcasts to your channel.", variant: "destructive" });
      }
      resetForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/broadcasts/${id}`, { isActive });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data: any, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/active"] });
      toast({ title: isActive ? "Broadcast activated" : "Broadcast deactivated", description: isActive ? "Banner is now live on the site." : "Banner has been hidden." });
      if (isActive && data?.telegramSent === false) {
        toast({ title: "Telegram not configured", description: "Set TELEGRAM_CHANNEL_ID in Settings to send broadcasts to your channel.", variant: "destructive" });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/broadcasts/${id}`);
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/active"] });
      toast({ title: "Broadcast deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const testTelegramMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/broadcasts/test-telegram", {});
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => toast({ title: "Telegram test sent!", description: "Check your Telegram channel for the test message." }),
    onError: (err: any) => toast({ title: "Telegram failed", description: err.message, variant: "destructive" }),
  });

  const handleEdit = (b: BroadcastType) => {
    setForm({
      title: b.title, message: b.message, type: b.type,
      discountPercent: b.discountPercent?.toString() || "",
      discountCode: b.discountCode || "", ctaText: b.ctaText || "",
      ctaUrl: b.ctaUrl || "", bgColor: b.bgColor, isActive: b.isActive,
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: "Required fields", description: "Title and message are required.", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      discountPercent: form.discountPercent ? parseInt(form.discountPercent) : null,
      discountCode: form.discountCode.trim() || null,
      ctaText: form.ctaText.trim() || null,
      ctaUrl: form.ctaUrl.trim() || null,
      bgColor: form.bgColor,
      isActive: form.isActive,
    });
  };

  const colorMap: Record<string, string> = {
    blue: "bg-blue-600", green: "bg-emerald-600", amber: "bg-amber-500", red: "bg-red-600", purple: "bg-violet-600",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <PageHeader title="Broadcasts" subtitle="Push announcements, discounts, and alerts to the site banner and Telegram." />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => testTelegramMutation.mutate()} disabled={testTelegramMutation.isPending} className="gap-2 text-xs">
            {testTelegramMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Test Telegram
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> New Broadcast
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-base p-6 space-y-5 border-primary/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{editingId ? "Edit Broadcast" : "Create Broadcast"}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. 20% Off All Courses This Weekend!" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BROADCAST_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Message <span className="text-destructive">*</span></Label>
            <Textarea placeholder="Your announcement message..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="resize-none h-20" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Discount % <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input type="number" placeholder="e.g. 20" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))} className="h-9" min={1} max={100} />
            </div>
            <div className="space-y-1.5">
              <Label>Discount Code <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. LEARN20" value={form.discountCode} onChange={e => setForm(f => ({ ...f, discountCode: e.target.value.toUpperCase() }))} className="h-9 font-mono" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>CTA Button Text <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. Browse Courses" value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>CTA URL <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. /browse" value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} className="h-9" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Banner Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {BROADCAST_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm(f => ({ ...f, bgColor: c.value }))}
                  className={cn("h-8 w-8 rounded-full transition-all", c.className, form.bgColor === c.value ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105")}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {form.title && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className={cn("rounded-lg px-4 py-2.5 text-white text-sm flex items-center gap-3 flex-wrap", colorMap[form.bgColor] || "bg-blue-600")}>
                {form.type === "DISCOUNT" && <Tag className="h-4 w-4 flex-shrink-0" />}
                {form.type === "SALE" && <Flame className="h-4 w-4 flex-shrink-0" />}
                {form.type === "ANNOUNCEMENT" && <Megaphone className="h-4 w-4 flex-shrink-0" />}
                {form.type === "UPDATE" && <Sparkles className="h-4 w-4 flex-shrink-0" />}
                <span className="font-semibold">{form.title}</span>
                <span className="opacity-85">{form.message}</span>
                {form.discountPercent && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{form.discountPercent}% OFF</span>}
                {form.discountCode && <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-mono font-bold">{form.discountCode}</span>}
                {form.ctaText && <span className="underline text-xs font-semibold">{form.ctaText} →</span>}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded" />
              <span className="text-sm font-medium">Activate immediately (show on site &amp; send to Telegram)</span>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={saveMutation.isPending} className="gap-2">
                {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? "Save Changes" : "Create Broadcast"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-secondary/40 p-4 flex items-start gap-3 text-sm">
        <Send className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-0.5">Telegram Integration</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            When a broadcast is activated, a notification is sent to your Telegram channel automatically.
            Set <code className="bg-secondary px-1 rounded">TELEGRAM_BOT_TOKEN</code> and <code className="bg-secondary px-1 rounded">TELEGRAM_CHANNEL_ID</code> in your Settings to enable this. The bot must be added as an admin of the channel.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !broadcasts || broadcasts.length === 0 ? (
        <div className="card-base p-12 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No broadcasts yet. Create one to show a banner on the site.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map(b => {
            const TypeInfo = BROADCAST_TYPES.find(t => t.value === b.type);
            const TypeIconEl = TypeInfo?.Icon || Megaphone;
            const color = BROADCAST_COLORS.find(c => c.value === b.bgColor);
            return (
              <div key={b.id} className={cn("card-base p-4 flex items-start gap-4 transition-all", b.isActive && "border-emerald-200 bg-emerald-50/30")}>
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white", color?.className || "bg-blue-600")}>
                  <TypeIconEl className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{b.title}</span>
                    <Badge variant={b.isActive ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                      {b.isActive ? "LIVE" : "OFF"}
                    </Badge>
                    {b.type !== "ANNOUNCEMENT" && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">{TypeInfo?.label}</Badge>
                    )}
                    {b.discountPercent && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">{b.discountPercent}% OFF</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{b.message}</p>
                  {b.discountCode && (
                    <p className="text-xs text-muted-foreground mt-0.5">Code: <code className="font-mono bg-secondary px-1 rounded">{b.discountCode}</code></p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    variant="ghost" size="sm"
                    className={cn("gap-1.5 h-8 text-xs", b.isActive ? "text-emerald-600" : "text-muted-foreground")}
                    onClick={() => toggleMutation.mutate({ id: b.id, isActive: !b.isActive })}
                    disabled={toggleMutation.isPending}
                  >
                    {b.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {b.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(b)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(b.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
