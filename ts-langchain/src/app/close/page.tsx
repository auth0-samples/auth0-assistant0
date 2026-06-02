'use client';

import { useEffect, useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';

export default function PopupClosePage() {
  const [isClosing, setIsClosing] = useState(true);

  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.close();
      } catch (err) {
        console.error(err);
        setIsClosing(false);
      }
    }
  }, []);

  useEffect(() => {
    // Attempt to close the window on load
    handleClose();
  }, [handleClose]);

  return isClosing ? (
    <></>
  ) : (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <p className="mb-4 text-lg">You can now close this window.</p>
        <Button onClick={handleClose}>Close</Button>
      </div>
    </div>
  );
}
