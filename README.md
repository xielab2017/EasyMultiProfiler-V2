# EasyMultiProfiler Web v2.0

多组学数据分析网页平台 - 支持微生物组、ChIP-seq、单细胞等分析

## 功能特性

- 📤 **数据上传** - 支持 CSV、TSV、Excel 格式文件拖拽上传
- 🧬 **多组学分析** - 微生物组、ChIP-seq、CUT&Tag、单细胞、代谢组等
- 📊 **交互式可视化** - 实时查看分析结果和图表
- 🔗 **R 集成** - 直接调用 EasyMultiProfiler R 包进行分析
- 🐳 **Docker 部署** - 一键启动，无需配置环境

## 快速开始

### 方式1: Docker (推荐)

```bash
# 克隆仓库
git clone https://github.com/xielab2017/EasyMultiProfiler-Web.git
cd EasyMultiProfiler-Web

# 使用 Docker Compose 启动
docker-compose up -d

# 访问 http://localhost:8080
```

### 方式2: 本地开发

**前端:**
```bash
cd frontend
npm install
npm start
```

**后端:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## 系统架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React 前端    │────▶│  Flask 后端 API │────▶│   R 分析脚本    │
│   (Ant Design)  │◀────│   (Python)      │◀────│ (EasyMultiProfiler)
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   数据上传界面          文件存储/任务管理          多组学分析
   参数配置面板          结果收集/转码              图表生成
   结果可视化
```

## API 接口

### 上传数据
```bash
POST /api/upload
Content-Type: multipart/form-data

file: <数据文件>
```

### 执行分析
```bash
POST /api/analyze
Content-Type: application/json

{
  "file_id": "uuid",
  "module": "microbiome",
  "params": {
    "alpha": {"metric": "shannon"},
    "beta": {"method": "bray"}
  }
}
```

### 查询状态
```bash
GET /api/status/{task_id}
```

### 获取结果
```bash
GET /api/results/{task_id}
```

## 支持的文件格式

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| CSV | .csv | 逗号分隔值 |
| TSV | .tsv, .txt | 制表符分隔 |
| Excel | .xls, .xlsx | Microsoft Excel |

## 分析模块

| 模块 | 功能 |
|------|------|
| 🦠 微生物组 | α/β多样性、网络分析、差异分析 |
| 🧬 ChIP-seq | Peak calling、Motif分析、注释 |
| ✂️ CUT&Tag | Peak检测、富集分析 |
| 🔬 CUT&RUN | Peak calling、QC报告 |
| 🧫 单细胞RNA-seq | 聚类、标记基因、轨迹分析 |
| ⚗️ 代谢组 | 通路分析、差异代谢物 |
| 🔗 多组学整合 | 相关性分析、网络整合 |

## 数据格式要求

### 微生物组数据
- 行: OTU/ASV/特征
- 列: 样本
- 值: 丰度 (count 或 relative abundance)

### 单细胞数据
- 行: 基因
- 列: 细胞
- 值: 表达量

### ChIP-seq 数据
- Peak count 矩阵 或 BAM 文件列表

## 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| Web 应用 | 8080 | Docker 映射端口 |
| Flask API | 5000 | 后端服务端口 |
| 开发前端 | 3000 | React 开发服务器 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| FLASK_ENV | production | 运行环境 |
| FLASK_PORT | 5000 | 服务端口 |
| MAX_FILE_SIZE | 52428800 | 最大文件大小 (50MB) |

## 部署到 GitHub Pages

1. 在仓库设置中启用 GitHub Pages
2. 选择 Source 为 "GitHub Actions"
3. 推送代码到 main 分支自动部署

## 引用

如果您使用了 EasyMultiProfiler，请引用:

> Science China Life Sciences (2025), DOI: 10.1007/s11427-025-3035-0

## 许可证

MIT License

## 联系方式

- 项目主页: https://github.com/xielab2017/EasyMultiProfiler
- 文档: https://easymultiprofiler.xielab.net
- 邮箱: contact@xielab.net
