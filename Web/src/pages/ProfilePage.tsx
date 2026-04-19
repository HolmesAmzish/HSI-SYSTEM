import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Camera, Save } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>未登录</CardTitle>
            <CardDescription>
              请先登录以查看和编辑个人资料
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/login'}>
              去登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">个人资料</h1>
        <p className="text-muted-foreground mt-1">
          查看和编辑您的个人信息
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>头像</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-2xl">
                {user.username?.charAt(0).toUpperCase() || <User className="w-16 h-16" />}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              更换头像
            </Button>
          </CardContent>
        </Card>

        {/* Profile Info Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>
                管理您的账户信息
              </CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                编辑资料
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="pl-10"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>用户 ID</Label>
              <Input value={user.id?.toString() || ''} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>角色</Label>
              <Input value={user.role || '普通用户'} disabled className="bg-muted" />
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  取消
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Stats */}
      <Card>
        <CardHeader>
          <CardTitle>账户统计</CardTitle>
          <CardDescription>
            您的账户活动统计
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">上传图像</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">推理任务</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">数据集</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">地表真值</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;