import { Modal } from 'antd';
import { useState } from 'react';
import * as Icons from '@ant-design/icons';

interface Props {
  visible: boolean;
  sql: string;
  lang?: string;
  onClose: () => void;
}

export default function SqlPreviewModal({
  visible,
  sql,
  lang,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);

  const titleLang = (lang || 'SQL').toUpperCase();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden

      // ✅ IMPORTANT: we control header layout
      title={<span>{titleLang}</span>}

      /** ✅ KEEP CLOSE BUTTON DEFAULT */
      closeIcon={<Icons.CloseOutlined />}
    >
      {/* ✅ COPY ICON injected EXACTLY like modal close */}
      
        <button
        title={copied ? 'Copied!' : 'Copy SQL'}
        type="button"
        onClick={handleCopy}
        className="ant-modal-close sql-copy-icon"
        style={{
            right: 48,
        }}
        >
        <span className="ant-modal-close-x">
            {copied ? <Icons.CheckOutlined /> : <Icons.CopyOutlined />}
        </span>
        </button>




      {/* ✅ SQL container */}
      <div
        style={{
          border: '1px solid var(--ant-border-color, #f0f0f0)',
          borderRadius: 6,
          padding: 12,

          height: 400,
          overflowY: 'auto',
          overflowX: 'hidden',

        }}
      >
        <pre
          style={{
            margin: 0,
            overflowX: 'auto',
            overflowY: 'visible',
            fontFamily:
              'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: 13,
            lineHeight: 1.6,
            
            whiteSpace: 'pre',
            wordBreak: 'break-word',

          }}
        >
          {sql}
        </pre>
      </div>
    </Modal>
  );
}