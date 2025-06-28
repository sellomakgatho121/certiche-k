'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, FileText, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    if (file) {
      const fileType = file.type;
      setIsImage(fileType.startsWith('image/'));
      
      if (fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file, preview]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="relative mt-4 border-2 border-dashed border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {isImage && preview ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                <Image
                  src={preview}
                  alt="File preview"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted">
                {file.type === 'application/pdf' ? (
                  <FileText className="h-8 w-8 text-red-500" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} • {file.type || 'Unknown type'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last modified: {new Date(file.lastModified).toLocaleDateString()}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}