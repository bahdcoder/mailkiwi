import { AppStoreProvider, } from './workflow-editor-pro/store/index.jsx'
import { defaultState } from './workflow-editor-pro/store/app-store.js'
import { WorkflowBuilder } from './workflow-editor-pro/workflow-builder.jsx'

import './workflow-editor-pro-styles.css'

export function EngageAutomationsPage() {
  return <AppStoreProvider initialState={defaultState}>
    <WorkflowBuilder />
  </AppStoreProvider>
}

export { EngageAutomationsPage as Page }

