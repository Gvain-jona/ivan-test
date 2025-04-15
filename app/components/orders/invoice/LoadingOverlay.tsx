import React from 'react';
import { Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
  progress?: number; // Optional progress percentage (0-100)
}

/**
 * A loading overlay component that can be shown during PDF generation
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Generating PDF...',
  visible,
  progress
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-background rounded-lg p-6 shadow-xl flex flex-col items-center max-w-md"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
              </div>
              <div className="bg-orange-500/10 rounded-full p-8">
                <FileText className="h-10 w-10 text-orange-500" />
              </div>
            </div>

            <p className="text-lg font-medium text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Please wait while we prepare your invoice...</p>

            {progress !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
