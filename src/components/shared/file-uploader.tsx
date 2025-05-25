'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileUp, XCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  acceptedFileTypes?: string; // e.g., "image/*,.pdf"
  id?: string;
}

export default function FileUploader({ onFileSelect, acceptedFileTypes, id = "file-upload" }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setFileName(file ? file.name : '');
    onFileSelect(file);
  }, [onFileSelect]);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setFileName('');
    onFileSelect(null);
    // Reset the input field value
    const fileInput = document.getElementById(id) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [onFileSelect, id]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="file"
          onChange={handleFileChange}
          accept={acceptedFileTypes}
          className="hidden"
        />
        <Button variant="outline" onClick={() => document.getElementById(id)?.click()} className="flex-grow sm:flex-grow-0">
          <FileUp className="mr-2 h-4 w-4" />
          Choose File
        </Button>
        {selectedFile && (
          <Button variant="ghost" size="icon" onClick={handleClearFile} aria-label="Clear file">
            <XCircle className="h-5 w-5 text-destructive" />
          </Button>
        )}
      </div>
      {fileName && (
        <p className="text-sm text-muted-foreground truncate" title={fileName}>
          Selected: {fileName}
        </p>
      )}
    </div>
  );
}
