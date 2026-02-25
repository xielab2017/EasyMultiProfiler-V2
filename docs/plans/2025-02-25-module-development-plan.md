# EasyMultiProfiler V2.0 模块开发计划

## 当前状态

| 模块 | 当前状态 | 需要的R包集成 |
|------|----------|--------------|
| RNA-seq | ✅ 已集成EMP | EasyMultiProfiler::EMP_diff_analysis |
| 蛋白质组学 | ✅ 已集成EMP | EasyMultiProfiler::EMP_diff_analysis |
| 微生物组 | ✅ 已集成EMP | EasyMultiProfiler::EMP_alpha_analysis |
| **ChIP-seq** | ⚠️ 模拟实现 | **ChIPseeker, ChIPpeakAnno, MACS2** |
| **CUT&RUN** | ⚠️ 模拟实现 | **SEACR, MACS2, DiffBind** |
| **CUT&Tag** | ⚠️ 模拟实现 | **MACS2, SEACR, ChIPseeker** |
| **单细胞RNA-seq** | ⚠️ 模拟实现 | **Seurat, SingleR, Monocle3** |
| 代谢组 | ⚠️ 模拟实现 | MetaboAnalystR, limma |
| 多组学整合 | ⚠️ 模拟实现 | MOFA2, mixOmics, iClusterPlus |

## Phase 1: 单细胞RNA-seq 完整实现

### 需要的R包
```r
# 核心
BiocManager::install(c("SingleCellExperiment", "scater", "scran"))
install.packages(c("Seurat", "SeuratObject"))
BiocManager::install(c("SingleR", "celldex"))  # 细胞注释
BiocManager::install("monocle3")  # 轨迹分析
```

### 分析流程
1. **数据导入** - CreateSeuratObject()
2. **质控** - QC, 过滤低质量细胞
3. **标准化** - NormalizeData(), FindVariableFeatures()
4. **降维聚类** - ScaleData() → RunPCA() → RunUMAP() → FindNeighbors() → FindClusters()
5. **标记基因** - FindAllMarkers()
6. **细胞注释** - SingleR::SingleR()
7. **轨迹分析** - monocle3::learn_graph()
8. **可视化** - DimPlot(), FeaturePlot(), VlnPlot()

### Web参数配置
- 质控: min_genes, min_cells, max_mt_percent
- 聚类: resolution, dims
- 降维: umap/pca/tsne

## Phase 2: ChIP-seq / CUT&RUN / CUT&Tag 完整实现

### 需要的R包
```r
# ChIP-seq分析
BiocManager::install(c("ChIPseeker", "ChIPpeakAnno", "TxDb.Hsapiens.UCSC.hg38.knownGene"))
BiocManager::install("DiffBind")  # 差异peak分析
BiocManager::install("rGADEM")  # Motif分析

# CUT&Tag/CUT&RUN
# 依赖外部工具: MACS2, SEACR, bowtie2 (通过system调用)
```

### 分析流程
1. **Peak calling** - MACS2 callpeak / SEACR
2. **Peak注释** - ChIPseeker::annotatePeak()
3. **Motif分析** - rGADEM / memesuite
4. **差异Peak** - DiffBind::dba.analyze()
5. **富集分析** - clusterProfiler
6. **可视化** - covplot(), plotAnnoPie()

### Web参数配置
- Peak calling: qvalue阈值, 方法选择(MACS2/SEACR)
- 注释: 基因组版本(hg38/mm10)
- Motif: 数据库选择

## Phase 3: 代谢组学完整实现

### 需要的R包
```r
# 代谢组分析
BiocManager::install(c("limma", "ROTS"))  # 差异分析
install.packages("MetaboAnalystR")  # 通路分析
```

### 分析流程
1. **数据预处理** - 缺失值填充, 归一化
2. **差异代谢物** - limma/ROTS
3. **通路富集** - MetaboAnalystR::PerformEnrichment()
4. **多变量分析** - PCA, PLS-DA

## Phase 4: 多组学整合分析 (MOFA2)

### 需要的R包
```r
BiocManager::install("MOFA2")  # 多组学因子分析
install.packages("mixOmics")   # 多组学整合
BiocManager::install("iClusterPlus")  # 聚类整合
```

### 支持的组学组合
1. **表观+转录**: ChIP-seq + RNA-seq
2. **单细胞+bulk**: scRNA-seq + RNA-seq 去卷积
3. **宿主+微生物**: RNA-seq + 16S/宏基因组
4. **代谢+基因**: 代谢组 + RNA-seq
5. **三组学+**: ChIP-seq + RNA-seq + 代谢组
6. **全组学**: 所有类型整合

### 分析流程
1. **数据对齐** - 样本ID匹配
2. **MOFA2分析** - create_mofa_object() → run_mofa()
3. **因子解释** - plot_factor_correlation()
4. **特征权重** - plot_weights()
5. **联合可视化** - 整合热图, 网络图

## 实现优先级

1. **P0 (紧急)**: 单细胞RNA-seq (调用Seurat)
2. **P1 (高)**: ChIP-seq (调用ChIPseeker)
3. **P2 (中)**: CUT&Tag/CUT&RUN (调用SEACR/MACS2)
4. **P3 (中)**: 代谢组 (MetaboAnalystR)
5. **P4 (未来)**: 多组学MOFA2整合

## 技术方案

### R脚本架构
```r
# 单细胞示例
source_emp_or_install <- function() {
  if (!require("EasyMultiProfiler")) {
    devtools::install_github("xielab2017/EasyMultiProfiler")
  }
  library(EasyMultiProfiler)
}

analyze_scrnaseq <- function(counts, metadata, params) {
  # 1. 检查并安装依赖
  if (!require("Seurat")) install.packages("Seurat")
  
  # 2. 创建Seurat对象
  seurat_obj <- CreateSeuratObject(counts = counts, meta.data = metadata)
  
  # 3. QC
  seurat_obj <- PercentageFeatureSet(seurat_obj, pattern = "^MT-", col.name = "percent.mt")
  seurat_obj <- subset(seurat_obj, subset = nFeature_RNA > params$qc$min_genes & percent.mt < 5)
  
  # 4. 标准化
  seurat_obj <- NormalizeData(seurat_obj)
  seurat_obj <- FindVariableFeatures(seurat_obj, selection.method = "vst", nfeatures = 2000)
  
  # 5. 降维聚类
  seurat_obj <- ScaleData(seurat_obj)
  seurat_obj <- RunPCA(seurat_obj, features = VariableFeatures(object = seurat_obj))
  seurat_obj <- FindNeighbors(seurat_obj, dims = 1:params$cluster$dims)
  seurat_obj <- FindClusters(seurat_obj, resolution = params$cluster$resolution)
  seurat_obj <- RunUMAP(seurat_obj, dims = 1:params$cluster$dims)
  
  # 6. 标记基因
  markers <- FindAllMarkers(seurat_obj, only.pos = TRUE, min.pct = params$markers$min_pct)
  
  # 7. 可视化
  DimPlot(seurat_obj, reduction = "umap")
  FeaturePlot(seurat_obj, features = head(markers$gene, 6))
  
  # 8. 保存结果
  return(list(object = seurat_obj, markers = markers))
}
```

### 前端参数映射
- React state → JSON → Python API → R script参数

## 时间预估

| 模块 | 开发时间 | 测试时间 |
|------|----------|----------|
| 单细胞完整版 | 2-3天 | 1天 |
| ChIP-seq完整版 | 2-3天 | 1天 |
| CUT&RUN/TAG | 1-2天 | 0.5天 |
| 代谢组 | 1-2天 | 0.5天 |
| 多组学整合 | 3-5天 | 2天 |
| **总计** | **9-15天** | **5天** |
