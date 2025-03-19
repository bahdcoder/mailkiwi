import { ReactFlowProvider } from '@xyflow/react';

import SidebarLayout from '@/components/layouts/sidebar-layout';
import AppContextMenu from '@/components/app-context-menu';
import Workflow from '@/components/workflow';

export default async function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <SidebarLayout>
        <AppContextMenu>
          <Workflow />
        </AppContextMenu>
      </SidebarLayout>
    </ReactFlowProvider>
  );
}
