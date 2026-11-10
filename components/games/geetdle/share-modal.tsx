"use client";

import { useState } from "react";

interface ShareModalProps {
  shareText: string;
  onClose: () => void;
}

export function ShareModal({ shareText, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-rule rounded-lg p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Share Your Results</h2>

        <div className="bg-surface border border-rule rounded p-4 mb-4">
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {shareText}
          </pre>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 px-4 py-2 bg-accent text-accent-ink font-semibold rounded-md hover:opacity-90 transition-opacity"
          >
            {copied ? "✓ Copied!" : "Copy to Clipboard"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-rule rounded-md hover:bg-surface transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
