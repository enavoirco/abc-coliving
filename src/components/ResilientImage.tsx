import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Home } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  revealOnScroll?: boolean;
  priority?: boolean;
  hoverZoom?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  revealOnScroll = false,
  priority = false,
  hoverZoom = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const showFallback = !src || hasError;

  const content = showFallback ? (
    <div
      className={`flex flex-col items-center justify-center bg-[#F1EFE9] text-[#5F5F5F] p-8 text-center w-full h-full min-h-[220px] ${className}`}
      role="img"
      aria-label={alt || 'ABC Coliving architectural interior'}
    >
      <Home className="w-6 h-6 text-[#315C4C] mb-3 stroke-[1.25]" />
      <span className="font-editorial text-lg text-[#111111] tracking-wide">ABC Coliving</span>
      <span className="text-xs text-[#858585] mt-1 max-w-[220px]">{alt || 'Thoughtfully designed living spaces'}</span>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        hoverZoom ? 'group-hover:scale-[1.03]' : ''
      } ${className}`}
    />
  );

  if (revealOnScroll && !prefersReducedMotion) {
    return (
      <motion.div
        initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
        whileInView={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className={`overflow-hidden bg-[#F7F6F2] ${containerClassName}`}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={`overflow-hidden bg-[#F7F6F2] ${containerClassName}`}>{content}</div>;
};
