import React from 'react';
import { MediaCard } from './MediaCard';
import { Work } from '../../types';

interface WorkCardProps {
  work: Work;
  variant?: 'grid' | 'list' | 'compact';
  showAttribution?: boolean;
}

export const WorkCard: React.FC<WorkCardProps> = (props) => {
  return <MediaCard {...props} />;
};

export default WorkCard;
