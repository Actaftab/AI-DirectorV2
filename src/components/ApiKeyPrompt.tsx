import React, { useState, useEffect } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';

interface ApiKeyPromptProps {
  onKeySelected: () => void;
}

export function ApiKeyPrompt({ onKeySelected }: ApiKeyPromptProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
          onKeySelected();
        }
      }
    } catch (error) {
      console.error('Error checking API key:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSelectKey = async () => {
    setIsSelecting(true);
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success to mitigate race condition
        onKeySelected();
      } else {
        alert('AI Studio environment not detected.');
      }
    } catch (error) {
      console.error('Error selecting key:', error);
      alert('Failed to select API key. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="max-w-md w-full bg-[#121212] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <KeyRound className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-serif mb-3 text-white">API Key Required</h1>
        <p className="text-white/60 text-sm mb-6 leading-relaxed">
          This tool uses the high-quality Nano Banana Pro image model, which requires a paid Google Cloud project API key.
          <br /><br />
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 underline hover:text-white"
          >
            Learn more about billing
          </a>
        </p>
        <button
          onClick={handleSelectKey}
          disabled={isSelecting}
          className="w-full py-3 px-4 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSelecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect API Key'
          )}
        </button>
      </div>
    </div>
  );
}
