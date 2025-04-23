import React, { forwardRef, useEffect, useState } from 'react';
import './styles/a4-preview.css';
import { A4_DIMENSIONS } from './utils/constants';

interface A4PreviewContainerProps {
  children: React.ReactNode;
  hideScrollbars?: boolean;
  className?: string;
  scale?: number;
  maxHeight?: string;
  showBorder?: boolean;
}

/**
 * A container component that maintains perfect A4 aspect ratio for previewing documents
 * This ensures that what you see in the preview is exactly what you'll get in the PDF
 * The component scales responsively while always preserving the A4 aspect ratio
 */
const A4PreviewContainer = forwardRef<HTMLDivElement, A4PreviewContainerProps>(
  ({
    children,
    hideScrollbars = false, // Default to showing scrollbars for better UX
    className = '',
    scale = 1,
    maxHeight = '80vh',
    showBorder = true
  }, ref) => {
    // Calculate A4 aspect ratio (height/width)
    const A4_ASPECT_RATIO = A4_DIMENSIONS.MM.HEIGHT / A4_DIMENSIONS.MM.WIDTH;

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

          // Calculate height based on A4 aspect ratio
          const height = width * A4_ASPECT_RATIO;
          setContainerHeight(height);
        }
      };

      // Initial measurement
      updateDimensions();

      // Add resize listener
      window.addEventListener('resize', updateDimensions);

      // Cleanup
      return () => window.removeEventListener('resize', updateDimensions);
    }, [A4_ASPECT_RATIO]);

    return (
      <div
        className={`a4-preview-outer ${className}`}
        ref={containerRef}
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        <div
          className={`a4-preview-container ${showBorder ? 'with-border' : ''}`}
          ref={ref}
          style={{
            width: '100%',
            paddingTop: `${A4_ASPECT_RATIO * 100}%`, // Maintain aspect ratio with padding trick
            position: 'relative',
            maxHeight: maxHeight,
            overflow: 'hidden',
            boxShadow: showBorder ? '0 4px 24px rgba(0, 0, 0, 0.15)' : 'none',
          }}
        >
          <div
            className={`a4-content ${hideScrollbars ? 'hide-scrollbars' : ''}`}
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
              justifyContent: 'stretch', // Changed from center to stretch to fill width
              alignItems: 'stretch', // Changed from flex-start to stretch to fill height
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

A4PreviewContainer.displayName = 'A4PreviewContainer';

export default A4PreviewContainer;
