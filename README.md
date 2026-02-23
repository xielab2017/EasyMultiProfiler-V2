# EasyMultiProfiler V2.0 (Web版)

多组学数据分析网页平台 - 支持微生物组、ChIP-seq、单细胞等分析

## 功能模块

| 模组 | 状态 | 描述 |
|------|------|------|
| 微生物组 | ✅ | α/β多样性、网络分析、差异分析 |
| ChIP-seq | ✅ | Peak calling、Motif分析、注释 |
| CUT&Tag | ✅ | 靶向切割分析 |
| CUT&RUN | ✅ | 切割分析 |
| scRNA-seq | ✅ | 单细胞聚类、标记基因、轨迹分析 |
| 代谢组 | ✅ | 代谢通路分析 |
| 多组学整合 | ✅ | 跨组学联合分析 |

## 快速开始

### 方式1: Docker (推荐)

```bash
docker pull xielab/easy-multi-profiler-web:latest
docker run -p 8080:8080 xielab/easy-multi-profiler-web
```

### 方式2: 本地安装

```bash
# 后端
cd backend
pip install -r requirements.txt
python app.py

# 前端
cd frontend
npm install
npm start
```

访问: http://localhost:8080

## 特性

- 🌐 纯网页操作，无需R环境
- 📊 交互式可视化
- 🔒 本地处理，数据安全
- 📱 响应式设计
- 🌙 中英文双语支持

## 原R包版本

R包版本仍维护在: https://github.com/xielab2017/EasyMultiProfiler

## 文档

详细文档: https://easymultiprofiler.xielab.net

## 发表

Science China Life Sciences (2025), DOI: 10.1007/s11427-025-3035-0
