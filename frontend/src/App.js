import React, { useState } from 'react';
import { Layout, Menu, Typography, Card, Row, Col, Steps, message } from 'antd';
import { 
  UploadOutlined, 
  ExperimentOutlined, 
  BarChartOutlined,
  DatabaseOutlined,
  SettingOutlined
} from '@ant-design/icons';
import DataUpload from './components/DataUpload';
import ModuleSelector from './components/ModuleSelector';
import AnalysisPanel from './components/AnalysisPanel';
import ResultsViewer from './components/ResultsViewer';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const STEPS = [
  { title: '上传数据', icon: <UploadOutlined /> },
  { title: '选择模块', icon: <DatabaseOutlined /> },
  { title: '配置分析', icon: <SettingOutlined /> },
  { title: '查看结果', icon: <BarChartOutlined /> }
];

const MODULES = [
  { id: 'microbiome', name: '微生物组分析', icon: '🦠', features: ['α多样性', 'β多样性', '网络分析', '差异分析'] },
  { id: 'chipseq', name: 'ChIP-seq分析', icon: '🧬', features: ['Peak calling', 'Motif分析', '注释', '差异Peak'] },
  { id: 'cutntag', name: 'CUT&Tag分析', icon: '✂️', features: ['Peak检测', '富集分析', '可视化'] },
  { id: 'cutnrun', name: 'CUT&RUN分析', icon: '🔬', features: ['Peak calling', 'QC报告', '注释'] },
  { id: 'scrna', name: '单细胞RNA-seq', icon: '🧫', features: ['聚类', '标记基因', '轨迹分析', '细胞注释'] },
  { id: 'metabolome', name: '代谢组分析', icon: '⚗️', features: ['通路分析', '差异代谢物', '富集分析'] },
  { id: 'integration', name: '多组学整合', icon: '🔗', features: ['相关性分析', '网络整合', '联合可视化'] }
];

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedData, setUploadedData] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [analysisParams, setAnalysisParams] = useState({});
  const [analysisResults, setAnalysisResults] = useState(null);
  const [taskId, setTaskId] = useState(null);

  const handleDataUpload = (data) => {
    setUploadedData(data);
    setCurrentStep(1);
    message.success('数据上传成功！');
  };

  const handleModuleSelect = (moduleId) => {
    setSelectedModule(moduleId);
    setCurrentStep(2);
  };

  const handleAnalysisSubmit = async (params) => {
    setAnalysisParams(params);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: uploadedData.file_id,
          module: selectedModule,
          params: params
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setTaskId(result.task_id);
        setCurrentStep(3);
        message.success('分析任务已提交，请等待结果...');
        
        // 开始轮询结果
        pollResults(result.task_id);
      } else {
        message.error('分析提交失败: ' + result.message);
      }
    } catch (error) {
      message.error('网络错误: ' + error.message);
    }
  };

  const pollResults = async (tid) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/status/${tid}`);
        const status = await response.json();
        
        if (status.status === 'completed') {
          const resultResponse = await fetch(`/api/results/${tid}`);
          const results = await resultResponse.json();
          setAnalysisResults(results);
          message.success('分析完成！');
          return true;
        } else if (status.status === 'failed') {
          message.error('分析失败: ' + status.message);
          return true;
        }
        return false;
      } catch (error) {
        console.error('轮询错误:', error);
        return false;
      }
    };

    const interval = setInterval(async () => {
      const done = await checkStatus();
      if (done) clearInterval(interval);
    }, 2000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <DataUpload onUpload={handleDataUpload} />;
      case 1:
        return (
          <ModuleSelector 
            modules={MODULES} 
            onSelect={handleModuleSelect}
            uploadedData={uploadedData}
          />
        );
      case 2:
        return (
          <AnalysisPanel 
            module={MODULES.find(m => m.id === selectedModule)}
            uploadedData={uploadedData}
            onSubmit={handleAnalysisSubmit}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <ResultsViewer 
            results={analysisResults}
            taskId={taskId}
            onNewAnalysis={() => {
              setCurrentStep(0);
              setUploadedData(null);
              setSelectedModule(null);
              setAnalysisResults(null);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <ExperimentOutlined style={{ fontSize: 28, color: '#1890ff', marginRight: 12 }} />
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            EasyMultiProfiler
          </Title>
          <span style={{ color: 'rgba(255,255,255,0.65)', marginLeft: 12 }}>
            多组学数据分析平台
          </span>
        </div>
      </Header>
      
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Card style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Steps current={currentStep} items={STEPS} style={{ marginBottom: 32 }} />
          {renderStepContent()}
        </Card>
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        EasyMultiProfiler Web v2.0 ©2025 XieLab | Science China Life Sciences
      </Footer>
    </Layout>
  );
}

export default App;
