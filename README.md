# 高光谱图像分析系统（HSI-SYSTEM）

*针对地理遥感高光谱图像（卫星图像或无人机）的分析系统，目前主要针对农业作物图像分析*

![HSI-SYSTEM](https://wakapi.arorms.cn/api/badge/Cacciatore/interval:any/project:HSI-SYSTEM)

## 基本功能

**文件与数据管理**

将高光谱图像和地面真值转换成统一的 BIN 格式，元信息由数据库直接维护。现在支持 MAT（v5, v7.3）格式。

允许用户上传和编辑维护数据，包括高光谱图像，地表真值，数据集，标签，推理模型。

**高光谱图片分析**

支持预览高光谱图像，允许指定通道索引合成对应假彩色图片。

通过对高光谱图像 PCA 算法降维，将原高光谱图像转换为一个三维立方体，并通过三维坐标显示。

**地面真值分析**

支持地面真值预览，同时根据地面真值标记出本数据集对应类别的光谱特征。

## 安装与运行

本项目目前处于开发阶段，包含三个重要模块

**后端模块 Server**

配置需要安装 PostgreSQL 和 Redis。

完成后进入对应文件夹启动程序：

```bash
gradle bootRun
```

Windows 环境下

```ps1
./gradle.bat bootRun
```

**推理模块 Inference**

本模块负责处理一些杂务和推理任务，通过监听 Redis 队列来接收处理任务

```bash
uv run main.py
```

**前端模块 Web**

提供基本用户交互

```bash
npm run dev
```

最后访问 [localhost:5173](localhost:5173) 即可