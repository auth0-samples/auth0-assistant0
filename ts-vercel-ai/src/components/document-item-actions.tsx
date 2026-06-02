'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DocumentParams } from '@/lib/db/schema/documents';
import { deleteDocument, getDocumentContent, shareDocument } from '@/lib/actions/documents';

interface DocumentItemActionsProps {
  doc: Omit<DocumentParams, 'content'>;
  onActionComplete: () => void; // To trigger revalidation on the parent page
}

export default function DocumentItemActions({ doc, onActionComplete }: DocumentItemActionsProps) {
  const [emailToShare, setEmailToShare] = useState('');
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async () => {
    try {
      // Fetch the document content
      const content = await getDocumentContent(doc.id);
      if (!content) {
        throw new Error('Failed to download document');
      }
      const blob = new Blob([content as any], { type: doc.fileType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Downloaded ${doc.fileName} successfully`);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleShareSubmit = async () => {
    if (!emailToShare.trim()) {
      toast.error('Please enter an email address to share with.');
      return;
    }
    setIsProcessing(true);
    try {
      await shareDocument(doc.id, emailToShare.split(','));
      toast.success(`${doc.fileName} shared with ${emailToShare}.`);
      onActionComplete(); // Trigger revalidation
      setEmailToShare(''); // Reset email input
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Failed to share document.');
    }
    setIsProcessing(false);
    setOpenShareDialog(false);
  };

  const handleDeleteConfirm = async () => {
    setIsProcessing(true);
    try {
      await deleteDocument(doc.id);
      toast.success(`${doc.fileName} deleted successfully.`);
      onActionComplete(); // Trigger revalidation
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document.');
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex space-x-2">
      <Button onClick={handleDownload} variant="outline" size="sm" disabled={isProcessing}>
        Download
      </Button>

      <Dialog
        open={openShareDialog}
        onOpenChange={(open) => {
          setOpenShareDialog(open);
          setEmailToShare('');
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-blue-600" size="sm" disabled={isProcessing}>
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share {doc.fileName}</DialogTitle>
            <DialogDescription>
              Enter the email addresses (comma separated) of the users you want to share this document with. They will
              get read-only access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={emailToShare}
                onChange={(e) => setEmailToShare(e.target.value)}
                placeholder="user@example.com"
                className="col-span-3"
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isProcessing}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleShareSubmit} disabled={isProcessing || !emailToShare.trim()}>
              {isProcessing ? 'Sharing...' : 'Share Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={isProcessing}>
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the document ({doc.fileName}) and its
              associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose disabled={isProcessing}>
              <Button type="button" variant="outline" disabled={isProcessing}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleDeleteConfirm} disabled={isProcessing} variant="destructive">
              {isProcessing ? 'Deleting...' : 'Yes, delete document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
