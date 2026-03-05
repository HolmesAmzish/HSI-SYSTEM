import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Image, 
  CheckCircle, 
  Zap, 
  Database, 
  ArrowRight,
  Satellite,
  Leaf,
  Layers,
  BarChart3,
  Globe,
  Microscope
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Import images
import pixxelSpaceImg from '@/assets/Pixxel_Space_1_002.webp';
import specTirImg from '@/assets/SpecTIR_PCA123_social.webp';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <Image className="h-6 w-6" />,
      title: 'HSI 查看器',
      description: '通过自定义RGB波段组合可视化高光谱图像。',
      path: '/viewer',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: '真值数据',
      description: '管理和可视化分割任务的真实标签掩码。',
      path: '/ground-truth',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: '模型推理',
      description: '在高光谱图像上运行AI模型进行自动分割。',
      path: '/inference',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: '数据集管理',
      description: '将高光谱图像组织成数据集以便更好地管理。',
      path: '/datasets',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const applications = [
    {
      icon: <Leaf className="h-8 w-8" />,
      title: '精准农业',
      description: '监测作物健康状况、病虫害检测、产量预估和灌溉管理，实现精细化农业生产。',
      color: 'text-green-500',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: '地质勘探',
      description: '识别矿物成分、绘制地质图、探测矿产资源，为地质调查提供精准数据支持。',
      color: 'text-amber-500',
    },
    {
      icon: <Satellite className="h-8 w-8" />,
      title: '环境监测',
      description: '水质评估、植被覆盖变化、城市扩张监测，助力生态环境保护与可持续发展。',
      color: 'text-blue-500',
    },
  ];

  const advantages = [
    {
      icon: <Layers className="h-6 w-6" />,
      title: '丰富光谱信息',
      description: '数百个连续波段捕捉地物完整光谱特征',
    },
    {
      icon: <Microscope className="h-6 w-6" />,
      title: '精准识别能力',
      description: '基于光谱指纹实现物质成分精确识别',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: '定量分析',
      description: '支持地物参数定量反演与变化监测',
    },
  ];

  return (
    <div className="space-y-12 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative px-8 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Satellite className="h-4 w-4" />
            高光谱遥感技术平台
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            高光谱图像分析系统
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            一个用于管理、可视化和分析高光谱图像的综合平台。
            <br className="hidden md:block" />
            上传MAT文件，探索多波段数据，运行AI驱动的分割任务。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/hsi-manage">
                <Image className="h-5 w-5" />
                开始使用
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="gap-2">
              <Link to="/viewer">
                查看演示
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What is HSI Section */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              什么是高光谱图像？
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              高光谱成像（Hyperspectral Imaging, HSI）是一种捕获和处理整个电磁波谱范围内信息的技术。
              与传统RGB图像仅包含红、绿、蓝三个波段不同，高光谱图像可包含数百个连续的窄波段，
              每个像素都拥有完整的光谱曲线，如同地物的"指纹"，可用于精确识别物质成分。
            </p>
          </div>
          
          <div className="grid gap-4">
            {advantages.map((adv, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {adv.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{adv.title}</h3>
                  <p className="text-sm text-muted-foreground">{adv.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <img 
            src={pixxelSpaceImg} 
            alt="高光谱卫星遥感"
            className="relative rounded-xl border border-border shadow-2xl w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-sm text-muted-foreground">
            高光谱卫星遥感成像
          </div>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Applications Section */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            应用领域
          </h2>
          <p className="text-muted-foreground">
            高光谱成像技术在地理科学和现代农业领域具有广泛而重要的应用价值
          </p>
        </div>

        {/* Application Cards - 2x4 grid: image 2x2 on left, 4 cards on right */}
        <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-4">
          {/* Image spanning 2 rows and 2 columns */}
          <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden border border-border group">
            <img 
              src={specTirImg} 
              alt="高光谱图像主成分分析"
              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-bold text-foreground mb-2">
                高光谱图像分析
              </h3>
              <p className="text-sm text-muted-foreground">
                通过主成分分析等数据处理技术，从高光谱图像中提取有价值的信息，
                为农业监测、地质勘探、环境保护等领域提供精准数据支持。
              </p>
            </div>
          </div>
          
          {/* 4 application cards */}
          {applications.map((app, index) => (
            <Card key={index} className="group hover:border-primary/50 transition-all hover:shadow-lg overflow-hidden">
              <CardHeader className="pb-2">
                <div className={`inline-flex p-2 rounded-lg ${app.color} bg-opacity-10 w-fit mb-2`}>
                  {React.cloneElement(app.icon, { className: 'h-5 w-5' })}
                </div>
                <CardTitle className="text-base">{app.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {app.description}
                </p>
              </CardContent>
            </Card>
          ))}
          
          {/* 4th card - Data Processing */}
          <Card className="group hover:border-primary/50 transition-all hover:shadow-lg overflow-hidden">
            <CardHeader className="pb-2">
              <div className="inline-flex p-2 rounded-lg text-purple-500 bg-purple-500/10 w-fit mb-2">
                <BarChart3 className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">数据处理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                支持多种数据格式的导入导出，提供波段选择、图像增强等预处理功能。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Technical Significance Section */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <Card className="border-primary/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <Leaf className="h-6 w-6" />
              </div>
              <CardTitle>农业领域的重要意义</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              高光谱成像正在革命性地改变现代农业的管理方式：
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                <span><strong className="text-foreground">作物健康监测</strong> - 早期发现病虫害和营养缺乏</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                <span><strong className="text-foreground">精准灌溉</strong> - 基于作物水分状态的智能灌溉决策</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                <span><strong className="text-foreground">产量预测</strong> - 提前预估作物产量，优化供应链</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                <span><strong className="text-foreground">品质分级</strong> - 无损检测农产品品质和成熟度</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Globe className="h-6 w-6" />
              </div>
              <CardTitle>地理科学的重要意义</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              高光谱遥大为地理科学研究提供了强有力的技术支撑：
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                <span><strong className="text-foreground">矿物填图</strong> - 精确识别矿物类型与分布范围</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                <span><strong className="text-foreground">土壤分析</strong> - 评估土壤类型、湿度和有机质含量</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                <span><strong className="text-foreground">水体监测</strong> - 检测水质参数和污染物质分布</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                <span><strong className="text-foreground">植被分类</strong> - 精细区分植被类型和生长状态</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-12" />

      {/* System Features */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            系统功能
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            本系统提供完整的高光谱图像处理与分析能力，支持从数据管理到智能分析的全流程操作
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card key={feature.path} className="group hover:border-primary/50 transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className={`${feature.bgColor} ${feature.color} p-3 rounded-lg`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {feature.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" asChild className="group-hover:text-primary">
                  <Link to={feature.path}>
                    开始使用
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Start CTA */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20">
        <div className="px-8 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            立即开始探索
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            上传您的第一个MAT格式高光谱图像文件，体验强大的可视化与分析功能
          </p>
          <Button asChild size="lg">
            <Link to="/hsi-manage">
              <Image className="mr-2 h-5 w-5" />
              前往图像管理
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;