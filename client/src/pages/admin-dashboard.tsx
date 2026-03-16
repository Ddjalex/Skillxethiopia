import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Users, BookOpen, Layers, Plus, Video,
  Image as ImageIcon, Settings, Pencil, Trash2,
  CreditCard, Upload, LayoutDashboard, FileText,
  ChevronRight, ShieldCheck, TrendingUp, Menu, X
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
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

type AdminTab = "overview" | "courses" | "categories" | "users" | "settings" | "purchases" | "payments";

const sidebarNav: { id: AdminTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "purchases", label: "Purchases", icon: FileText },
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
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-white">
            <span className="text-sm font-black">SX</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Skillxethiopia</p>
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
          <Dialog>
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
    defaultValues: { title: season.title, seasonNumber: season.seasonNumber, price: season.price }
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Season Number</Label>
              <Input type="number" {...form.register("seasonNumber", { valueAsNumber: true })} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Price (ETB)</Label>
              <Input {...form.register("price")} className="h-10" />
            </div>
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
            <Label>Price (ETB)</Label>
            <Input {...form.register("price")} className="h-10" />
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
            <Input {...form.register("videoRef")} className="h-10" />
            {editVideoProvider === "BUNNY" && (
              <p className="text-xs text-muted-foreground">
                Format: <span className="font-mono text-primary">libraryId/videoId</span> — e.g. <span className="font-mono">617163/3793f824-8eea-...</span>. Find your Library ID at dash.bunny.net/stream.
              </p>
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
  const { data: courseData, isLoading } = useQuery<any>({
    queryKey: [api.protected.dashboardCourse.path, { id: courseId }],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.protected.dashboardCourse.path, { id: courseId }));
      if (!res.ok) throw new Error("Failed to fetch course content");
      return res.json();
    }
  });

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
          <DialogDescription>Manage seasons and episodes for this course.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-5 mt-4">
            {courseData?.seasons?.map((season: any) => (
              <div key={season.id} className="card-base overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/40">
                  <div>
                    <p className="font-semibold text-sm">Season {season.seasonNumber}: {season.title}</p>
                    <p className="text-xs text-muted-foreground">{season.price} ETB</p>
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
                        <TableCell className="text-sm text-muted-foreground">{ep.price} ETB</TableCell>
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
  const createCourse = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createCourse.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.public.courses.path] });
      toast({ title: "Success", description: "Course created successfully" });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: { title: "", slug: "", description: "", instructorName: "", categoryId: 0, thumbnailUrl: "", priceStrategy: "PAID" }
  });

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} course${courses.length !== 1 ? "s" : ""} on the platform`}
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Course</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>Create a new course for your students.</DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit((data) => createCourse.mutate(data))} className="grid grid-cols-2 gap-4 mt-2">
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
                <div className="space-y-1.5 col-span-2">
                  <Label>Thumbnail URL</Label>
                  <Input {...form.register("thumbnailUrl")} placeholder="https://..." className="h-10" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Description</Label>
                  <Textarea {...form.register("description")} placeholder="Describe the course..." rows={3} className="resize-none" />
                </div>
                <DialogFooter className="col-span-2">
                  <Button type="submit" disabled={createCourse.isPending}>
                    {createCourse.isPending ? "Creating..." : "Create Course"}
                  </Button>
                </DialogFooter>
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
                    <CourseContentDialog courseId={course.id} />
                    <AddSeasonDialog courseId={course.id} />
                    <AddEpisodeDialog courseId={course.id} seasons={undefined} />
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

  const form = useForm({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: course.title, slug: course.slug, description: course.description,
      instructorName: course.instructorName, categoryId: course.categoryId,
      thumbnailUrl: course.thumbnailUrl || "", priceStrategy: course.priceStrategy || "PAID"
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Edit Course</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((data) => updateCourse.mutate(data), (errs) => { toast({ title: "Check required fields", description: Object.keys(errs).join(", "), variant: "destructive" }); })} className="grid grid-cols-2 gap-4 mt-2">
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
          <div className="space-y-1.5">
            <Label>Thumbnail URL</Label>
            <Input {...form.register("thumbnailUrl")} className="h-10" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} rows={3} className="resize-none" />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="submit" disabled={updateCourse.isPending}>
              {updateCourse.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
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
    defaultValues: { title: "", seasonNumber: 1, price: "200" }
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Season Number</Label>
              <Input type="number" {...form.register("seasonNumber", { valueAsNumber: true })} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Price (ETB)</Label>
              <Input {...form.register("price")} className="h-10" />
            </div>
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

function UserManagement({ users }: { users: any[] }) {
  return (
    <div className="max-w-3xl space-y-6">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                  No users yet.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
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
              </TableRow>
            ))}
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
              <Label>Price (ETB)</Label>
              <Input {...form.register("price")} placeholder="0" className="h-10" />
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
              <Input
                {...form.register("videoRef")}
                placeholder={videoProvider === "BUNNY" ? "libraryId/videoId or full URL" : videoProvider === "VIMEO" ? "Vimeo ID or URL" : "ID or URL"}
                className="h-10"
                onBlur={(e) => detectDuration(e.target.value)}
              />
              {videoProvider === "BUNNY" && (
                <p className="text-xs text-muted-foreground">
                  Format: <span className="font-mono text-primary">libraryId/videoId</span> — e.g. <span className="font-mono">617163/3793f824-8eea-...</span>. Find your Library ID at dash.bunny.net/stream.
                </p>
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

function AdminSettings() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input
              type="password"
              className="h-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => changePassword.mutate()}
            disabled={changePassword.isPending || !currentPassword || !newPassword}
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
