import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
    path: '/ground-truth',
    label: '地表真值',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    path: '/inference',
    label: '地表真值推理',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    path: '/datasets',
    label: '数据集管理',
    icon: <Database className="w-5 h-5" />,
  },
];

const SidebarContent = ({ collapsed }: { collapsed: boolean }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className={cn(
        "h-16 flex items-center border-b border-border",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {!collapsed && (
          <span className="font-semibold text-lg text-foreground">高光谱图像分析系统</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
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
  const { theme, setTheme, isDark } = useTheme();

  const getPageTitle = () => {
    const item = navItems.find(item => item.path === location.pathname);
    return item?.label || 'HSI 系统';
  };

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return `跟随系统 (${isDark ? '深色' : '浅色'})`;
    return theme === 'light' ? '浅色' : '深色';
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
          <Button variant="ghost" size="icon" className="md:hidden absolute top-3 left-3">
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
          <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            title={`主题: ${getThemeLabel()}`}
          >
            {getThemeIcon()}
          </Button>
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