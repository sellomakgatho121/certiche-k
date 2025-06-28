'use client';

import type React from 'react';
import { useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileUp, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import FilePreview from './file-preview';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  acceptedFileTypes?: string;
  id?: string;
  maxSize?: number; // in MB
  className?: string;
}

export default function FileUploader({ 
  onFileSelect, 
  acceptedFileTypes = "image/*,.pdf,.doc,.docx,.txt", 
  id = "file-upload",
  maxSize = 10,
  className
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const acceptedTypes = acceptedFileTypes.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return 'File type not supported';
    }

    return null;
  };

  const handleFileChange = useCallback((file: File | null) => {
    setError(null);
    
    if (!file) {
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect, maxSize, acceptedFileTypes]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileChange(file);
  }, [handleFileChange]);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  }, [handleFileChange]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Input
        ref={fileInputRef}
        id={id}
        type="file"
        onChange={handleInputChange}
        accept={acceptedFileTypes}
        className="hidden"
      />
      
      {!selectedFile && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
            error && "border-destructive bg-destructive/5"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "rounded-full p-4",
              error ? "bg-destructive/10" : "bg-primary/10"
            )}>
              {error ? (
                <AlertCircle className="h-8 w-8 text-destructive" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {error ? "File Upload Error" : "Drop your document here"}
              </p>
              <p className="text-sm text-muted-foreground">
                {error ? error : `or click to browse (max ${maxSize}MB)`}
              </p>
            </div>
            
            <Button variant="outline" size="sm" type="button">
              <FileUp className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </div>
        </div>
      )}

      {selectedFile && (
        <FilePreview file={selectedFile} onRemove={handleClearFile} />
      )}

      {error && !selectedFile && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}