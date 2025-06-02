'use client';

import React from 'react';
import { Loader2, FileText, Download, CheckCircle } from 'lucide-react';
import { InvoiceQuality } from './QualitySelector';

interface PdfGenerationOverlayProps {
  isVisible: boolean;
  progress: number;
  quality: InvoiceQuality;
  stage: 'preparing' | 'generating' | 'downloading' | 'complete';
  onCancel?: () => void;
}

export const PdfGenerationOverlay: React.FC<PdfGenerationOverlayProps> = ({
  isVisible,
  progress,
  quality,
  stage,
  onCancel
}) => {
  if (!isVisible) return null;

  const getStageInfo = () => {
    switch (stage) {
      case 'preparing':
        return {
          icon: <FileText className="h-12 w-12 text-orange-500 animate-pulse" />,
          title: 'Preparing Invoice',
          description: 'Setting up your invoice template...',
          showProgress: false
        };
      case 'generating':
        return {
          icon: <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />,
          title: `Generating ${quality === 'print' ? 'Print Quality' : 'Digital'} PDF`,
          description: quality === 'print' 
            ? 'Creating high-resolution PDF for professional printing...'
            : 'Optimizing PDF for digital sharing...',
          showProgress: true
        };
      case 'downloading':
        return {
          icon: <Download className="h-12 w-12 text-orange-500 animate-bounce" />,
          title: 'Downloading Invoice',
          description: 'Your PDF is ready and downloading...',
          showProgress: true
        };
      case 'complete':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: 'Download Complete!',
          description: 'Your invoice has been successfully downloaded.',
          showProgress: false
        };
      default:
        return {
          icon: <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />,
          title: 'Processing...',
          description: 'Please wait...',
          showProgress: false
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {stageInfo.icon}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {stageInfo.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {stageInfo.description}
            </p>
          </div>

          {/* Progress Bar */}
          {stageInfo.showProgress && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(progress, 5)}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(progress)}% complete
              </div>
            </div>
          )}

          {/* Quality Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            {quality === 'print' ? '🖨️ Print Quality' : '💻 Digital Quality'}
          </div>

          {/* Cancel Button (only during preparation) */}
          {stage === 'preparing' && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}

          {/* Info Text */}
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {stage === 'generating' && quality === 'print' && (
              'High-quality PDFs may take a moment to process...'
            )}
            {stage === 'generating' && quality === 'digital' && (
              'Creating your optimized PDF...'
            )}
            {stage === 'complete' && (
              'Check your downloads folder for the invoice PDF.'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};