import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { LogIn } from 'lucide-react';

export interface PromptUserContainerProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    className?: string;
  };
  icon?: React.ReactNode;
  readOnly?: boolean;
  containerClassName?: string;
}

export function PromptUserContainer({
  title,
  description,
  action,
  icon,
  readOnly = false,
  containerClassName,
}: PromptUserContainerProps) {
  return (
    <fieldset
      className={cn(
        'border border-gray-300 rounded-lg items-center w-full justify-between p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-2',
        { 'disabled cursor-not-allowed': readOnly },
        containerClassName,
      )}
      disabled={readOnly}
    >
      <div className="w-full flex flex-col sm:flex-row justify-start items-center gap-4">
        {icon}
        <div className="flex flex-col gap-1 sm:gap-1.5 items-start w-full">
          <h2 className="grow text-sm sm:text-base leading-6 font-semibold">{title}</h2>
          {description && <p className="grow text-xs sm:text-sm leading-5 font-light text-gray-500">{description}</p>}
        </div>
      </div>

      {action && (
        <div className="w-full sm:w-fit">
          <Button asChild variant="default" size="default" onClick={action.onClick}>
            <a className="flex items-center gap-2">
              <LogIn />
              <span>{action.label}</span>
            </a>
          </Button>
        </div>
      )}
    </fieldset>
  );
}
