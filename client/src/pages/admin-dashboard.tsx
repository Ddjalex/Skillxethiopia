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
  Pencil, Trash2
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
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
import { insertCourseSchema, insertCategorySchema, insertEpisodeSchema, insertSeasonSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "categories" | "users" | "settings">("overview");

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
            icon={<Users className="h-4 w-4" />} 
            label="Users" 
            active={activeTab === "users"} 
            onClick={() => setActiveTab("users")} 
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
        {activeTab === "users" && <UserManagement users={users || []} />}
        {activeTab === "settings" && <AdminSettings />}
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
                      <AddSeasonDialog courseId={course.id} />
                      <AddEpisodeDialog courseId={course.id} />
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
    defaultValues: { title: "", seasonNumber: 1, price: "19.99" }
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
              <Label>Price (USD)</Label>
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

function AddEpisodeDialog({ courseId }: { courseId: number }) {
  const { toast } = useToast();
  const { data: seasons, isLoading: loadingSeasons } = useQuery<any[]>({
    queryKey: [api.protected.dashboardCourse.path, { id: courseId }],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.protected.dashboardCourse.path, { id: courseId }));
      if (!res.ok) throw new Error("Failed to fetch seasons");
      const data = await res.json();
      return data.seasons || [];
    }
  });

  const createEpisode = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.admin.createEpisode.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protected.dashboardCourse.path, { id: courseId }] });
      toast({ title: "Success", description: "Episode added" });
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

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) form.reset();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1" /> Episode</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Episode</DialogTitle>
        </DialogHeader>
        {loadingSeasons ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : seasons && seasons.length > 0 ? (
          <form onSubmit={form.handleSubmit((data) => createEpisode.mutate(data))} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Season</Label>
              <Select onValueChange={(v) => form.setValue("seasonId", parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      Season {s.seasonNumber}: {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.seasonId && (
                <p className="text-xs text-destructive">{form.formState.errors.seasonId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Episode Title</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>Episode Number</Label>
              <Input type="number" {...form.register("episodeNumber", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Input type="number" {...form.register("durationSec", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Video Provider</Label>
              <Select onValueChange={(v) => form.setValue("videoProvider", v)} defaultValue="VIMEO">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIMEO">Vimeo</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Video ID/URL</Label>
              <Input {...form.register("videoRef")} placeholder="e.g. 123456789" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} />
            </div>
            <Button type="submit" className="w-full col-span-2" disabled={createEpisode.isPending}>
              {createEpisode.isPending ? "Adding..." : "Add Episode"}
            </Button>
          </form>
        ) : (
          <div className="text-center p-8 space-y-4">
            <p className="text-muted-foreground">This course has no seasons yet. Please add a season first.</p>
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
