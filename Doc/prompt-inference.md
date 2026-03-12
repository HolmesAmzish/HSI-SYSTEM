C:\Development\workspace\ARSNet 阅读这个项目，这是根据高光谱图像推理的模型，现在我需要你将这个项目改造这个Inference 模块

这个模块是在本地监听redis mq，根据Spring传递过来的任务来工作的

gtload是读取gt矩阵，源文件是mat文件java读取不方便，转换成bin文件，hsiload任务差不多

inference是将hsi 的mat文件输入到模型中进行推理并返回gt mat文件。同时由于高光谱数据的特殊性还要输入数据集。

现在的任务：

1. ✅ 已完成 - 添加一个新的任务队列和处理，通过PCA算法，将高光谱图像转换为三通道立方体
    - 已添加 `HSI_PCA` 任务类型到 `TaskType` 枚举
    - 已创建 `HsiPcaPayload` 模型（包含 hsiId 和 filePath 字段）
    - 已创建 `HsiPcaResult` 结果模型
    - 已添加 `REDIS_QUEUE_HSI_PCA` 配置（hsi:queue:hsi-pca）
    - 已创建 `HsiPcaHandler` 处理器，实现PCA降维到3通道RGB
    - 已在 `main.py` 中添加 `_handle_hsi_pca` 处理方法
    
    PCA处理流程：
    1. 加载HSI MAT文件（支持v5/v7和v7.3 HDF5格式）
    2. 将3D立方体展平为2D (height*width, bands)
    3. 应用sklearn PCA降维到3个主成分
    4. 对每个通道进行min-max归一化到[0,1]
    5. 保存为float32二进制文件

    Payload定义：
    ```java
    public class HsiPcaTask extends TaskPayload{
        private Long hsiId; // used to find hsi after finishing
        private String filePath;
    }
    ```

2. 待完成 - 完善推理模块，输入hsi路径和模型路径，进行推理出gt mat文件并返回。

---

## 项目结构

```
Inference/
├── main.py                 # 主入口，TaskWorker监听Redis队列
├── config/
│   ├── settings.py         # 配置（路径、Redis队列名）
│   └── redis_config.py     # Redis连接配置
├── models/
│   ├── task.py             # 任务Payload模型
│   └── result.py           # 结果模型
├── handlers/
│   ├── hsi_load_handler.py # HSI加载处理器
│   ├── gt_load_handler.py  # GT加载处理器
│   └── hsi_pca_handler.py  # HSI PCA处理器
├── service/
│   ├── result_service.py   # 结果发布服务
│   └── ...
└── core/
    └── dependencies.py     # 依赖注入
```

## 任务队列

| 任务类型 | 队列名 | 状态 |
|---------|--------|------|
| HSI_LOAD | hsi:queue:hsi-load | ✅ 已实现 |
| GT_LOAD | hsi:queue:gt-load | ✅ 已实现 |
| HSI_PCA | hsi:queue:hsi-pca | ✅ 已实现 |
| HSI_INFERENCE | hsi:queue:hsi-inference | ⏳ 待实现 |

所有结果发布到: `hsi:queue:task-result`
