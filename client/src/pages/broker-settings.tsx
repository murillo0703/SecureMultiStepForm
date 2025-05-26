import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Eye,
  Users,
  UserPlus,
  Trash2,
  RotateCcw,
  Save,
  Building,
  Calendar,
  Hash,
  Palette,
} from "lucide-react";
import { Broker, User } from "@shared/schema";
import { format } from "date-fns";

export default function BrokerSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State for form data
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#1e40af");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "staff">("staff");
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Fetch broker information
  const { data: broker, isLoading: isLoadingBroker } = useQuery<Broker>({
    queryKey: ["/api/broker"],
    enabled: !!user && user.role === "owner",
  });

  // Fetch broker users
  const { data: brokerUsers = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/broker/users"],
    enabled: !!user && user.role === "owner",
  });

  // Initialize form with broker data
  useEffect(() => {
    if (broker) {
      setPrimaryColor(broker.colorPrimary);
      setSecondaryColor(broker.colorSecondary);
      if (broker.logoUrl) {
        setLogoPreview(broker.logoUrl);
      }
    }
  }, [broker]);

  // Logo upload mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      
      const res = await fetch("/api/broker/logo", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      setLogoPreview(data.logoUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/broker"] });
      toast({
        title: "Logo uploaded",
        description: "Your agency logo has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update broker mutation
  const updateBrokerMutation = useMutation({
    mutationFn: async (updates: { colorPrimary: string; colorSecondary: string }) => {
      const res = await apiRequest("PATCH", "/api/broker", updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker"] });
      toast({
        title: "Settings saved",
        description: "Your broker settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (userData: { email: string; role: string }) => {
      const res = await apiRequest("POST", "/api/broker/invite", userData);
      return await res.json();
    },
    onSuccess: () => {
      setInviteEmail("");
      setInviteRole("staff");
      queryClient.invalidateQueries({ queryKey: ["/api/broker/users"] });
      toast({
        title: "User invited",
        description: "Invitation sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invitation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle logo file selection
  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (1MB max)
      if (file.size > 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo must be smaller than 1MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Logo must be PNG or JPG format.",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo
  const handleLogoUpload = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  // Save color changes
  const handleSaveColors = () => {
    updateBrokerMutation.mutate({
      colorPrimary: primaryColor,
      colorSecondary: secondaryColor,
    });
  };

  // Invite user
  const handleInviteUser = () => {
    if (!inviteEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    inviteUserMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
    });
  };

  // Check if user has owner access
  if (user?.role !== "owner") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                Only broker owners can access these settings.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  if (isLoadingBroker) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Broker Branding / Settings Page
          </h1>
          <p className="mt-1 text-gray-600">
            Manage your agency branding and user access
          </p>
        </div>

        <div className="space-y-6">
          {/* Logo Upload */}
          <Card className="border-2 border-gray-300 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Upload className="h-5 w-5" />
                Logo Upload
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Upload agency logo<br />
                - Max size: 1MB<br />
                - Accepted: PNG, JPG<br />
                - Preview after upload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="logo-upload" className="sr-only">
                    Choose logo file
                  </Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoSelect}
                    className="cursor-pointer"
                  />
                </div>
                <Button
                  onClick={handleLogoUpload}
                  disabled={!logoFile || uploadLogoMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
                </Button>
              </div>
              
              {logoPreview && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-white">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Color Scheme */}
          <Card className="border-2 border-gray-300 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Enter Primary & Secondary HEX colors<br />
                - Optional color picker<br />
                - Live preview of UI color update
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="primary-color"
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="secondary-color"
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#1e40af"
                      className="flex-1"
                    />
                    <Input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              {/* Live Preview */}
              <div className="mt-4">
                <Label className="text-sm font-medium">Live Preview:</Label>
                <div className="mt-2 p-4 border rounded-lg bg-white">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: primaryColor }}
                    ></div>
                    <span className="text-sm font-medium">Primary Color</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: secondaryColor }}
                    ></div>
                    <span className="text-sm font-medium">Secondary Color</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agency Info */}
          <Card className="border-2 border-gray-300 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Building className="h-5 w-5" />
                Agency Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Agency Name (read-only if verified):</span>
              </div>
              <div className="pl-6">
                <span className="text-sm">{broker?.agencyName || "Murillo Insurance Agency"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Broker ID:</span>
              </div>
              <div className="pl-6">
                <span className="text-sm font-mono">{broker?.id || "Loading..."}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Date Created:</span>
              </div>
              <div className="pl-6">
                <span className="text-sm">
                  {broker?.createdAt ? format(new Date(broker.createdAt), "PPP") : "Loading..."}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Manage Users */}
          <Card className="border-2 border-gray-300 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                Manage Users
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Invite users by email<br />
                - Select role: owner or staff<br />
                - Show existing users<br />
                - Remove or reset password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invite User */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="sm:col-span-2"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "owner" | "staff")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="staff">Staff</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <Button
                  onClick={handleInviteUser}
                  disabled={inviteUserMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {inviteUserMutation.isPending ? "Sending..." : "Invite User"}
                </Button>
              </div>

              {/* Existing Users */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Existing Users</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUserManagement(!showUserManagement)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showUserManagement ? "Hide" : "Show"} Users
                  </Button>
                </div>
                
                {showUserManagement && (
                  <div className="space-y-2">
                    {isLoadingUsers ? (
                      <div className="text-sm text-gray-500">Loading users...</div>
                    ) : brokerUsers.length > 0 ? (
                      brokerUsers.map((brokerUser) => (
                        <div
                          key={brokerUser.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-white"
                        >
                          <div>
                            <div className="text-sm font-medium">{brokerUser.name}</div>
                            <div className="text-xs text-gray-500">
                              {brokerUser.email} • {brokerUser.role}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Reset
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No additional users found.</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <Card className="border-2 border-gray-300 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Save className="h-5 w-5" />
                Save Changes
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Primary action button to save all settings<br />
                Visible only to broker owner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSaveColors}
                disabled={updateBrokerMutation.isPending}
                className="w-full sm:w-auto"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateBrokerMutation.isPending ? "Saving..." : "Save All Settings"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}