'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Save } from 'lucide-react';
import { useInvoiceContext } from '../context/InvoiceContext';
import ProfessionalTemplate from './templates/ProfessionalTemplate';
import { generateExactPdf } from '../utils/exactPdfGenerator';
import { useToast } from '@/components/ui/use-toast';
import { QualitySelector, InvoiceQuality } from './QualitySelector';
import SaveSettingsButton from './settings/SaveSettingsButton';

/**
 * Component for previewing and downloading the invoice
 */
const InvoicePreview: React.FC = () => {
  const { order, settings } = useInvoiceContext();
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState<InvoiceQuality>('digital');

  // Handle download button click
  const handleDownload = async () => {
    if (!previewRef.current) return;

    // Show warning for print quality
    if (selectedQuality === 'print' && !isGenerating) {
      toast({
        title: 'Print Quality Selected',
        description: 'High-quality print may take longer to process. Please be patient.',
        duration: 3000,
      });
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Get the template container directly using the data attribute
      const templateContainer = previewRef.current.querySelector('[data-pdf-container="true"]');

      if (!templateContainer) {
        throw new Error('Template container not found');
      }

      // Show toast for starting download
      toast({
        title: `Preparing ${selectedQuality === 'print' ? 'Print' : 'Digital'} Invoice`,
        description: selectedQuality === 'print'
          ? 'Creating high-quality PDF for professional printing...'
          : 'Creating optimized PDF for digital sharing...',
      });

      // Generate and download the PDF with exact capture
      await generateExactPdf(
        templateContainer as HTMLElement,
        order,
        {
          quality: selectedQuality,
          // Set DPI based on quality
          dpi: selectedQuality === 'print' ? 300 : 96
        },
        (downloadProgress) => {
          // Update UI with download progress
          setProgress(downloadProgress);
        }
      );

      toast({
        title: 'Invoice Downloaded',
        description: selectedQuality === 'print'
          ? 'Your high-quality print PDF has been downloaded.'
          : 'Your optimized digital PDF has been downloaded.',
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);

      toast({
        title: 'Download Failed',
        description: 'There was an error downloading your invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <QualitySelector
            selectedQuality={selectedQuality}
            onQualityChange={setSelectedQuality}
            disabled={isGenerating}
          />
          <SaveSettingsButton variant="outline" size="sm" />
        </div>
        <Button
          onClick={handleDownload}
          disabled={isGenerating}
          className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating... {Math.round(progress)}%
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download {selectedQuality === 'print' ? 'Print' : 'Digital'} PDF
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 rounded-md p-4 flex flex-col items-center">
        {/* Scroll indicator */}
        <div className="text-center mb-2 text-sm text-muted-foreground">
          <span>Scroll to view the entire invoice</span>
        </div>

        {/* A4 container with exact dimensions */}
        <div className="relative w-full max-w-[210mm] mx-auto shadow-md">
          {/* Maintain A4 aspect ratio (1:1.414) */}
          <div
            className="pb-[141.4%] w-full"
            style={{ maxHeight: 'calc(100vh - 180px)' }} /* Adjusted for scroll indicator */
          ></div>

          {/* Absolute positioned content - this is what will be captured exactly */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 overflow-auto bg-white"
            ref={previewRef}
          >
            <ProfessionalTemplate order={order} settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
