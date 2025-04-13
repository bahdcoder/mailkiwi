import React from "react"
import { cloneDeep } from "./utils/clone_deep.js"
import { Automation } from "./automation.jsx"
import { initialElements } from "./data/elements1.js"
import {
  getParentNodeIdFromTargetEdgeId,
  getUpdatedElementsAfterNodeAddition,
} from "./utils/elements.js"
import "antd/dist/antd.css"
import "./styles.css"
import {
  AutomationElement,
  EdgeElement,
} from "@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js"
import { NodeElement } from "./types/elements.js"

import { AddNodeDialog } from "./components/add-node-dialog.jsx"
import {
  AutomationStep,
  AutomationWithSteps,
} from "@/database/database_schema_types.js"
import { usePageProps } from "@/pages/hooks/use_page_props.js"

export const Flow = () => {
  const { automation } = usePageProps<{ automation: AutomationWithSteps }>()
  const [elements, setElements] = React.useState<AutomationElement[]>([])
  const [addNodeDialogOpen, setAddNodeDialogOpen] = React.useState(false)
  const [selectedNode, setSelectedNode] = React.useState<NodeElement | null>(
    null
  )
  console.log({ automation, elements })
  const [addNodeToParentId, setAddNodeToParentId] = React.useState<string>("")

  const onAddNodeCallback = (id: string) => {
    setAddNodeToParentId(
      getParentNodeIdFromTargetEdgeId(elements, id) as string
    )
    setAddNodeDialogOpen(true)
    // setElements((elements) =>
    //   getUpdatedElementsAfterNodeAddition({
    //     elements,
    //     targetEdgeId: id,
    //     type,
    //     onDeleteNodeCallback,
    //     onNodeClickCallback,
    //     onAddNodeCallback,
    //   })
    // )
  }

  const onDeleteNodeCallback = (id: string) => {
    setElements((elements) => {
      const clonedElements = cloneDeep(elements)
      const incomingEdges = clonedElements.filter(
        (element) => (element as EdgeElement).target === id
      )
      const outgoingEdges = clonedElements.filter(
        (element) => (element as NodeElement).source === id
      )
      const updatedIncomingEdges = incomingEdges.map((element) => ({
        ...element,
        target: outgoingEdges[0].target as string,
      }))
      const filteredElements = clonedElements.filter(
        (element) =>
          element.id !== id &&
          element.target !== incomingEdges[0].target &&
          element.source !== outgoingEdges[0].source
      )
      return [...filteredElements, ...updatedIncomingEdges]
    })
  }

  const onNodeClickCallback = (id: string) => {
    console.log(`You clicked the "${id}" node`)
  }

  const onAddNodeSuccess = (node: AutomationStep) => {}

  React.useEffect(() => {
    const nodes = initialElements
      .filter((element) => !(element as NodeElement).target)
      .map((element) => ({
        ...element,
        data: {
          ...(element as NodeElement).data,
          onDeleteNodeCallback,
          onNodeClickCallback,
        },
      })) as NodeElement[]
    const edges = initialElements
      .filter((element) => (element as EdgeElement).target)
      .map((element) => ({
        ...element,
        data: { ...(element as EdgeElement).data, onAddNodeCallback },
      })) as EdgeElement[]
    setElements([...nodes, ...edges])
  }, [])

  return (
    <div className="h-screen fleelement items-center w-full justify-center">
      <Automation elements={elements} />
      <AddNodeDialog
        parentId={addNodeToParentId}
        open={addNodeDialogOpen}
        setOpen={setAddNodeDialogOpen}
        allowedTypes={["ACTIONS", "RULES"]}
        onAddNodeSuccess={onAddNodeSuccess}
      />
    </div>
  )
}
