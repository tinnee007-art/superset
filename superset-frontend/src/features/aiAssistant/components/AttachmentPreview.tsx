/**
 * AttachmentPreview
 *
 * Renders a list of file attachments with optional image previews,
 * file metadata (name, size), type-based icons, and remove support.
 *
 * Features:
 * - Image preview or fallback icon (PDF/image/file)
 * - Shows file name and size (KB)
 * - Displays file errors if present
 * - Optional remove button per file
 *
 * Props:
 * - files: list of attachments to display
 * - removeFile: callback to remove file by id
 * - showRemove: toggles remove button
 */
export interface AttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  error?: string;
}
interface AttachmentPreviewProps {
  files: AttachmentMeta[];
  removeFile?: (id: string) => void;
  showRemove?: boolean;
}
export default function AttachmentPreview({
  files,
  removeFile,
  showRemove = false,
}: AttachmentPreviewProps) {
  if (!files || files.length === 0) {
    return null;
  }
  const getIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📁';
  };
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 8,
        padding: 6,
      }}
    >
      {files.map(f => (
        <div
          key={f.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'var(--ant-color-bg-elevated)',
            border: '1px solid var(--ant-color-border)',
            fontSize: 12,
            maxWidth: 220,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                border: '1px solid var(--ant-color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f1f5f9',
                flexShrink: 0,
              }}
            >
              {f.previewUrl ? (
                <img
                  src={f.previewUrl}
                  alt={f.name}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                />
              ) : (
                <div style={{ fontSize: 20 }}>{getIcon(f.type)}</div>
              )}
            </div>
            <div
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 100,
              }}
            >
              {f.name}
            </div>
            
            {f.error && (
              <div style={{ color: 'var(--ant-color-error)', fontSize: 10, marginTop: 2, whiteSpace: 'pre-line' }}>
                {f.error}
              </div>
            )}
          </div>
          <div style={{ opacity: 0.6 }}>{(f.size / 1024).toFixed(1)} KB</div>
          {showRemove && removeFile && (
            <button
              onClick={() => removeFile(f.id)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                padding: '4px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}