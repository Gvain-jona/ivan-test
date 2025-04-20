import React from 'react';

interface SectionHeaderProps {
  title: string;
  count?: number;
  badgeColor?: 'white' | 'green' | 'purple' | 'orange';
  actions?: React.ReactNode;
}

/**
 * Reusable section header component for order view sections
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  badgeColor = 'white',
  actions
}) => {
  // Get badge color classes based on the color prop
  const getBadgeColorClasses = () => {
    switch (badgeColor) {
      case 'green':
        return 'bg-green-500/15 text-green-400 border-green-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'orange':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'white':
      default:
        return 'bg-white/15 text-white border-white/30';
    }
  };

  return (
    <div className="flex justify-between items-center border-b border-border/40 pb-2">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className={`px-2 py-0.5 text-xs rounded-full ${getBadgeColorClasses()} border`}>
            {count}
          </span>
        )}
      </div>
      {actions && (
        <div>
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
