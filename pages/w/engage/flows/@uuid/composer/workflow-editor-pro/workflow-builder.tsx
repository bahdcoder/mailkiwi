import { ReactFlowProvider } from '@xyflow/react';

import SidebarLayout from './components/layouts/sidebar-layout/index.jsx';
import AppContextMenu from './components/app-context-menu.jsx';
import Workflow from './components/workflow/index.jsx';

export function WorkflowBuilder() {
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
