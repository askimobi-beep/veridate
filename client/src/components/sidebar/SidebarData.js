import { LayoutDashboard, Calendar, Settings, Mail, LifeBuoy, Users } from "lucide-react";

export const sidebarLinks = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Directory", icon: Users, path: "/dashboard/directory" },
  { label: "Calendar", icon: Calendar, path: "/calendar" },
  { label: "Settings", icon: Settings, path: "/settings" },
  { label: "Support", icon: LifeBuoy, path: "/support" },
  { label: "Contact", icon: Mail, path: "/contact" },
];
