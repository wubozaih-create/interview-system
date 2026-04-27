'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  label: string;
  hint?: string;
  selectedFile?: File | null;
}

type FileType = 'image' | 'pdf' | 'other';

function getFileType(file: File): FileType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.includes('pdf')) return 'pdf';
  return 'other';
}

export function FileUploader({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.md',
  label,
  hint = '支持 PDF、Word、图片、文本格式',
  selectedFile,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [internalSelectedFile, setInternalSelectedFile] = useState<File | null>(null);
  
  const displayFile = selectedFile !== undefined ? selectedFile : internalSelectedFile;
  const fileType = displayFile ? getFileType(displayFile) : null;
  
  const handleFileSelect = useCallback((file: File | null) => {
    if (selectedFile === undefined) {
      setInternalSelectedFile(file);
    }
    onFileSelect(file);
  }, [onFileSelect, selectedFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    handleFileSelect(null);
  }, [handleFileSelect]);

  if (displayFile) {
    return (
      <div className="relative rounded-xl border-2 border-[#10B981] bg-[#F0FDF4] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]">
            {fileType === 'image' ? (
              <Image className="h-5 w-5 text-white" />
            ) : fileType === 'pdf' ? (
              <FileText className="h-5 w-5 text-white" />
            ) : (
              <File className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1E293B] truncate">
              {displayFile.name}
            </p>
            <p className="text-xs text-[#64748B]">
              {(displayFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-[#64748B] hover:text-[#EF4444] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-all duration-200',
        isDragging
          ? 'border-[#3B82F6] bg-[#EFF6FF] scale-[1.02]'
          : 'border-[#E2E8F0] hover:border-[#3B82F6] hover:bg-[#F8FAFC]',
        'p-8'
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
            isDragging ? 'bg-[#3B82F6]' : 'bg-[#F1F5F9]'
          )}
        >
          <Upload
            className={cn(
              'h-6 w-6 transition-colors',
              isDragging ? 'text-white' : 'text-[#64748B]'
            )}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-[#1E293B]">{label}</p>
          <p className="text-xs text-[#64748B] mt-1">{hint}</p>
        </div>
      </div>
    </div>
  );
}
