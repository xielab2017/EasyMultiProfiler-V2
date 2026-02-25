import React, { useState } from 'react';
import { Upload, Button, Table, Card, Alert, Space, Typography, Spin, Row, Col } from 'antd';
import { InboxOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const ALLOWED_TYPES = [
  'text/csv',
  'text/tab-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const ALLOWED_EXTENSIONS = ['.csv', '.tsv', '.txt', '.xls', '.xlsx'];

function DataUpload({ onUpload }) {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      setError('请先选择要上传的文件');
      return;
    }

    const file = fileList[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError(null);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult(result);
        setPreviewData(result.preview);
        onUpload(result);
      } else {
        setError(result.message || '上传失败');
      }
    } catch (err) {
      setError('上传错误: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const draggerProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      const isAllowedType = ALLOWED_TYPES.includes(file.type) || 
        ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isAllowedType) {
        setError(`${file.name} 不是支持的文件格式。请上传 CSV, TSV 或 Excel 文件。`);
        return Upload.LIST_IGNORE;
      }
      
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        setError('文件大小不能超过 50MB');
        return Upload.LIST_IGNORE;
      }

      setFileList([file]);
      setError(null);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setPreviewData(null);
      setUploadResult(null);
      setError(null);
    }
  };

  const renderPreviewTable = () => {
    if (!previewData || previewData.length === 0) return null;

    const columns = Object.keys(previewData[0]).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true,
      width: 150
    }));

    return (
      <Card title="数据预览 (前10行)" size="small" style={{ marginTop: 16 }}>
        <Table 
          dataSource={previewData.map((row, idx) => ({ ...row, key: idx }))}
          columns={columns}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </Card>
    );
  };

  return (
    <div>
      <Title level={4}>📤 上传您的数据</Title>
      <Text type="secondary">
        支持 CSV、TSV、Excel 格式。数据应包含样本ID和特征数据。
      </Text>

      {error && (
        <Alert 
          message={error} 
          type="error" 
          showIcon 
          style={{ marginTop: 16, marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Dragger {...draggerProps} style={{ marginTop: 16 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持 CSV、TSV、Excel 格式，文件大小不超过 50MB
        </p>
      </Dragger>

      {fileList.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={handleUpload}
            loading={uploading}
            icon={<FileExcelOutlined />}
          >
            {uploading ? '上传中...' : '上传数据'}
          </Button>
        </div>
      )}

      {uploading && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Spin size="large" />
          <p>正在处理数据，请稍候...⏳</p>
        </div>
      )}

      {uploadResult && (
        <Card style={{ marginTop: 16 }} title="📊 数据信息">
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small">
                <Text type="secondary">文件</Text>
                <br />
                <Text strong>{uploadResult.filename}</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Text type="secondary">样本数</Text>
                <br />
                <Text strong style={{ fontSize: 24, color: '#1890ff' }}>
                  {uploadResult.samples}
                </Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Text type="secondary">特征数</Text>
                <br />
                <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                  {uploadResult.features}
                </Text>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {renderPreviewTable()}

      <Card style={{ marginTop: 16 }} title="📖 数据格式说明">
        <Space direction="vertical">
          <Text><strong>微生物组数据:</strong> OTU/ASV表，行是特征，列是样本</Text>
          <Text><strong>ChIP-seq数据:</strong> Peak count矩阵或BAM文件列表</Text>
          <Text><strong>单细胞数据:</strong> 表达矩阵，行是基因，列是细胞</Text>
          <Text><strong>代谢组数据:</strong> 代谢物丰度表</Text>
        </Space>
      </Card>
    </div>
  );
}

export default DataUpload;
