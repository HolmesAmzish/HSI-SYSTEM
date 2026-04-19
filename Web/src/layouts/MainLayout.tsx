import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Home,
  Image,
  CheckCircle,
  Zap,
  Database,
  Menu,
  Sun,
  Moon,
  Monitor,
  FolderOpen,
  Eye,
  BarChart3,
  User,
  LogOut,
  Settings,
  LogIn,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: '主页',
    icon: <Home className="w-5 h-5" />,
  },
  {
    path: '/hsi-manage',
    label: '图像管理',
    icon: <FolderOpen className="w-5 h-5" />,
  },
  {
    path: '/viewer',
    label: '图像检视',
    icon: <Image className="w-5 h-5" />,
  },
  {
    path: '/analysis',
    label: '高光谱分析',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    path: '/ground-truth',
    label: '地表真值',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    path: '/gt-viewer',
    label: '真值检视',
    icon: <Eye className="w-5 h-5" />,
  },
  {
    path: '/inference',
    label: '推理管理',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    path: '/datasets',
    label: '数据集管理',
    icon: <Database className="w-5 h-5" />,
  },
];

const SidebarContent = ({ collapsed, onThemeClick }: { collapsed: boolean; onThemeClick?: () => void }) => {
  const location = useLocation();
  const { theme, setTheme, isDark } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
    onThemeClick?.();
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return `系统 (${isDark ? '深' : '浅'})`;
    return theme === 'light' ? '浅色' : '深色';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className={cn(
        "h-16 flex items-center border-b border-border",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {!collapsed && (
          <span className="font-semibold text-lg text-foreground">云眼巡田分析系统</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center"
                  )
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Theme Toggle */}
      <div className={cn(
        "p-2 border-t border-border",
        collapsed ? "px-1" : "px-3"
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleTheme}
          className={cn(
            "w-full justify-start gap-3",
            collapsed && "justify-center px-2"
          )}
        >
          {getThemeIcon()}
          {!collapsed && <span className="text-sm">{getThemeLabel()}</span>}
        </Button>
      </div>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t border-border",
        collapsed && "px-2"
      )}>
        {collapsed ? (
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-xs font-medium text-primary">HSI</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            高光谱图像分析系统
          </div>
        )}
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: userLoading, logout } = useUser();

  const getPageTitle = () => {
    const item = navItems.find(item => item.path === location.pathname);
    return item?.label || 'HSI 系统';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex relative border-r border-border bg-card flex-col transition-all duration-300",
          sidebarExpanded ? "w-56" : "w-16"
        )}
      >
        <SidebarContent collapsed={!sidebarExpanded} />
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className={cn(
            "absolute top-20 -right-3 h-6 w-6 rounded-full border bg-background shadow-sm",
            !sidebarExpanded && "rotate-180"
          )}
        >
          <Menu className="w-3 h-3" />
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute top-3 left-3 z-50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
          </div>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.username}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>设置</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>个人资料</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>未登录</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/login')}>
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>登录</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;