#!/usr/bin/env Rscript
# EasyMultiProfiler - 微生物组分析脚本
# 使用 EasyMultiProfiler 包进行微生物组数据分析

suppressPackageStartupMessages({
  library(optparse)
  library(jsonlite)
})

# 命令行参数
option_list <- list(
  make_option(c("-i", "--input"), type="character", default=NULL, help="OTU/ASV表路径"),
  make_option(c("-m", "--metadata"), type="character", default=NULL, help="样本元数据路径"),
  make_option(c("-o", "--output"), type="character", default=NULL, help="输出目录"),
  make_option(c("-p", "--params"), type="character", default="{}", help="分析参数"),
  make_option(c("-t", "--task-id"), type="character", default=NULL, help="任务ID")
)

parser <- OptionParser(option_list=option_list)
args <- parse_args(parser)

# 解析参数
params <- fromJSON(args$params)

# 检查 EasyMultiProfiler 是否安装
if (!requireNamespace("EasyMultiProfiler", quietly=TRUE)) {
  cat("警告: EasyMultiProfiler 包未安装，将使用基础分析流程\n")
  # 调用通用脚本
  args$module <- "microbiome"
  source(file.path(dirname(getScriptPath()), "generic_analysis.R"))
  quit(status=0)
}

library(EasyMultiProfiler)

cat(sprintf("开始微生物组分析 - 任务ID: %s\n", args$task_id))

try {
  # 读取数据
  otu_table <- read.csv(args$input, row.names=1, check.names=FALSE)
  cat(sprintf("OTU表维度: %d OTUs x %d 样本\n", nrow(otu_table), ncol(otu_table)))
  
  # 创建 EMP 对象
  # emp_obj <- create_EMP_object(otu_table, ...)
  
  # Alpha 多样性
  alpha_metric <- params$alpha$metric %||% "shannon"
  cat(sprintf("计算 %s 多样性...\n", alpha_metric))
  # alpha_results <- calculate_alpha_diversity(emp_obj, metric=alpha_metric)
  
  # Beta 多样性
  beta_method <- params$beta$method %||% "bray"
  cat(sprintf("计算 %s 距离...\n", beta_method))
  # beta_results <- calculate_beta_diversity(emp_obj, method=beta_method)
  
  # 生成图表
  output_dir <- args$output
  
  pdf(file.path(output_dir, "microbiome_analysis.pdf"), width=12, height=10)
  
  # 设置布局
  par(mfrow=c(2,3))
  
  # 1. Alpha 多样性箱线图
  alpha_values <- diversity(t(otu_table), index=alpha_metric)
  boxplot(alpha_values, main=paste(alpha_metric, "Diversity"), ylab=alpha_metric)
  
  # 2. 稀疏曲线
  reads <- colSums(otu_table)
  plot(sort(reads, decreasing=TRUE), type="l", main="Rank Abundance", xlab="Rank", ylab="Abundance")
  
  # 3. 样品reads分布
  hist(reads, breaks=30, main="Sample Reads Distribution", xlab="Total Reads")
  
  # 4. Beta 多样性 PCoA
  if (ncol(otu_table) > 2) {
    require(vegan)
    dist_matrix <- vegdist(t(otu_table), method=beta_method)
    pcoa <- cmdscale(dist_matrix, k=2, eig=TRUE)
    plot(pcoa$points, main=paste("PCoA (", beta_method, ")"), 
         xlab="PC1", ylab="PC2", pch=19, col="steelblue")
  }
  
  # 5. Top 10 OTU 丰度
  top10 <- names(sort(rowSums(otu_table), decreasing=TRUE))[1:10]
  barplot(rowSums(otu_table)[top10], las=2, cex.names=0.7, main="Top 10 OTUs")
  
  # 6. 物种累积曲线
  if (ncol(otu_table) > 5) {
    spec_accum <- specaccum(t(otu_table > 0))
    plot(spec_accum, main="Species Accumulation Curve")
  }
  
  dev.off()
  
  # 保存 PNG 版本
  png(file.path(output_dir, "alpha_diversity.png"), width=600, height=400)
  boxplot(alpha_values, main=paste(alpha_metric, "Diversity"), ylab=alpha_metric, col="lightblue")
  dev.off()
  
  png(file.path(output_dir, "beta_pcoa.png"), width=600, height=400)
  if (ncol(otu_table) > 2) {
    plot(pcoa$points, main=paste("PCoA (", beta_method, ")"), 
         xlab="PC1", ylab="PC2", pch=19, col="steelblue")
  }
  dev.off()
  
  # 保存统计结果
  stats <- list(
    module = "microbiome",
    samples = ncol(otu_table),
    otus = nrow(otu_table),
    total_reads = sum(otu_table),
    alpha_metric = alpha_metric,
    beta_method = beta_method,
    mean_alpha = mean(alpha_values),
    task_id = args$task_id
  )
  write_json(stats, file.path(output_dir, "stats.json"))
  
  # 保存 Alpha 多样性表
  alpha_df <- data.frame(
    Sample = names(alpha_values),
    Alpha_Diversity = alpha_values
  )
  write.csv(alpha_df, file.path(output_dir, "alpha_diversity.csv"), row.names=FALSE)
  
  cat("微生物组分析完成！\n")
  
} catch (e) {
  cat(sprintf("错误: %s\n", e$message))
  writeLines(as.character(e), file.path(args$output, "error.log"))
  quit(status=1)
}

# 辅助函数
`%||%` <- function(x, y) if (is.null(x)) y else x

getScriptPath <- function() {
  cmd_args <- commandArgs(trailingOnly=FALSE)
  needle <- "--file="
  match <- grep(needle, cmd_args)
  if (length(match) > 0) {
    return(normalizePath(sub(needle, "", cmd_args[match])))
  }
  return(normalizePath(sys.frames()[[1]]$ofile))
}
