import { Popover as RadixPopover } from '@radix-ui/react-popover';
import { Play, Pause } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWorkflowRunner } from '@/hooks/use-workflow-runner';

export function AppPopover() {
  const { logMessages, runWorkflow, stopWorkflow, isRunning } =
    useWorkflowRunner();

  const onClickRun = () => {
    if (isRunning) {
      stopWorkflow();
      return;
    }

    runWorkflow();
  };

  return (
    <RadixPopover>
      <PopoverTrigger asChild>
        <Button onClick={onClickRun}>
          {isRunning ? (
            <>
              <Pause /> Stop Workflow
            </>
          ) : (
            <>
              <Play /> Run Workflow
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="h-[85vh] m-4 text-xs font-mono space-y-4 overflow-y-auto">
        {logMessages.length ? (
          logMessages.map((message, index) => (
            <p key={index} className="break-words">
              {message}
            </p>
          ))
        ) : (
          <p>No log messages yet.</p>
        )}
      </PopoverContent>
    </RadixPopover>
  );
}

export default AppPopover;
