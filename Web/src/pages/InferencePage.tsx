import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const InferencePage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">推理模块</CardTitle>
          <CardDescription>
            此模块将支持在高光谱图像上运行分割模型。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            即将推出...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InferencePage;