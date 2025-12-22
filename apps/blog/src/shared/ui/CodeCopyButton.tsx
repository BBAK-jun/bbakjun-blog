'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeCopyButtonProps {
  code: string;
}

export default function CodeCopyButton({ code }: CodeCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      className="absolute top-2 right-2 p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100"
      title={copied ? '복사됨!' : '코드 복사'}
      aria-label={copied ? '복사됨!' : '코드 복사'}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}
