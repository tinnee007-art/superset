import React, { useEffect, useRef } from 'react';
import {
  InputArea,
  ChatInput,
  SendButton,
  AttachmentButton,
} from './styles';
import { SendOutlined, PlusOutlined } from '@ant-design/icons';

interface Props {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void;
  isStandalone?: boolean;

  attachmentEnabled: boolean;
  files: any[];
  setFiles: React.Dispatch<React.SetStateAction<any[]>>;
  setWarning: (msg: string | null) => void;
}

export default function ChatInputBar({
  value,
  setValue,
  onSend,
  isStandalone,
  attachmentEnabled,
  files,
  setFiles,
  setWarning,
}: Props) {
  const MAX_FILES = 1;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // 🔍 REF FOR DYNAMIC TEXTAREA MEASUREMENT
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);


  useEffect(() => {
    return () => {
        files.forEach(f => {
        if (f.previewUrl) {
            URL.revokeObjectURL(f.previewUrl);
        }
        });
    };
  }, [files]);


  // 🚀 GROW AND SHRINK LOGIC (CAPS AT 4 LINES)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to calculate accurate scrollHeight on deletions/backspaces
      textarea.style.height = 'auto';
      // Set height matching the internal layout depth
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();   // Prevent layout newline jump
      onSend();             // Trigger message send
    }
  };

  const canSend = value.trim().length > 0 || files.length > 0;

  return (
    /* ✅ INJECTED flex-end ALIGNMENT TO SECURE BUTTONS AT THE BOTTOM BASELINE */
    <InputArea style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
      {attachmentEnabled && (
        <>
          <AttachmentButton 
            onClick={() => fileInputRef.current?.click()}
            style={{ marginBottom: '6px' }} // Keeps button perfectly spaced from the bottom edge
          >
            <PlusOutlined />
          </AttachmentButton>

          <input
            type="file"
            multiple
            hidden
            ref={fileInputRef}
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={e => {
              const selectedFiles = Array.from(e.target.files || []);
              if (!selectedFiles.length) return;

              setFiles(prev => {
                const remainingSlots = MAX_FILES - prev.length;

                if (remainingSlots <= 0) {
                  setWarning(`Maximum ${MAX_FILES} files allowed`);
                  return prev;
                }

                let filesToAdd = selectedFiles;

                if (selectedFiles.length > remainingSlots) {
                  filesToAdd = selectedFiles.slice(0, remainingSlots);
                  setWarning(`Only ${MAX_FILES} files allowed. Extra files ignored.`);
                }

                const mapped = filesToAdd.map(file => ({
                  id: `${file.name}-${Date.now()}`,
                  file,
                  previewUrl: URL.createObjectURL(file),
                }));

                setTimeout(() => setWarning(null), 2000);

                return [...prev, ...mapped];
              });

              e.target.value = '';
              textareaRef.current?.focus();
            }}
          />
        </>
      )}

      <ChatInput
        ref={textareaRef}
        as="textarea"
        rows={1}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        isStandalone={isStandalone}
        /* ✅ INLINE STYLE RESTRAINTS FOR INTERNALS */
        style={{
          resize: 'none',
          maxHeight: '105px', // Caps expansion perfectly at 4 lines
          overflowY: 'auto',   // Displays native trackpad scrollbar after line 4
          paddingTop: '10px',
          paddingBottom: '10px',
          lineHeight: '20px',
        }}
      />

      <SendButton
        onClick={canSend ? onSend : undefined}
        isDisabled={!canSend}
        style={{ marginBottom: '6px' }} // Keeps button perfectly spaced from the bottom edge
      >
        <SendOutlined />
      </SendButton>
    </InputArea>
  );
}