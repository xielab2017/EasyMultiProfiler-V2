# EasyMultiProfiler Web 修复计划

## 问题诊断
当前网页版仅有骨架代码，缺少核心功能：
1. ❌ 前端只有 package.json，没有实际页面代码
2. ❌ 后端 app.py 不完整，没有文件上传 API
3. ❌ 没有与 R 语言端的集成

## 实现目标
创建完整的多组学数据分析网页平台，支持数据上传、分析和结果展示。

## 技术架构

### 前端 (React + Ant Design)
- **数据上传模块**: 支持 CSV/TSV/Excel 文件拖拽上传
- **分析配置面板**: 选择分析模块、设置参数
- **结果展示**: 图表、表格、下载报告
- **模块选择界面**: 7个分析模块入口

### 后端 (Flask + Python)
- **文件上传 API**: `/api/upload` - 接收数据文件
- **分析执行 API**: `/api/analyze` - 调用 R 脚本
- **状态查询 API**: `/api/status/<task_id>` - 查询分析进度
- **结果获取 API**: `/api/results/<task_id>` - 获取分析结果

### R 集成
- **R 脚本接口**: 接收数据路径和参数，执行 EasyMultiProfiler 分析
- **结果输出**: 生成图表和统计结果

## 文件结构

```
EasyMultiProfiler-Web/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                 # 主应用组件
│   │   ├── index.js               # 入口
│   │   ├── components/
│   │   │   ├── DataUpload.js      # 数据上传组件
│   │   │   ├── ModuleSelector.js  # 模块选择
│   │   │   ├── AnalysisPanel.js   # 分析配置面板
│   │   │   └── ResultsViewer.js   # 结果展示
│   │   └── styles/
│   │       └── App.css
│   └── package.json
├── backend/
│   ├── app.py                     # Flask 主应用
│   ├── r_interface.py             # R 脚本调用接口
│   ├── requirements.txt
│   └── r_scripts/
│       ├── microbiome_analysis.R  # 微生物组分析
│       ├── chipseq_analysis.R     # ChIP-seq 分析
│       └── ...                    # 其他分析模块
└── README.md
```

## 实现步骤

### Phase 1: 前端基础架构
1. 创建 React 项目结构
2. 实现主应用框架和路由
3. 添加 Ant Design 组件库

### Phase 2: 数据上传组件
1. 实现拖拽上传界面
2. 添加文件类型验证 (CSV/TSV/XLSX)
3. 连接后端上传 API

### Phase 3: 后端 API 完善
1. 实现文件上传接口
2. 添加数据验证和预处理
3. 实现任务队列管理

### Phase 4: R 集成
1. 创建 R 脚本调用接口
2. 实现分析模块脚本
3. 结果收集和返回

### Phase 5: 结果展示
1. 实现图表展示组件
2. 添加结果下载功能
3. 完善用户体验

## 关键 API 设计

### POST /api/upload
上传数据文件
```json
Request:
- file: 数据文件 (CSV/TSV/Excel)
- module: 分析模块类型

Response:
{
  "success": true,
  "file_id": "uuid",
  "columns": ["col1", "col2", ...],
  "rows": 1000,
  "preview": [...]
}
```

### POST /api/analyze
执行分析
```json
Request:
{
  "file_id": "uuid",
  "module": "microbiome",
  "params": {
    "alpha_metric": "shannon",
    "beta_method": "bray"
  }
}

Response:
{
  "success": true,
  "task_id": "task_uuid",
  "status": "queued"
}
```

### GET /api/status/<task_id>
查询任务状态
```json
Response:
{
  "task_id": "task_uuid",
  "status": "running|completed|failed",
  "progress": 75,
  "message": "Running alpha diversity..."
}
```

### GET /api/results/<task_id>
获取结果
```json
Response:
{
  "plots": [...],
  "tables": [...],
  "report_url": "/results/task_uuid/report.html"
}
```

## R 脚本接口设计

R 脚本接收参数：
```bash
Rscript microbiome_analysis.R \
  --input /path/to/data.csv \
  --output /path/to/results/ \
  --module microbiome \
  --params '{"alpha_metric":"shannon"}'
```

## 测试计划
1. 单元测试: 文件上传、数据验证
2. 集成测试: 前端-后端-R 完整流程
3. 示例数据测试: 使用标准数据集验证分析结果

## 部署
- Docker 容器化
- 支持本地和服务器部署
- 文档更新
