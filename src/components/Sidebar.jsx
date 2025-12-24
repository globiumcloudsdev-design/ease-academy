"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  Clock,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  FolderOpen,
  Calendar,
  Banknote,
  BarChart3,
  Briefcase,
  Shield,
  Receipt,
  Wallet,
  TrendingUp,
  Cog,
  Activity,
  Bell,
  Building2,
  UserPlus,
  UserCog,
  GraduationCap,
  Keyboard,
  QrCode,
  UserCheck,
  LayoutDashboardIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const ROLE_MENUS = {
  super_admin: [
    {
      category: "Overview",
      items: [
        { name: "Dashboard", path: "/super-admin", icon: LayoutDashboard },
      ],
    },
    {
      category: "Branch Management",
      items: [
        {
          name: "All Branches",
          path: "/super-admin/branch-management/branches",
          icon: FolderOpen,
        },
      ],
    },
    {
      category: "User Management",
      items: [
        {
          name: "Administrators",
          path: "/super-admin/user-management/administrators",
          icon: UserCog,
        },
        {
          name: "Parents",
          path: "/super-admin/user-management/parents",
          icon: UserCheck,
        },
      ],
    },
    {
      category: "Academic",
      isCollapsible: true,
      items: [
        {
          name: "Departments",
          path: "/super-admin/academic/departments",
          icon: Briefcase,
        },
        {
          name: "Levels",
          path: "/super-admin/academic/levels",
          icon: GraduationCap,
        },
        {
          name: "Classes",
          path: "/super-admin/academic/classes",
          icon: School,
        },
        {
          name: "Subjects",
          path: "/super-admin/academic/subjects",
          icon: BookOpen,
        },
        {
          name: "Syllabus",
          path: "/super-admin/academic/syllabus",
          icon: FileText,
        },
        { name: "Timetable", path: "/super-admin/timetable", icon: Clock },
      ],
    },
    {
      category: "Student Management",
      isCollapsible: true,
      items: [
        {
          name: "All Students",
          path: "/super-admin/student-management/students",
          icon: Users,
        },
      ],
    },
    {
      category: "Teacher Management",
      isCollapsible: true,
      items: [
        {
          name: "All Teachers",
          path: "/super-admin/teacher-management/teachers",
          icon: Users,
        },
      ],
    },
    {
      category: "Fee Management",
      isCollapsible: true,
      items: [
        {
          name: "Fee Templates",
          path: "/super-admin/fee-management/templates",
          icon: Receipt,
        },
        {
          name: "Fee Voucher",
          path: "/super-admin/fee-vouchers",
          icon: Receipt,
        },
      ],
    },
    {
      category: "Attendance",
      isCollapsible: true,
      items: [
        {
          name: "Attendance QR Code",
          path: "/super-admin/attendance",
          icon: QrCode,
        },
      ],
    },
    {
      category: "Event Management",
      isCollapsible: true,
      items: [
        {
          name: "Calendar View",
          path: "/super-admin/event-management/calendar",
          icon: Calendar,
        },
        {
          name: "All Events",
          path: "/super-admin/event-management/events",
          icon: Calendar,
        },
      ],
    },
  ],

  branch_admin: [
    {
      category: "Dashboard",
      items: [
        { name: "Dashboard", path: "/branch-admin", icon: LayoutDashboard },
      ],
    },
    {
      category: "Academic Management",
      isCollapsible: true,
      items: [
        { name: "Teachers", path: "/branch-admin/teachers", icon: Users },
        { name: "Students", path: "/branch-admin/students", icon: BookOpen },
        { name: "Classes", path: "/branch-admin/classes", icon: School },
        { name: "Timetable", path: "/branch-admin/timetable", icon: Clock },
        { name: "Subjects", path: "/branch-admin/subjects", icon: BookOpen },
        {
          name: "Departments",
          path: "/branch-admin/departments",
          icon: Building2,
        },
        { name: "Syllabus", path: "/branch-admin/syllabus", icon: FileText },
        {
          name: "Parents",
          path: "/branch-admin/parents",
          icon: UserCheck,
        },
      ],
    },
    {
      category: "Operations",
      isCollapsible: true,
      items: [
        { name: "Attendance", path: "/branch-admin/attendance", icon: Clock },
        { name: "Events", path: "/branch-admin/events", icon: Calendar },
        { name: "Exams", path: "/branch-admin/exams", icon: FileText },
      ],
    },
    {
      category: "Academic Structure",
      items: [
        { name: "Academic Structure", path: "/branch-admin/academic-structure", icon: GraduationCap },
      ],
    },
    {
      category: "Finance Management",
      items: [
        { name: "Fees", path: "/branch-admin/fees", icon: DollarSign },
        {
          name: "Fee Voucher",
          path: "/branch-admin/fee-vouchers",
          icon: Receipt,
        },
        {
          name: "Fee Templates",
          path: "/branch-admin/fee-templates",
          icon: Receipt,
        },
        { name: "Expenses", path: "/branch-admin/expenses", icon: Wallet },
      ],
    },
  ],

  teacher: [
    {
      category: "Dashboard",
      items: [{ name: "Dashboard", path: "/teacher", icon: LayoutDashboard }],
    },
    {
      category: "Classes",
      isCollapsible: true,
      items: [
        { name: "My Classes", path: "/teacher/classes", icon: School },
        { name: "Assignments", path: "/teacher/assignments", icon: FileText },
        { name: "Attendance", path: "/teacher/attendance", icon: Clock },
        { name: "Exams", path: "/teacher/exams", icon: Calendar },
        { name: "Results", path: "/teacher/results", icon: BarChart3 },
      ],
    },
    {
      category: "Communication",
      isCollapsible: true,
      items: [
        {
          name: "Parent Contact",
          path: "/teacher/parent-contact",
          icon: Users,
        },
      ],
    },
    {
      category: "Account",
      isCollapsible: true,
      items: [
        { name: "Profile", path: "/teacher/profile", icon: UserCog },
        { name: "Settings", path: "/teacher/settings", icon: Settings },
      ],
    },
  ],

  parent: [
    {
      category: "Dashboard",
      items: [{ name: "Dashboard", path: "/parent", icon: LayoutDashboard }],
    },
    {
      category: "Student Info",
      isCollapsible: true,
      items: [
        { name: "My Children", path: "/parent/children", icon: Users },
        { name: "Attendance", path: "/parent/attendance", icon: Clock },
        { name: "Results", path: "/parent/results", icon: BarChart3 },
        { name: "Fee Status", path: "/parent/fees", icon: DollarSign },
      ],
    },
  ],

  student: [
    {
      category: "Dashboard",
      items: [{ name: "Dashboard", path: "/student", icon: LayoutDashboard }],
    },
    {
      category: "Academics",
      isCollapsible: true,
      items: [
        { name: "My Classes", path: "/student/classes", icon: School },
        { name: "Attendance", path: "/student/attendance", icon: Clock },
        { name: "Exams", path: "/student/exams", icon: FileText },
        { name: "Results", path: "/student/results", icon: BarChart3 },
      ],
    },
    {
      category: "Account",
      isCollapsible: true,
      items: [
        { name: "Profile", path: "/student/profile", icon: Users },
        { name: "Messages", path: "/student/messages", icon: FileText },
        { name: "Settings", path: "/student/settings", icon: Settings },
      ],
    },
  ],
};

// Helper function to determine if section should be collapsible
const shouldBeCollapsible = (group) => {
  // If already marked as collapsible, return true
  if (group.isCollapsible) return true;

  // If more than 1 item, make it collapsible
  return group.items.length > 1;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const userRole = user?.role || "student";
  const menuGroups = ROLE_MENUS[userRole] || ROLE_MENUS.student;

  useEffect(() => {
    // Auto-expand sections that contain the current path
    if (user) {
      menuGroups.forEach((group) => {
        if (
          group.items.some(
            (item) =>
              pathname === item.path || pathname.startsWith(item.path + "/")
          )
        ) {
          setExpandedSections((prev) => ({
            ...prev,
            [group.category]: true,
          }));
        }
      });
    }
  }, [pathname, menuGroups, user]);

  // Early return AFTER all hooks
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const isSectionActive = (items) => {
    return items.some((item) => pathname.startsWith(item.path));
  };

  const sidebarClasses = cn(
    "bg-white border-r border-gray-200 h-screen overflow-y-auto transition-all duration-300 flex flex-col",
    isOpen ? "w-64" : "w-20",
    "fixed md:sticky top-0 z-40 md:z-0"
  );

  // Check if current page is inside this section
  const isCurrentSection = (items) => {
    return items.some(
      (item) => pathname === item.path || pathname.startsWith(item.path + "/")
    );
  };

  // Simple Collapsible Component (inline)
  const CollapsibleSection = ({ group, groupIndex }) => {
    const isExpanded = expandedSections[group.category] || false;
    const Icon = group.items[0]?.icon || FolderOpen;

    // Check if current page is in this section
    const hasActiveItem = isCurrentSection(group.items);

    return (
      <div key={groupIndex} className="px-2 py-1">
        <button
          onClick={() => toggleSection(group.category)}
          className={cn(
            "flex items-center justify-between w-full px-2 py-2 rounded-lg transition-all duration-200 mb-1 hover:bg-gray-100 cursor-pointer",
            hasActiveItem
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-gray-700"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 transition-all duration-200 group-hover:h-5 group-hover:w-5" />
            <span className="text-base font-medium hover:text-blue-600 transition-colors duration-200">{group.category}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4" />
          ) : (
            <ChevronRight className="h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4" />
          )}
        </button>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="ml-6 space-y-1">
            {group.items.map((item) => {
              const ItemIcon = item.icon;
              const isItemActive =
                pathname === item.path || pathname.startsWith(item.path + "/");

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200 text-base hover:bg-gray-100 cursor-pointer",
                    isItemActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <ItemIcon className="h-3 w-3 shrink-0 transition-all duration-200 hover:h-4 hover:w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Single Item Section (not collapsible)
  const SingleItemSection = ({ group, groupIndex }) => {
    // For single item sections, just show the item directly
    const item = group.items[0];
    const Icon = item.icon;
    const isActive =
      pathname === item.path || pathname.startsWith(item.path + "/");

    return (
      <div key={groupIndex} className="px-3 py-2">
        <Link
          href={item.path}
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 hover:bg-gray-100 cursor-pointer",
            isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
          )}
        >
          <Icon className="h-5 w-5 shrink-0 transition-all duration-200 hover:h-6 hover:w-6" />
          <span className="text-base font-medium">{item.name}</span>
        </Link>
      </div>
    );
  };

  // Simple Section for sidebar collapsed view
  const CollapsedViewSection = ({ group, groupIndex }) => {
    if (group.isCollapsible || group.items.length > 1) {
      return (
        <div key={groupIndex} className="px-2 py-1">
          {group.items.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.path || pathname.startsWith(item.path + "/");

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 mb-1 hover:bg-gray-100 cursor-pointer",
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700"
                )}
                title={item.name}
              >
                <Icon className="h-5 w-5 shrink-0 transition-all duration-200 hover:h-6 hover:w-6" />
              </Link>
            );
          })}
        </div>
      );
    }

    // Single item in collapsed view
    const item = group.items[0];
    const Icon = item.icon;
    const isActive =
      pathname === item.path || pathname.startsWith(item.path + "/");

    return (
      <div key={groupIndex} className="px-2 py-1">
        <Link
          href={item.path}
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 mb-1 hover:bg-gray-100 cursor-pointer",
            isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
          )}
          title={item.name}
        >
          <Icon className="h-5 w-5 shrink-0 transition-all duration-200 hover:h-6 hover:w-6" />
        </Link>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-50 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Ease Academy</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          sidebarClasses,
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "border-b border-gray-200 flex items-center justify-between",
            isOpen ? "p-4" : "p-2"
          )}
        >
          {isOpen && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ease</h1>
              <p className="text-sm text-gray-500">Academy</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex"
          >
            <Menu className="h-3 w-3" />
          </Button>
        </div>

        {/* User Info */}
        <div className={cn("border-b border-gray-200", isOpen ? "p-3" : "p-2")}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0 text-sm">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>
            {isOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.fullName}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {user.role?.replace("_", " ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          {menuGroups.map((group, groupIndex) => {
            // If sidebar is collapsed
            if (!isOpen) {
              return (
                <CollapsedViewSection
                  key={groupIndex}
                  group={group}
                  groupIndex={groupIndex}
                />
              );
            }

            // Expanded sidebar
            if (group.isCollapsible || group.items.length > 1) {
              return (
                <CollapsibleSection
                  key={groupIndex}
                  group={group}
                  groupIndex={groupIndex}
                />
              );
            }

            // Single item section in expanded view
            return (
              <SingleItemSection
                key={groupIndex}
                group={group}
                groupIndex={groupIndex}
              />
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div className={cn("border-t border-gray-200", isOpen ? "p-3" : "p-2")}>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50",
              isOpen ? "" : "px-2"
            )}
          >
            <LogOut className="h-4 w-4" />
            {isOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}