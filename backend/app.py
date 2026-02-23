# EasyMultiProfiler Web 后端

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 数据目录
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'EasyMultiProfiler'})

@app.route('/api/modules', methods=['GET'])
def get_modules():
    """获取可用分析模块"""
    modules = [
        {
            'id': 'microbiome',
            'name': '微生物组分析',
            'icon': '🦠',
            'features': ['α多样性', 'β多样性', '网络分析', '差异分析'],
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
            'id': 'scrna',
            'name': '单细胞RNA-seq',
            'icon': '🧫',
            'features': ['聚类', '标记基因', '轨迹分析', '细胞注释'],
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
            'id': 'integration',
            'name': '多组学整合',
            'icon': '🔗',
            'features': ['相关性分析', '网络整合', '联合可视化'],
            'status': 'ready'
        }
    ]
    return jsonify({'success': True, 'modules': modules})

@app.route('/api/analyze/<module>', methods=['POST'])
def analyze(module):
    """执行分析"""
    data = request.json
    
    # 模拟分析结果
    result = {
        'success': True,
        'module': module,
        'timestamp': datetime.now().isoformat(),
        'message': f'{module} 分析完成',
        'results': {
            'plots': [],
            'tables': [],
            'stats': {}
        }
    }
    
    return jsonify(result)

@app.route('/api/demo-data', methods=['GET'])
def get_demo_data():
    """获取示例数据"""
    demo_files = {
        'microbiome': {
            'otu_table': 'data/demo/otu_table.tsv',
            'metadata': 'data/demo/metadata.tsv'
        }
    }
    return jsonify({'success': True, 'files': demo_files})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
