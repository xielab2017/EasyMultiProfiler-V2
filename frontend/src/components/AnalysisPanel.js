import React, { useState } from 'react';
import { 
  Card, Form, Select, Switch, Slider, Button, Space, 
  Typography, Divider, Alert, Radio, InputNumber, Row, Col 
} from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

function AnalysisPanel({ module, uploadedData, onSubmit, onBack }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const getModuleParams = () => {
    switch (module?.id) {
      case 'microbiome':
        return (
          <>
            <Divider orientation="left">α 多样性分析</Divider>
            <Form.Item name={['alpha', 'metric']} label="多样性指数" initialValue="shannon">
              <Select>
                <Option value="shannon">Shannon 指数</Option>
                <Option value="simpson">Simpson 指数</Option>
                <Option value="observed_otus">Observed OTUs</Option>
                <Option value="chao1">Chao1 指数</Option>
                <Option value="ace">ACE 指数</Option>
              </Select>
            </Form.Item>

            <Divider orientation="left">β 多样性分析</Divider>
            <Form.Item name={['beta', 'method']} label="距离计算方法" initialValue="bray">
              <Select>
                <Option value="bray">Bray-Curtis</Option>
                <Option value="jaccard">Jaccard</Option>
                <Option value="unweighted_unifrac">Unweighted UniFrac</Option>
                <Option value="weighted_unifrac">Weighted UniFrac</Option>
              </Select>
            </Form.Item>

            <Form.Item name={['beta', 'pcoa']} label="降维方法" initialValue="pcoa">
              <Radio.Group>
                <Radio.Button value="pcoa">PCoA</Radio.Button>
                <Radio.Button value="nmds">NMDS</Radio.Button>
                <Radio.Button value="tsne">t-SNE</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Divider orientation="left">差异分析</Divider>
            <Form.Item name={['diff', 'method']} label="统计检验方法" initialValue="wilcox">
              <Select>
                <Option value="wilcox">Wilcoxon 秩和检验</Option>
                <Option value="t_test">t 检验</Option>
                <Option value="deseq2">DESeq2</Option>
                <Option value="edgeR">edgeR</Option>
              </Select>
            </Form.Item>

            <Form.Item name={['diff', 'pvalue']} label="p值阈值" initialValue={0.05}>
              <Slider min={0.001} max={0.1} step={0.001} />
            </Form.Item>
          </>
        );

      case 'scrna':
        return (
          <>
            <Divider orientation="left">质量控制</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['qc', 'min_genes']} label="最小基因数" initialValue={200}>
                  <InputNumber min={50} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['qc', 'min_cells']} label="最小细胞数" initialValue={3}>
                  <InputNumber min={1} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">聚类分析</Divider>
            <Form.Item name={['cluster', 'resolution']} label="聚类分辨率" initialValue={0.8}>
              <Slider min={0.1} max={2} step={0.1} />
            </Form.Item>

            <Form.Item name={['cluster', 'dims']} label="PCA维度数" initialValue={30}>
              <InputNumber min={5} max={100} />
            </Form.Item>

            <Divider orientation="left">标记基因</Divider>
            <Form.Item name={['markers', 'min_pct']} label="最小表达比例" initialValue={0.25}>
              <Slider min={0.05} max={0.5} step={0.05} />
            </Form.Item>

            <Form.Item name={['markers', 'logfc']} label="最小logFC" initialValue={0.25}>
              <InputNumber min={0.1} max={1} step={0.05} />
            </Form.Item>
          </>
        );

      case 'chipseq':
      case 'cutntag':
      case 'cutnrun':
        return (
          <>
            <Divider orientation="left">Peak Calling</Divider>
            <Form.Item name={['peak', 'qvalue']} label="q值阈值" initialValue={0.05}>
              <Slider min={0.001} max={0.1} step={0.001} />
            </Form.Item>

            <Form.Item name={['peak', 'method']} label="Peak检测方法" initialValue="macs2">
              <Select>
                <Option value="macs2">MACS2</Option>
                <Option value="homer">HOMER</Option>
                <Option value="seacr">SEACR</Option>
              </Select>
            </Form.Item>

            <Divider orientation="left">Motif分析</Divider>
            <Form.Item name={['motif', 'enabled']} label="启用Motif分析" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>

            <Form.Item name={['motif', 'database']} label="Motif数据库" initialValue="jaspar">
              <Select>
                <Option value="jaspar">JASPAR</Option>
                <Option value="homer">HOMER</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'metabolome':
        return (
          <>
            <Divider orientation="left">通路分析</Divider>
            <Form.Item name={['pathway', 'database']} label="通路数据库" initialValue="kegg">
              <Select>
                <Option value="kegg">KEGG</Option>
                <Option value="reactome">Reactome</Option>
                <Option value="hmdb">HMDB</Option>
              </Select>
            </Form.Item>

            <Divider orientation="left">差异分析</Divider>
            <Form.Item name={['diff', 'method']} label="统计方法" initialValue="t_test">
              <Select>
                <Option value="t_test">t 检验</Option>
                <Option value="anova">ANOVA</Option>
                <Option value="limma">Limma</Option>
              </Select>
            </Form.Item>
          </>
        );

      default:
        return <Alert message="此模块的配置参数正在开发中" type="info" />;
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Title level={4}>⚙️ 配置 {module?.name} 参数</Title>
      
      <Card>
        <Form 
          form={form} 
          layout="vertical"
          initialValues={{
            output_format: 'pdf',
            figure_dpi: 300
          }}
        >
          {getModuleParams()}

          <Divider orientation="left">输出选项</Divider>
          
          <Form.Item name="output_format" label="报告格式">
            <Radio.Group>
              <Radio.Button value="pdf">PDF 报告</Radio.Button>
              <Radio.Button value="html">HTML 报告</Radio.Button>
              <Radio.Button value="both">两者都要</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="figure_dpi" label="图表分辨率 (DPI)">
            <Slider min={150} max={600} step={50} marks={{ 150: '150', 300: '300', 600: '600' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={onBack} icon={<ArrowLeftOutlined />}>
                返回
              </Button>
              <Button 
                type="primary" 
                size="large"
                onClick={handleSubmit}
                loading={submitting}
                icon={<PlayCircleOutlined />}
              >
                开始分析
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default AnalysisPanel;
