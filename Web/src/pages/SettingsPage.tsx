import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { Sun, Moon, Monitor, Bell, Globe, Shield } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();
  const { user, updateUser } = useUser();

  // Notification settings (mock)
  const [notifications, setNotifications] = React.useState({
    email: true,
    push: false,
    system: true,
  });

  // Language setting (mock)
  const [language, setLanguage] = React.useState('zh-CN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="text-muted-foreground mt-1">
          管理系统设置和个人偏好
        </p>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5" />
            外观设置
          </CardTitle>
          <CardDescription>
            自定义系统外观和主题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>主题模式</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setTheme('light')}
              >
                <Sun className="w-6 h-6" />
                <span>浅色</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setTheme('dark')}
              >
                <Moon className="w-6 h-6" />
                <span>深色</span>
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setTheme('system')}
              >
                <Monitor className="w-6 h-6" />
                <span>系统</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              当前主题：{theme === 'system' ? `跟随系统 (${isDark ? '深色' : '浅色'})` : theme}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            通知设置
          </CardTitle>
          <CardDescription>
            管理通知偏好设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>邮件通知</Label>
              <p className="text-sm text-muted-foreground">
                接收系统邮件通知
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, email: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>推送通知</Label>
              <p className="text-sm text-muted-foreground">
                接收浏览器推送通知
              </p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, push: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>系统通知</Label>
              <p className="text-sm text-muted-foreground">
                接收系统内通知
              </p>
            </div>
            <Switch
              checked={notifications.system}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, system: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            语言设置
          </CardTitle>
          <CardDescription>
            选择系统显示语言
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>系统语言</Label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            安全设置
          </CardTitle>
          <CardDescription>
            管理账户安全设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">当前密码</Label>
            <Input id="current-password" type="password" placeholder="输入当前密码" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">新密码</Label>
            <Input id="new-password" type="password" placeholder="输入新密码" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">确认密码</Label>
            <Input id="confirm-password" type="password" placeholder="再次输入新密码" />
          </div>
          <Button>修改密码</Button>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>
            查看当前账户信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">用户名</Label>
              <p className="font-medium">{user?.username || '未登录'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">邮箱</Label>
              <p className="font-medium">{user?.email || '未设置'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">用户 ID</Label>
              <p className="font-medium">{user?.id || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">角色</Label>
              <p className="font-medium">{user?.role || '未设置'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;