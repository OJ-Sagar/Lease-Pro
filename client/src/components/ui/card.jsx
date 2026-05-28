import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const MotionSection = motion.section;

export function Card({ className, children }) {
  return (
    <MotionSection
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={cn('glass min-w-0 rounded-lg p-4 sm:p-5', className)}
    >
      {children}
    </MotionSection>
  );
}

export function CardHeader({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
