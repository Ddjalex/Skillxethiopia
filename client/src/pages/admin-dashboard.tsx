import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Users, BookOpen, Layers, Plus, 
  Video, Image as ImageIcon, FileText, Settings,
  Pencil, Trash2, CreditCard, Upload
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactPlayer from "react-player";
import { insertCourseSchema, insertCategorySchema, insertEpisodeSchema, insertSeasonSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "categories" | "users" | "settings" | "payments">("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: users, isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: categories, isLoading: loadingCategories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: courses, isLoading: loadingCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  if (loadingUsers || loadingCategories || loadingCourses) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r p-6 space-y-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Settings className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Admin Panel</span>
        </div>
        
        <nav className="space-y-1">
          <SidebarItem 
            icon={<Layers className="h-4 w-4" />} 
            label="Overview" 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")} 
          />
          <SidebarItem 
            icon={<BookOpen className="h-4 w-4" />} 
            label="Courses" 
            active={activeTab === "courses"} 
            onClick={() => setActiveTab("courses")} 
          />
          <SidebarItem 
            icon={<Layers className="h-4 w-4" />} 
            label="Categories" 
            active={activeTab === "categories"} 
            onClick={() => setActiveTab("categories")} 
          />
          <SidebarItem 
            icon={<FileText className="h-4 w-4" />} 
            label="Purchases" 
            active={activeTab === "purchases"} 
            onClick={() => setActiveTab("purchases")} 
          />
          <SidebarItem 
            icon={<Users className="h-4 w-4" />} 
            label="Users" 
            active={activeTab === "users"} 
            onClick={() => setActiveTab("users")} 
          />
          <SidebarItem 
            icon={<CreditCard className="h-4 w-4" />} 
            label="Payment Options" 
            active={activeTab === "payments"} 
            onClick={() => setActiveTab("payments")} 
          />
          <SidebarItem 
            icon={<Settings className="h-4 w-4" />} 
            label="Settings" 
            active={activeTab === "settings"} 
            onClick={() => setActiveTab("settings")} 
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 space-y-8 overflow-auto">
        {activeTab === "overview" && (
          <>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
              <p className="text-muted-foreground">Quick summary of your platform.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatCard title="Total Users" value={users?.length || 0} icon={<Users className="h-4 w-4" />} />
              <StatCard title="Categories" value={categories?.length || 0} icon={<Layers className="h-4 w-4" />} />
              <StatCard title="Courses" value={courses?.length || 0} icon={<BookOpen className="h-4 w-4" />} />
            </div>
          </>
        )}

        {activeTab === "courses" && <CourseManagement courses={courses || []} categories={categories || []} />}
        {activeTab === "categories" && <CategoryManagement categories={categories || []} />}
        {activeTab === "purchases" && <PurchaseManagement />}
        {activeTab === "users" && <UserManagement users={users || []} />}
        {activeTab === "payments" && <PaymentManagement fileInputRef={fileInputRef} previewUrl={previewUrl} setPreviewUrl={setPreviewUrl} />}
        {activeTab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
}

function PurchaseManagement() {
  const { toast } = useToast();
  const { data: purchases, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/purchases"],
  });

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

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin" />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Purchase Approvals</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
              {purchases?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.user?.name} ({p.user?.email})</TableCell>
                  <TableCell>{p.itemType} #{p.itemId}</TableCell>
                  <TableCell>{p.amount} {p.currency}</TableCell>
                  <TableCell className="font-mono text-xs">{p.transactionRef || "-"}</TableCell>
                  <TableCell>
                    {p.paymentProofUrl && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ImageIcon className="h-4 w-4 mr-1" /> View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Payment Proof</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <img src={p.paymentProofUrl} alt="Payment Proof" className="w-full h-auto rounded-lg border" />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "PAID" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.status === "PENDING" && (
                      <Button size="sm" onClick={() => approvePurchase.mutate(p.id)} disabled={approvePurchase.isPending}>
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentManagement({ fileInputRef, previewUrl, setPreviewUrl }: { fileInputRef: React.RefObject<HTMLInputElement>, previewUrl: string | null, setPreviewUrl: (url: string | null) => void }) {
  const { toast } = useToast();
  const { data: options, isLoading } = useQuery<any[]>({
    queryKey: ["/api/payment-options"],
  });

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
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/payment-options/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-options"] });
      toast({ title: "Deleted", description: "Payment option removed" });
    }
  });

  const form = useForm({
    defaultValues: {
      provider: "TELEBIRR",
      accountName: "",
      accountNumber: "",
      merchantId: "",
      qrCodeUrl: ""
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String);
        form.setValue("qrCodeUrl", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Options</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Option</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Option</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createOption.mutate(data))} className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select onValueChange={(v) => form.setValue("provider", v)} defaultValue={form.getValues("provider")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TELEBIRR">Telebirr</SelectItem>
                    <SelectItem value="CBE_BIRR">CBE Birr</SelectItem>
                    <SelectItem value="HELLOCASH">HelloCash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input {...form.register("accountName")} placeholder="Business Name" />
              </div>
              <div className="space-y-2">
                <Label>Account/Phone Number</Label>
                <Input {...form.register("accountNumber")} placeholder="0911..." />
              </div>
              <div className="space-y-2">
                <Label>Merchant ID (Optional)</Label>
                <Input {...form.register("merchantId")} />
              </div>
              <div className="space-y-2">
                <Label>QR Code Image</Label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {!previewUrl ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-32 border-dashed flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload QR Code</span>
                    </Button>
                  ) : (
                    <div className="relative group aspect-square w-32 mx-auto bg-muted rounded-lg overflow-hidden border">
                      <img src={previewUrl} alt="QR preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
                          Change
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createOption.isPending}>Add Option</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {options?.map((opt) => (
          <Card key={opt.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{opt.provider}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => deleteOption.mutate(opt.id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold">{opt.accountName}</div>
              <div className="text-sm text-muted-foreground">{opt.accountNumber}</div>
              {opt.qrCodeUrl && (
                <img src={opt.qrCodeUrl} className="w-full aspect-square object-contain border rounded mt-2" alt="QR Code" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function EditSeasonDialog({ season, courseId }: { season: any, courseId: number }) {
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
    }
  });

  const form = useForm({
    resolver: zodResolver(insertSeasonSchema.omit({ courseId: true })),
    defaultValues: {
      title: season.title,
      seasonNumber: season.seasonNumber,
      price: season.price
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Season</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => updateSeason.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label>Season Title</Label>
            <Input {...form.register("title")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Season Number</Label>
              <Input type="number" {...form.register("seasonNumber", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Price (ETB)</Label>
              <Input {...form.register("price")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={updateSeason.isPending}>Save Changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditEpisodeDialog({ episode, courseId }: { episode: any, courseId: number }) {
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
    }
  });

  const form = useForm({
    resolver: zodResolver(insertEpisodeSchema),
    defaultValues: {
      seasonId: episode.seasonId,
      title: episode.title,
      episodeNumber: episode.episodeNumber,
      description: episode.description || "",
      durationSec: episode.durationSec,
      isPreview: episode.isPreview,
      price: episode.price,
      videoProvider: episode.videoProvider,
      videoRef: episode.videoRef
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Episode</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => updateEpisode.mutate(data))} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label>Episode Number</Label>
            <Input type="number" {...form.register("episodeNumber", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label>Price (ETB)</Label>
            <Input {...form.register("price")} />
          </div>
            <div className="space-y-2">
              <Label>Video Provider</Label>
              <Select onValueChange={(v) => form.setValue("videoProvider", v)} defaultValue={episode.videoProvider}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIMEO">Vimeo</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="DAILYMOTION">DailyMotion</SelectItem>
                  <SelectItem value="WISTIA">Wistia</SelectItem>
                  <SelectItem value="URL">Direct URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          <div className="space-y-2">
            <Label>Video Ref</Label>
            <Input {...form.register("videoRef")} />
          </div>
          <div className="space-y-2">
            <Label>Duration (Seconds)</Label>
            <Input type="number" {...form.register("durationSec", { valueAsNumber: true })} />
          </div>
          <div className="flex items-center gap-2 pt-8">
            <input type="checkbox" id="editIsPreview" {...form.register("isPreview")} className="rounded border-gray-300" />
            <Label htmlFor="editIsPreview">Preview Episode</Label>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} />
          </div>
          <Button type="submit" className="col-span-2" disabled={updateEpisode.isPending}>Save Changes</Button>
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
        <Button variant="outline" size="sm"><Layers className="h-4 w-4 mr-2" /> Content</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Content Management</DialogTitle>
          <DialogDescription>Edit seasons and episodes for this course.</DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="space-y-8 mt-4">
            {courseData?.seasons?.map((season: any) => (
              <Card key={season.id}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div>
                    <CardTitle className="text-lg">Season {season.seasonNumber}: {season.title}</CardTitle>
                    <CardDescription>{season.price} ETB</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <EditSeasonDialog season={season} courseId={courseId} />
                    <DeleteConfirmDialog 
                      type="season" 
                      id={season.id} 
                      onDelete={() => queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] })} 
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {season.episodes?.map((ep: any) => (
                        <TableRow key={ep.id}>
                          <TableCell>{ep.episodeNumber}</TableCell>
                          <TableCell>
                            {ep.title}
                            {ep.isPreview && <Badge variant="secondary" className="ml-2">Preview</Badge>}
                          </TableCell>
                          <TableCell>{ep.price} ETB</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-primary">
                                    <Video className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl aspect-video p-0 overflow-hidden bg-black border-none">
                                  <ReactPlayer 
                                    url={ep.videoProvider === "VIMEO" 
                                      ? (ep.videoRef.startsWith("http") 
                                          ? ep.videoRef
                                          : `https://vimeo.com/${ep.videoRef}`)
                                      : ep.videoProvider === "YOUTUBE"
                                        ? (ep.videoRef.startsWith("http") 
                                            ? ep.videoRef 
                                            : `https://www.youtube.com/watch?v=${ep.videoRef}`)
                                        : ep.videoRef
                                    } 
                                    width="100%" 
                                    height="100%" 
                                    controls 
                                    playing
                                  />
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourseManagement({ courses, categories }: { courses: any[], categories: any[] }) {
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
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      instructorName: "",
      categoryId: 0,
      thumbnailUrl: "",
      priceStrategy: "PAID"
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Courses</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
              <DialogDescription>Create a new course for your students.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createCourse.mutate(data))} className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...form.register("title")} placeholder="Course Title" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input {...form.register("slug")} placeholder="course-slug" />
              </div>
              <div className="space-y-2">
                <Label>Instructor Name</Label>
                <Input {...form.register("instructorName")} placeholder="Instructor Name" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={(v) => form.setValue("categoryId", parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Description</Label>
                <Textarea {...form.register("description")} placeholder="Describe the course..." />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Thumbnail URL</Label>
                <div className="flex gap-2">
                  <Input {...form.register("thumbnailUrl")} placeholder="https://..." />
                  <Button type="button" variant="outline" size="icon"><ImageIcon className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duration (Seconds)</Label>
                <Input type="number" {...form.register("durationSec", { valueAsNumber: true })} placeholder="e.g. 600" />
              </div>
              <div className="space-y-2">
                <Label>Video Provider</Label>
                <Select onValueChange={(v) => form.setValue("videoProvider", v)} defaultValue={form.getValues("videoProvider")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIMEO">Vimeo</SelectItem>
                    <SelectItem value="YOUTUBE">YouTube</SelectItem>
                    <SelectItem value="URL">Direct URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Video Reference (ID or URL)</Label>
                <Input {...form.register("videoRef")} placeholder="e.g. 123456789" />
              </div>
              <div className="flex items-center gap-2 py-2">
                <input type="checkbox" id="isPreview" {...form.register("isPreview")} className="rounded border-gray-300" />
                <Label htmlFor="isPreview">Is Preview Episode?</Label>
              </div>
              <DialogFooter className="col-span-2">
                <Button type="submit" disabled={createCourse.isPending}>
                  {createCourse.isPending ? "Creating..." : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {course.thumbnailUrl && <img src={course.thumbnailUrl} className="w-10 h-10 rounded object-cover" />}
                          {course.title}
                        </div>
                      </TableCell>
                      <TableCell>{course.instructorName}</TableCell>
                      <TableCell>{course.category?.name || "Uncategorized"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <CourseContentDialog courseId={course.id} />
                          <AddSeasonDialog courseId={course.id} />
                          <AddEpisodeDialog courseId={course.id} seasons={categories.find(c => c.id === course.categoryId)?.courses?.find((cc: any) => cc.id === course.id)?.seasons} />
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
        </CardContent>
      </Card>
    </div>
  );
}

function DeleteConfirmDialog({ type, id, onDelete }: { type: "course" | "season" | "episode" | "category", id: number, onDelete: () => void }) {
  const { toast } = useToast();
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
      toast({ title: "Deleted", description: `The ${type} has been removed.` });
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the {type}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={(e: any) => e.target.closest("button").click()}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCourseDialog({ course, categories }: { course: any, categories: any[] }) {
  const { toast } = useToast();
  const updateCourse = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", buildUrl(api.admin.updateCourse.path, { id: course.id }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.public.courses.path] });
      toast({ title: "Updated", description: "Course updated successfully" });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: course.title,
      slug: course.slug,
      description: course.description,
      instructorName: course.instructorName,
      categoryId: course.categoryId,
      thumbnailUrl: course.thumbnailUrl || "",
      priceStrategy: course.priceStrategy || "PAID"
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => updateCourse.mutate(data))} className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input {...form.register("slug")} />
          </div>
          <div className="space-y-2">
            <Label>Instructor Name</Label>
            <Input {...form.register("instructorName")} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select onValueChange={(v) => form.setValue("categoryId", parseInt(v))} defaultValue={course.categoryId.toString()}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Thumbnail URL</Label>
            <Input {...form.register("thumbnailUrl")} />
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
  const createSeason = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createSeason.path, { ...data, courseId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] });
      toast({ title: "Success", description: "Season added" });
      form.reset();
    }
  });

  const form = useForm({
    resolver: zodResolver(insertSeasonSchema.omit({ courseId: true })),
    defaultValues: { title: "", seasonNumber: 1, price: "200" }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1" /> Season</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Season</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => createSeason.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label>Season Title</Label>
            <Input {...form.register("title")} placeholder="Getting Started" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Season Number</Label>
              <Input type="number" {...form.register("seasonNumber", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Price (ETB)</Label>
              <Input {...form.register("price")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createSeason.isPending}>Add Season</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManagement({ categories }: { categories: any[] }) {
  const { toast } = useToast();
  const createCategory = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createCategory.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.public.categories.path] });
      toast({ title: "Success", description: "Category created" });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: { name: "", slug: "" }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Categories</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createCategory.mutate(data))} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Design" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input {...form.register("slug")} placeholder="design" />
              </div>
              <Button type="submit" className="w-full" disabled={createCategory.isPending}>Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{cat.slug}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}

function UserManagement({ users }: { users: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage platform members.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AddEpisodeDialog({ courseId, seasons: initialSeasons }: { courseId: number, seasons?: any[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: seasons, isLoading: loadingSeasons, refetch } = useQuery<any[]>({
    queryKey: [api.protected.dashboardCourse.path, { id: courseId }],
    enabled: false,
    queryFn: async () => {
      const res = await fetch(buildUrl(api.protected.dashboardCourse.path, { id: courseId }));
      if (!res.ok) throw new Error("Failed to fetch seasons");
      const data = await res.json();
      return data.seasons || [];
    }
  });

  const displaySeasons = initialSeasons || seasons;

  // Refetch when dialog opens if no initial seasons
  const onOpenChange = (val: boolean) => {
    setOpen(val);
    if (val && !initialSeasons) {
      refetch();
    }
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
    }
  });

  const form = useForm({
    resolver: zodResolver(insertEpisodeSchema),
    defaultValues: {
      title: "",
      episodeNumber: 1,
      description: "",
      durationSec: 0,
      isPreview: false,
      price: "0",
      videoProvider: "VIMEO",
      videoRef: "",
      seasonId: 0
    }
  });

  const videoProvider = form.watch("videoProvider");

  const detectDuration = async (url: string) => {
    if (!url) return;
    try {
      if (videoProvider === "VIMEO") {
        let videoId = "";
        // Extract ID from various Vimeo formats
        const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/|vimeo\.com\/channels\/.+\/|vimeo\.com\/groups\/.+\/videos\/|vimeo\.com\/manage\/videos\/)([0-9]+)/;
        const match = url.match(vimeoRegex);
        
        if (match) {
          videoId = match[1];
        } else if (/^[0-9]+$/.test(url)) {
          videoId = url;
        }

        if (!videoId) return;
        
        // Use OEmbed API which is more reliable for duration and metadata
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data && data.duration) {
          form.setValue("durationSec", data.duration);
          toast({ title: "Duration Detected", description: `${Math.round(data.duration / 60)} minutes detected.` });
        }
      }
    } catch (e) {
      console.error("Failed to detect duration", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1" /> Episode</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Episode</DialogTitle>
        </DialogHeader>
        {loadingSeasons && !initialSeasons ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displaySeasons && displaySeasons.length > 0 ? (
          <form onSubmit={form.handleSubmit((data) => createEpisode.mutate(data))} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Season</Label>
              <Select onValueChange={(v) => form.setValue("seasonId", parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  {displaySeasons.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      Season {s.seasonNumber}: {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...form.register("title")} placeholder="Episode Title" />
            </div>
            <div className="space-y-2">
              <Label>Episode Number</Label>
              <Input type="number" {...form.register("episodeNumber", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Price (ETB)</Label>
              <Input {...form.register("price")} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Video Provider</Label>
              <Select onValueChange={(v) => form.setValue("videoProvider", v)} defaultValue="VIMEO">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIMEO">Vimeo</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="DAILYMOTION">DailyMotion</SelectItem>
                  <SelectItem value="WISTIA">Wistia</SelectItem>
                  <SelectItem value="URL">Direct URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Video Ref (ID or URL)</Label>
              <Input {...form.register("videoRef")} placeholder="Vimeo ID or URL" onBlur={(e) => detectDuration(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Duration (Seconds)</Label>
              <Input type="number" {...form.register("durationSec", { valueAsNumber: true })} />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input type="checkbox" id="isPreview" {...form.register("isPreview")} className="rounded border-gray-300" />
              <Label htmlFor="isPreview">Preview Episode</Label>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} placeholder="Episode description..." />
            </div>
            <Button type="submit" className="col-span-2" disabled={createEpisode.isPending}>
              {createEpisode.isPending ? "Adding..." : "Add Episode"}
            </Button>
          </form>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Please add a season first.
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your admin profile.</p>
      </div>
      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your security credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button className="w-full" onClick={() => changePassword.mutate()} disabled={changePassword.isPending}>
            {changePassword.isPending ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
