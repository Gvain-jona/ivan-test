import React, { forwardRef, useEffect, useState } from 'react';
import './styles/a5-preview.css';
import { A5_DIMENSIONS } from './utils/constants';

interface A5PreviewContainerProps {
  children: React.ReactNode;
  hideScrollbars?: boolean;
  className?: string;
  scale?: number;
  maxHeight?: string;
  showBorder?: boolean;
}

/**
 * A container component that maintains perfect A5 aspect ratio for previewing documents
 * This ensures that what you see in the preview is exactly what you'll get in the PDF
 * The component scales responsively while always preserving the A5 aspect ratio
 */
const A5PreviewContainer = forwardRef<HTMLDivElement, A5PreviewContainerProps>(
  ({
    children,
    hideScrollbars = false, // Default to showing scrollbars for better UX
    className = '',
    scale = 1,
    maxHeight = '80vh',
    showBorder = true
  }, ref) => {
    // Calculate A5 aspect ratio (height/width)
    const A5_ASPECT_RATIO = A5_DIMENSIONS.MM.HEIGHT / A5_DIMENSIONS.MM.WIDTH;

    // State to track container width for responsive scaling
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Reference to measure the container
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Update dimensions on resize
    useEffect(() => {
      const updateDimensions = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setContainerWidth(width);

          // Calculate height based on A5 aspect ratio
          const height = width * A5_ASPECT_RATIO;
          setContainerHeight(height);
        }
      };

      // Initial measurement
      updateDimensions();

      // Add resize listener
      window.addEventListener('resize', updateDimensions);

      // Cleanup
      return () => window.removeEventListener('resize', updateDimensions);
    }, [A5_ASPECT_RATIO]);

    return (
      <div
        className={`a5-preview-outer ${className}`}
        ref={containerRef}
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        <div
          className={`a5-preview-container ${showBorder ? 'with-border' : ''}`}
          ref={ref}
          style={{
            width: '100%',
            paddingTop: `${A5_ASPECT_RATIO * 100}%`, // Maintain aspect ratio with padding trick
            position: 'relative',
            maxHeight: maxHeight,
            overflow: 'hidden',
            boxShadow: showBorder ? '0 4px 24px rgba(0, 0, 0, 0.15)' : 'none',
          }}
        >
          <div
            className={`a5-content invoice-container ${hideScrollbars ? 'hide-scrollbars' : ''}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'auto',
              transform: scale !== 1 ? `scale(${scale})` : 'none',
              transformOrigin: 'top center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              // Add subtle scrollbar indicator
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.2) transparent',
              // Ensure content is properly sized for PDF generation
              width: '100%',
              height: '100%',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);

A5PreviewContainer.displayName = 'A5PreviewContainer';

export default A5PreviewContainer;
