import { Panel } from '@xyflow/react';
import { Route } from 'lucide-react';

import { ZoomSlider } from '../zoom-slider.jsx';
import { Button } from '../ui/button.jsx';
import { useLayout } from '../../hooks/use-layout.jsx';

export function WorkflowControls() {
  const runLayout = useLayout(true);

  return (
    <>
      <ZoomSlider position="bottom-left" className="bg-card" />
      <Panel
        position="bottom-right"
        className="bg-card text-foreground rounded-md"
      >
        <Button onClick={runLayout} variant="ghost">
          <Route />
        </Button>
      </Panel>
    </>
  );
}
