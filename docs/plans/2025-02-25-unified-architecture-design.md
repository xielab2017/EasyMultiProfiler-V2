# EasyMultiProfiler 统一架构设计
## R包与Web完全同步方案

## 架构目标

```
┌─────────────────────────────────────────────────────────────┐
│                    统一分析流程                              │
├─────────────────────────────────────────────────────────────┤
│  用户输入 → 参数标准化 → R包执行 → 结果输出                 │
│                ↓                    ↓                       │
│           R控制台用户            Web用户                     │
└─────────────────────────────────────────────────────────────┘
```

## 核心原则

1. **单一数据源**: R包是分析核心，Web是界面封装
2. **参数标准化**: 所有参数在R包中定义，Web透传
3. **结果统一**: R包和Web输出相同的文件格式
4. **版本同步**: R包更新 → Web自动适配

---

## 模块对应关系

| 模块ID | R包函数 | Web前端 | 状态 |
|--------|---------|---------|------|
| `rnaseq` | `EMP_rnaseq_analysis()` | RNA-seq分析 | ✅ 待实现 |
| `proteomics` | `EMP_proteomics_analysis()` | 蛋白质组学 | ✅ 待实现 |
| `scrna` | `EMP_scrnaseq_analysis()` | 单细胞RNA-seq | ✅ Web已实现，R包待封装 |
| `microbiome` | `EMP_microbiome_analysis()` | 微生物组 | ✅ 已有 |
| `chipseq` | `EMP_chipseq_analysis()` | ChIP-seq | ✅ Web已实现，R包待封装 |
| `cutntag` | `EMP_cutntag_analysis()` | CUT&Tag | ✅ Web已实现，R包待封装 |
| `cutnrun` | `EMP_cutnrun_analysis()` | CUT&RUN | ✅ Web已实现，R包待封装 |
| `metabolome` | `EMP_metabolome_analysis()` | 代谢组 | ⚠️ 待实现 |
| `integration` | `EMP_multiomics_integration()` | 多组学整合 | ⚠️ 待实现 |

---

## R包接口设计

### 1. 单细胞RNA-seq接口

```r
#' 单细胞RNA-seq分析主函数
#' @param counts 基因表达矩阵 (行为基因，列为细胞)
#' @param metadata 细胞元数据 (data.frame)
#' @param params 分析参数列表
#' @return EMPT对象包含分析结果
EMP_scrnaseq_analysis <- function(
    counts,
    metadata = NULL,
    params = list(
        qc = list(min_genes = 200, max_mt_percent = 5),
        normalization = list(method = "LogNormalize"),
        dim_reduction = list(pca_dims = 30, umap = TRUE),
        clustering = list(resolution = 0.8),
        markers = list(min_pct = 0.25, logfc = 0.25),
        annotation = list(enable = TRUE, reference = "HumanPrimaryCellAtlas")
    ),
    output_dir = NULL
) {
    # 依赖检查
    .check_seurat()
    
    # Step 1: 创建对象
    seurat_obj <- CreateSeuratObject(counts = counts, meta.data = metadata)
    
    # Step 2: QC
    seurat_obj <- .scrna_qc(seurat_obj, params$qc)
    
    # Step 3: 标准化
    seurat_obj <- .scrna_normalize(seurat_obj, params$normalization)
    
    # Step 4: 降维
    seurat_obj <- .scrna_dim_reduction(seurat_obj, params$dim_reduction)
    
    # Step 5: 聚类
    seurat_obj <- .scrna_cluster(seurat_obj, params$clustering)
    
    # Step 6: 标记基因
    markers <- FindAllMarkers(seurat_obj, ...)
    
    # Step 7: 细胞注释
    if (params$annotation$enable) {
        annotations <- .scrna_annotate(seurat_obj, params$annotation)
    }
    
    # Step 8: 保存结果
    if (!is.null(output_dir)) {
        .scrna_save_results(seurat_obj, markers, output_dir)
    }
    
    # 返回EMPT对象
    return(.create_scrna_empt(seurat_obj, markers))
}
```

### 2. ChIP-seq/CUT&Tag/RUN接口

```r
#' ChIP-seq分析主函数
#' @param peak_file Peak文件路径 (BED/narrowPeak)
#' @param metadata 样本信息
#' @param params 分析参数
EMP_chipseq_analysis <- function(
    peak_file,
    metadata = NULL,
    params = list(
        annotation = list(genome = "hg38", tss_region = c(-3000, 3000)),
        enrichment = list(go = TRUE, kegg = TRUE),
        motif = list(enable = FALSE),
        visualization = list(coverage = TRUE, annotation = TRUE)
    ),
    output_dir = NULL
) {
    # 依赖检查
    .check_chipseeker()
    
    # Step 1: 读取Peaks
    peaks <- readPeakFile(peak_file)
    
    # Step 2: Peak注释
    peak_anno <- annotatePeak(peaks, ...)
    
    # Step 3: 富集分析
    if (params$enrichment$go) {
        go_result <- .chipseq_go_enrich(peak_anno)
    }
    
    # Step 4: 可视化
    if (params$visualization$coverage) {
        .chipseq_plot_coverage(peaks, output_dir)
    }
    
    # Step 5: 保存结果
    if (!is.null(output_dir)) {
        .chipseq_save_results(peak_anno, output_dir)
    }
    
    return(.create_chipseq_empt(peak_anno))
}

#' CUT&Tag分析 (复用ChIP-seq流程，添加特定QC)
EMP_cutntag_analysis <- function(...) {
    result <- EMP_chipseq_analysis(...)
    # 添加CUT&Tag特定分析
    result$qc$promoter_ratio <- .calc_promoter_ratio(result$peaks)
    return(result)
}

#' CUT&RUN分析
EMP_cutnrun_analysis <- function(...) {
    result <- EMP_chipseq_analysis(...)
    # 添加CUT&RUN特定分析
    return(result)
}
```

### 3. 多组学整合接口

```r
#' 多组学整合分析
#' @param data_list 多组学数据列表
#' @param integration_method 整合方法: "MOFA2", "iCluster", "mixOmics"
#' @param params 整合参数
EMP_multiomics_integration <- function(
    data_list = list(
        rnaseq = NULL,
        chipseq = NULL,
        scrna = NULL,
        metabolome = NULL,
        microbiome = NULL
    ),
    integration_method = "MOFA2",
    params = list(
        factors = 10,
        convergence = "slow",
        scale = TRUE
    ),
    output_dir = NULL
) {
    # 检查至少两个组学
    if (sum(!sapply(data_list, is.null)) < 2) {
        stop("至少需要两组学数据进行整合")
    }
    
    # 样本对齐
    aligned_data <- .align_samples(data_list)
    
    # 根据方法选择整合方式
    switch(integration_method,
        "MOFA2" = {
            result <- .run_mofa2(aligned_data, params)
        },
        "iCluster" = {
            result <- .run_icluster(aligned_data, params)
        },
        "mixOmics" = {
            result <- .run_mixomics(aligned_data, params)
        },
        stop("Unsupported integration method")
    )
    
    # 保存结果
    if (!is.null(output_dir)) {
        .integration_save_results(result, output_dir)
    }
    
    return(result)
}

#' 特定组学组合的快捷函数
EMP_integrate_chipseq_rnaseq <- function(chipseq_data, rnaseq_data, ...) {
    EMP_multiomics_integration(
        data_list = list(chipseq = chipseq_data, rnaseq = rnaseq_data),
        ...
    )
}

EMP_integrate_scrna_rnaseq <- function(scrna_data, rnaseq_data, ...) {
    EMP_multiomics_integration(
        data_list = list(scrna = scrna_data, rnaseq = rnaseq_data),
        ...
    )
}

EMP_integrate_host_microbiome <- function(host_data, microbiome_data, ...) {
    EMP_multiomics_integration(
        data_list = list(rnaseq = host_data, microbiome = microbiome_data),
        ...
    )
}
```

---

## Web调用架构

### Python后端适配

```python
# app.py 中的 run_analysis 函数
def run_analysis(task_id, file_id, module, params, result_dir):
    task = tasks[task_id]
    
    # 统一调用方式：所有模块都调用EMP_xxx_analysis函数
    r_script = os.path.join(R_SCRIPTS_DIR, 'emp_wrapper.R')
    
    # 构建命令
    cmd = [
        'Rscript', r_script,
        '--function', f'EMP_{module}_analysis',  # EMP_scrnaseq_analysis 等
        '--input', data_file,
        '--output', result_dir,
        '--params', json.dumps(params),
        '--task-id', task_id
    ]
    
    # 执行
    subprocess.run(cmd, ...)
```

### R包装器脚本

```r
# emp_wrapper.R - 统一的R包调用入口

library(optparse)
library(jsonlite)

option_list <- list(
    make_option(c("-f", "--function"), type="character"),
    make_option(c("-i", "--input")),
    make_option(c("-o", "--output")),
    make_option(c("-p", "--params"))
)

args <- parse_args(OptionParser(option_list=option_list))
params <- fromJSON(args$params)

# 加载EasyMultiProfiler
library(EasyMultiProfiler)

# 根据函数名调用对应分析
switch(args$function,
    "EMP_scrnaseq_analysis" = {
        # 读取数据
        counts <- read.csv(args$input, row.names=1)
        # 调用R包函数
        result <- EMP_scrnaseq_analysis(
            counts = counts,
            params = params,
            output_dir = args$output
        )
    },
    "EMP_chipseq_analysis" = {
        result <- EMP_chipseq_analysis(
            peak_file = args$input,
            params = params,
            output_dir = args$output
        )
    },
    # ... 其他模块
    stop("Unknown function: ", args$function)
)
```

---

## 参数标准化

### 全局参数结构

```json
{
  "module": "scrna",
  "version": "2.0.0",
  "params": {
    "qc": {
      "min_genes": 200,
      "max_mt_percent": 5
    },
    "normalization": {
      "method": "LogNormalize"
    },
    "clustering": {
      "resolution": 0.8
    }
  },
  "output": {
    "format": ["png", "pdf", "csv"],
    "dpi": 300
  }
}
```

### 各模块特有参数

| 模块 | 特有参数 |
|------|----------|
| scrna | `annotation.reference`, `clustering.algorithm` |
| chipseq | `annotation.genome`, `enrichment.databases` |
| integration | `method`, `factors`, `sample.overlap` |

---

## 输出标准化

### 统一输出结构

```
result_dir/
├── stats.json              # 统计信息 (统一格式)
├── plots/                  # 图表
│   ├── main_figure.png
│   └── supplementary/
├── tables/                 # 数据表
│   ├── differential.csv
│   └── enrichment.csv
├── report.html            # HTML报告
└── session_info.R         # R环境信息
```

### stats.json 统一格式

```json
{
  "module": "scrna",
  "version": "2.0.0",
  "samples": 1000,
  "features": 20000,
  "results": {
    "n_clusters": 8,
    "n_markers": 150
  },
  "parameters": {...},
  "timestamp": "2025-02-25T12:00:00Z"
}
```

---

## 实施路线图

### Phase 1: R包扩展 (5-7天)
1. 实现 `EMP_scrnaseq_analysis()`
2. 实现 `EMP_chipseq_analysis()`
3. 实现 `EMP_cutntag_analysis()` / `EMP_cutnrun_analysis()`
4. 实现 `EMP_multiomics_integration()`

### Phase 2: Web适配 (2-3天)
1. 创建统一的 `emp_wrapper.R`
2. 更新 Python 后端调用方式
3. 前端参数与R包对齐

### Phase 3: 测试验证 (3-5天)
1. R包独立测试
2. Web端到端测试
3. 结果一致性验证

---

## 关键设计决策

1. **R包作为唯一分析引擎** - Web只负责IO和展示
2. **统一的EMPT返回对象** - 方便后续操作和可视化
3. **模块化参数设计** - 每个模块有独立的参数空间
4. **向后兼容** - 现有RNA-seq/微生物组功能不受影响
