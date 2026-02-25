# EasyMultiProfiler Web Backend
# 多组学数据分析网页平台后端

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import json
import uuid
import shutil
import subprocess
import threading
import time
from datetime import datetime
import pandas as pd

app = Flask(__name__)
CORS(app)

# 配置
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'data', 'uploads')
RESULTS_FOLDER = os.path.join(os.path.dirname(__file__), 'data', 'results')
R_SCRIPTS_DIR = os.path.join(os.path.dirname(__file__), 'r_scripts')
ALLOWED_EXTENSIONS = {'csv', 'tsv', 'txt', 'xls', 'xlsx'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)
os.makedirs(R_SCRIPTS_DIR, exist_ok=True)

# 任务存储 (生产环境应使用 Redis 或数据库)
tasks = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ============ 健康检查 ============
@app.route('/api/health', methods=['GET'])
def health():
    """健康检查接口"""
    return jsonify({
        'status': 'ok', 
        'service': 'EasyMultiProfiler',
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat()
    })

# ============ 模块列表 ============
@app.route('/api/modules', methods=['GET'])
def get_modules():
    """获取可用分析模块"""
    modules = [
        {
            'id': 'rnaseq',
            'name': 'RNA-seq分析',
            'icon': '📊',
            'features': ['差异表达', '火山图', '热图', 'GO/KEGG富集', 'GSEA'],
            'status': 'ready'
        },
        {
            'id': 'proteomics',
            'name': '蛋白质组学',
            'icon': '🧪',
            'features': ['蛋白定量', '差异分析', '通路分析', 'PPI网络', '标志物筛选'],
            'status': 'ready'
        },
        {
            'id': 'scrna',
            'name': '单细胞RNA-seq',
            'icon': '🧫',
            'features': ['聚类', '标记基因', '轨迹分析', '细胞注释'],
            'status': 'ready'
        },
        {
            'id': 'microbiome',
            'name': '微生物组分析',
            'icon': '🦠',
            'features': ['α多样性', 'β多样性', '网络分析', '差异分析'],
            'status': 'ready'
        },
        {
            'id': 'metabolome',
            'name': '代谢组分析',
            'icon': '⚗️',
            'features': ['通路分析', '差异代谢物', '富集分析'],
            'status': 'ready'
        },
        {
            'id': 'chipseq',
            'name': 'ChIP-seq分析',
            'icon': '🧬',
            'features': ['Peak calling', 'Motif分析', '注释', '差异Peak'],
            'status': 'ready'
        },
        {
            'id': 'cutntag',
            'name': 'CUT&Tag分析',
            'icon': '✂️',
            'features': ['Peak检测', '富集分析', '可视化'],
            'status': 'ready'
        },
        {
            'id': 'cutnrun',
            'name': 'CUT&RUN分析',
            'icon': '🔬',
            'features': ['Peak calling', 'QC报告', '注释'],
            'status': 'ready'
        },
        {
            'id': 'integration',
            'name': '多组学整合',
            'icon': '🔗',
            'features': ['相关性分析', '网络整合', '联合可视化'],
            'status': 'beta'
        }
    ]
    return jsonify({'success': True, 'modules': modules})

# ============ 文件上传 ============
@app.route('/api/upload', methods=['POST'])
def upload_file():
    """上传数据文件"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '没有文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': '文件名不能为空'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'success': False, 
            'message': f'不支持的文件格式。请上传: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400
    
    # 检查文件大小
    file.seek(0, 2)  # 移动到文件末尾
    file_size = file.tell()
    file.seek(0)  # 回到文件开头
    
    if file_size > MAX_FILE_SIZE:
        return jsonify({
            'success': False, 
            'message': f'文件大小超过限制 ({MAX_FILE_SIZE / 1024 / 1024}MB)'
        }), 400
    
    # 生成唯一ID
    file_id = str(uuid.uuid4())
    filename = secure_filename(file.filename)
    file_ext = filename.rsplit('.', 1)[1].lower()
    
    # 保存文件
    upload_dir = os.path.join(UPLOAD_FOLDER, file_id)
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f'data.{file_ext}')
    file.save(file_path)
    
    try:
        # 读取数据获取基本信息
        if file_ext in ['xls', 'xlsx']:
            df = pd.read_excel(file_path)
        elif file_ext == 'csv':
            df = pd.read_csv(file_path)
        else:  # tsv, txt
            df = pd.read_csv(file_path, sep='\t')
        
        # 获取预览数据
        preview = df.head(10).to_dict('records')
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'filename': filename,
            'samples': len(df.columns),
            'features': len(df),
            'columns': list(df.columns),
            'preview': preview,
            'file_path': file_path
        })
        
    except Exception as e:
        # 清理上传的文件
        shutil.rmtree(upload_dir, ignore_errors=True)
        return jsonify({
            'success': False, 
            'message': f'文件解析失败: {str(e)}'
        }), 400

# ============ 执行分析 ============
@app.route('/api/analyze', methods=['POST'])
def analyze():
    """提交分析任务"""
    data = request.json
    
    if not data or 'file_id' not in data or 'module' not in data:
        return jsonify({
            'success': False, 
            'message': '缺少必要参数: file_id, module'
        }), 400
    
    file_id = data['file_id']
    module = data['module']
    params = data.get('params', {})
    
    # 检查文件是否存在
    upload_dir = os.path.join(UPLOAD_FOLDER, file_id)
    if not os.path.exists(upload_dir):
        return jsonify({
            'success': False, 
            'message': '文件不存在或已过期'
        }), 404
    
    # 生成任务ID
    task_id = str(uuid.uuid4())
    result_dir = os.path.join(RESULTS_FOLDER, task_id)
    os.makedirs(result_dir, exist_ok=True)
    
    # 保存任务信息
    tasks[task_id] = {
        'task_id': task_id,
        'file_id': file_id,
        'module': module,
        'params': params,
        'status': 'queued',
        'progress': 0,
        'message': '任务已提交，等待执行',
        'created_at': datetime.now().isoformat(),
        'result_dir': result_dir
    }
    
    # 异步执行分析
    thread = threading.Thread(target=run_analysis, args=(task_id, file_id, module, params, result_dir))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'success': True,
        'task_id': task_id,
        'status': 'queued',
        'message': '分析任务已提交'
    })

def run_analysis(task_id, file_id, module, params, result_dir):
    """在后台执行 R 分析"""
    task = tasks[task_id]
    upload_dir = os.path.join(UPLOAD_FOLDER, file_id)
    
    # 查找数据文件
    data_files = [f for f in os.listdir(upload_dir) if f.startswith('data.')]
    if not data_files:
        task['status'] = 'failed'
        task['message'] = '数据文件不存在'
        return
    
    data_file = os.path.join(upload_dir, data_files[0])
    
    # 更新状态
    task['status'] = 'running'
    task['progress'] = 10
    task['message'] = '正在初始化分析环境...'
    
    try:
        # 构建 R 脚本命令
        r_script = os.path.join(R_SCRIPTS_DIR, f'{module}_analysis.R')
        
        # 如果模块特定的脚本不存在，使用通用脚本
        if not os.path.exists(r_script):
            r_script = os.path.join(R_SCRIPTS_DIR, 'generic_analysis.R')
        
        # 准备参数
        params_json = json.dumps(params)
        
        # 构建命令
        cmd = [
            'Rscript', r_script,
            '--input', data_file,
            '--output', result_dir,
            '--module', module,
            '--params', params_json,
            '--task-id', task_id
        ]
        
        task['progress'] = 20
        task['message'] = '正在运行分析...'
        
        # 执行 R 脚本
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            task['status'] = 'failed'
            task['message'] = f'分析执行失败: {stderr}'
            task['log'] = stdout + '\n' + stderr
            return
        
        task['progress'] = 80
        task['message'] = '正在生成结果...'
        
        # 处理结果
        process_results(task, result_dir)
        
        task['status'] = 'completed'
        task['progress'] = 100
        task['message'] = '分析完成'
        task['log'] = stdout
        
    except Exception as e:
        task['status'] = 'failed'
        task['message'] = f'分析异常: {str(e)}'

def process_results(task, result_dir):
    """处理分析结果"""
    task['results'] = {
        'plots': [],
        'tables': [],
        'stats': {}
    }
    
    # 扫描结果目录
    if os.path.exists(result_dir):
        for filename in os.listdir(result_dir):
            filepath = os.path.join(result_dir, filename)
            
            # 图片文件
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.svg', '.pdf')):
                task['results']['plots'].append({
                    'title': os.path.splitext(filename)[0],
                    'url': f'/api/results/{task["task_id"]}/download/{filename}',
                    'download_url': f'/api/results/{task["task_id"]}/download/{filename}'
                })
            
            # 表格文件
            elif filename.lower().endswith(('.csv', '.tsv', '.xlsx')):
                try:
                    if filename.lower().endswith('.csv'):
                        df = pd.read_csv(filepath)
                    elif filename.lower().endswith('.tsv'):
                        df = pd.read_csv(filepath, sep='\t')
                    else:
                        df = pd.read_excel(filepath)
                    
                    task['results']['tables'].append({
                        'title': os.path.splitext(filename)[0],
                        'data': df.head(100).to_dict('records'),
                        'columns': list(df.columns),
                        'download_url': f'/api/results/{task["task_id"]}/download/{filename}'
                    })
                except:
                    pass
            
            # 统计文件
            elif filename == 'stats.json':
                try:
                    with open(filepath, 'r') as f:
                        task['results']['stats'] = json.load(f)
                except:
                    pass
            
            # 报告文件
            elif filename.lower().endswith(('.html', '.pdf')) and 'report' in filename.lower():
                task['results']['report_url'] = f'/api/results/{task["task_id"]}/download/{filename}'

# ============ 任务状态查询 ============
@app.route('/api/status/<task_id>', methods=['GET'])
def get_status(task_id):
    """获取任务状态"""
    if task_id not in tasks:
        return jsonify({
            'success': False,
            'message': '任务不存在'
        }), 404
    
    task = tasks[task_id]
    return jsonify({
        'success': True,
        'task_id': task_id,
        'status': task['status'],
        'progress': task['progress'],
        'message': task['message']
    })

# ============ 获取结果 ============
@app.route('/api/results/<task_id>', methods=['GET'])
def get_results(task_id):
    """获取分析结果"""
    if task_id not in tasks:
        return jsonify({
            'success': False,
            'message': '任务不存在'
        }), 404
    
    task = tasks[task_id]
    
    if task['status'] != 'completed':
        return jsonify({
            'success': False,
            'message': '分析尚未完成',
            'status': task['status'],
            'progress': task['progress']
        }), 400
    
    return jsonify({
        'success': True,
        'task_id': task_id,
        **task.get('results', {})
    })

# ============ 下载结果文件 ============
@app.route('/api/results/<task_id>/download/<filename>', methods=['GET'])
def download_result(task_id, filename):
    """下载结果文件"""
    if task_id not in tasks:
        return jsonify({'success': False, 'message': '任务不存在'}), 404
    
    result_dir = os.path.join(RESULTS_FOLDER, task_id)
    safe_filename = secure_filename(filename)
    
    try:
        return send_from_directory(result_dir, safe_filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({'success': False, 'message': '文件不存在'}), 404

# ============ 示例数据 ============
@app.route('/api/demo-data', methods=['GET'])
def get_demo_data():
    """获取示例数据列表"""
    demo_files = {
        'microbiome': {
            'otu_table': 'data/demo/otu_table.tsv',
            'metadata': 'data/demo/metadata.tsv'
        },
        'scrna': {
            'expression': 'data/demo/scrna_expression.csv'
        }
    }
    return jsonify({'success': True, 'files': demo_files})

# ============ 清理旧数据 ============
@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    """清理过期的上传文件和结果（管理员接口）"""
    # 这里应该添加认证检查
    max_age_days = 7
    
    def cleanup_dir(directory):
        count = 0
        now = time.time()
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)
            if os.path.isdir(item_path):
                mtime = os.path.getmtime(item_path)
                if (now - mtime) > (max_age_days * 24 * 3600):
                    shutil.rmtree(item_path)
                    count += 1
        return count
    
    upload_count = cleanup_dir(UPLOAD_FOLDER)
    result_count = cleanup_dir(RESULTS_FOLDER)
    
    return jsonify({
        'success': True,
        'message': f'清理完成: {upload_count} 个上传, {result_count} 个结果'
    })

# ============ 前端静态文件服务 ============
# 开发模式：前端独立运行在 3000 端口
# 生产模式：Flask 直接服务静态文件

STATIC_FOLDER = os.path.join(os.path.dirname(__file__), 'static')

# 静态文件路由 - 必须在通配符路由之前
@app.route('/static/<path:filename>')
def serve_static_files(filename):
    """服务静态文件 (JS, CSS, 图片等)"""
    if os.path.exists(STATIC_FOLDER):
        return send_from_directory(STATIC_FOLDER, filename)
    return jsonify({'success': False, 'message': '静态文件不存在'}), 404

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_index(path):
    """服务前端页面 (单页应用路由)"""
    # API 路由直接返回 404
    if path.startswith('api/'):
        return jsonify({'success': False, 'message': 'API 路由不存在'}), 404
    
    # 返回 index.html
    index_path = os.path.join(STATIC_FOLDER, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(STATIC_FOLDER, 'index.html')
    
    # 静态文件不存在，返回 API 状态
    return jsonify({
        'message': 'EasyMultiProfiler API 服务运行中',
        'status': 'ok',
        'note': '前端开发模式请访问 http://localhost:3000',
        'api_endpoints': [
            '/api/health',
            '/api/modules',
            '/api/upload',
            '/api/analyze'
        ]
    })

if __name__ == '__main__':
    # 生产环境建议关闭 debug 模式，避免 watchdog 热重载问题
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000, use_reloader=debug_mode)
