import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const GroundTruthPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">真值模块</CardTitle>
          <CardDescription>
            此模块将支持加载和可视化分割真值掩码。
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

export default GroundTruthPage;