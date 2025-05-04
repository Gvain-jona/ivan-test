import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  content?: React.ReactNode;
  badges?: React.ReactNode[];
  accentColor?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditLoading?: boolean;
  isDeleteLoading?: boolean;
  className?: string;
}

/**
 * A reusable card component for displaying items like payments and notes
 * with consistent styling and behavior
 */
export function ItemCard({
  id,
  title,
  subtitle,
  content,
  badges,
  accentColor = 'green',
  onEdit,
  onDelete,
  isEditLoading = false,
  isDeleteLoading = false,
  className
}: ItemCardProps) {
  // Map color names to tailwind classes
  const colorMap: Record<string, string> = {
    green: 'after:bg-green-500/20',
    blue: 'after:bg-blue-500/20',
    red: 'after:bg-red-500/20',
    yellow: 'after:bg-yellow-500/20',
    purple: 'after:bg-purple-500/20',
    gray: 'after:bg-gray-500/20'
  };

  const accentClass = colorMap[accentColor] || colorMap.gray;

  return (
    <div
      className={cn(
        "border border-border/40 bg-card backdrop-blur-sm rounded-lg p-4 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-card/90 relative after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-b-lg after:opacity-0 hover:after:opacity-100 after:transition-opacity",
        accentClass,
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Title and badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold">{title}</div>
            {badges && badges.map((badge, index) => (
              <React.Fragment key={index}>{badge}</React.Fragment>
            ))}
          </div>
          
          {/* Subtitle */}
          {subtitle && (
            <div className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </div>
          )}
          
          {/* Content */}
          {content && (
            <div className="mt-2">
              {content}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        {(onEdit || onDelete) && (
          <div className="flex gap-1 ml-4">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEdit}
                disabled={isEditLoading}
              >
                {isEditLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500"
                onClick={onDelete}
                disabled={isDeleteLoading}
              >
                {isDeleteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
