'use client';

import { useState, FormEvent } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DocumentUploadFormProps {
  onUploadSuccess: () => void; // Callback to refresh document list, etc.
}

export default function DocumentUploadForm({ onUploadSuccess }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      // Basic validation for file type (can be more robust)
      const allowedTypes = ['text/plain', 'application/pdf', 'text/markdown'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Invalid File Type: Please upload a TXT, PDF, or Markdown file.');
        setFile(null);
        event.target.value = ''; // Reset file input
        return;
      }
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast.error('No File Selected: Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success(`${file.name} has been uploaded.`);
        setFile(null); // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        onUploadSuccess(); // Trigger refresh or other actions
      } else {
        const errorResult = await response.json().catch(() => ({ message: 'An error occurred during upload.' }));
        toast.error(`Upload Failed: ${errorResult.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload Error: An unexpected error occurred. Please try again.');
    }
    setIsUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          accept=".txt,.pdf,.md,text/plain,application/pdf,text/markdown"
          className="mt-1"
        />
        {file && <p className="text-sm text-muted-foreground mt-1">Selected: {file.name}</p>}
      </div>
      <Button type="submit" disabled={isUploading || !file}>
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </Button>
    </form>
  );
}
