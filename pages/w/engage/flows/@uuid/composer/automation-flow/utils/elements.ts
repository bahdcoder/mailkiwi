import { v4 as uuidv4 } from "uuid"
import { cloneDeep } from "./clone_deep.js"
import { AutomationElement } from "@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js"

const position = { x: 0, y: 0 }

const getTitleAndDescription = (type: any) => {
  switch (type) {
    case "email":
      return { title: "Email", description: "Send email to contacts." }
    case "sms":
      return { title: "Sms", description: "Send sms to contacts." }
    case "waitThenCheck":
      return { title: "New Rule", description: "Check behaviour of the Rule" }
    case "end":
      return { title: "End", description: "Process ends" }
    default:
      return { title: "", description: "" }
  }
}

const getUpdatedElementsAfterActionNodeAddition = ({
  elements,
  newNodeId,
  targetNodeId,
  onAddNodeCallback,
}: any) => {
  const clonedElements = cloneDeep(elements)
  const newEdge = {
    id: uuidv4(),
    source: newNodeId,
    target: targetNodeId,
    type: "condition",
    data: { onAddNodeCallback },
  }
  clonedElements.push(newEdge)
  return clonedElements
}

const getUpdatedElementsAfterEndNodeAddition = () => {}

const getUpdatedElementsAfterRuleNodeAdditon = ({
  elements,
  newNodeId,
  targetNodeId,
  onAddNodeCallback,
}: any) => {
  const clonedElements = cloneDeep(elements)
  const emptyNode1Id = uuidv4()
  const emptyNode2Id = uuidv4()
  const endNodeId = uuidv4()
  const mergeNodeId = uuidv4()
  const emptyNode1 = {
    id: emptyNode1Id,
    type: "empty",
    data: {},
    position,
    height: 6,
    // width: 40,
  }
  const emptyNode2 = {
    id: emptyNode2Id,
    type: "empty",
    data: {},
    position,
    height: 6,
    // width: 40,
  }

  const endNode = {
    id: endNodeId,
    type: "end",
    data: {},
    position,
    height: 92,
  }
  const ruleNodeToEmptyNodeEdge1 = {
    id: uuidv4(),
    source: newNodeId,
    target: emptyNode1Id,
    type: "condition",
    // animated: true,
    data: { onAddNodeCallback },
  }
  const ruleNodeToEmptyNodeEdge2 = {
    id: uuidv4(),
    source: newNodeId,
    target: emptyNode2Id,
    type: "condition",
    // animated: true,
    data: { onAddNodeCallback },
  }
  const ruleNodeToEndNodeEdge = {
    id: uuidv4(),
    source: emptyNode2Id,
    target: endNodeId,
    type: "condition",
    data: { onAddNodeCallback },
  }

  const ruleNodeToTargetNodeEdge = {
    id: uuidv4(),
    source: emptyNode1Id,
    target: targetNodeId,
    type: "condition",
    // animated: true,
    data: { onAddNodeCallback },
  }

  return [
    ...clonedElements,
    ...[
      endNode,
      emptyNode1,
      emptyNode2,
      ruleNodeToEmptyNodeEdge1,
      ruleNodeToEmptyNodeEdge2,
      ruleNodeToEndNodeEdge,
      ruleNodeToTargetNodeEdge,
    ],
  ]
}

export function getParentNodeIdFromTargetEdgeId(
  elements: AutomationElement[],
  id: string
) {
  const targetEdgeIndex = cloneDeep(elements).findIndex((x) => x.id === id)

  return elements[targetEdgeIndex]?.source
}

const getUpdatedElementsAfterNodeAddition = ({
  elements,
  targetEdgeId,
  type,
  onDeleteNodeCallback,
  onNodeClickCallback,
  onAddNodeCallback,
}: any) => {
  const newNodeId = uuidv4()
  const { title, description } = getTitleAndDescription(type)
  const newNode = {
    id: newNodeId,
    type,
    data: {
      title,
      description,
      onNodeClickCallback,
      onDeleteNodeCallback,
    },
    position,
  }
  const clonedElements = cloneDeep(elements as AutomationElement[])
  const targetEdgeIndex = clonedElements.findIndex((x) => x.id === targetEdgeId)
  const targetEdge = elements[targetEdgeIndex]
  const { target: targetNodeId } = targetEdge
  const updatedTargetEdge = { ...targetEdge, target: newNodeId }
  clonedElements[targetEdgeIndex] = updatedTargetEdge
  clonedElements.push(newNode as unknown as AutomationElement)

  switch (type) {
    case "end":
      return getUpdatedElementsAfterEndNodeAddition()
    case "waitThenCheck":
      return getUpdatedElementsAfterRuleNodeAdditon({
        elements: clonedElements,
        newNodeId,
        targetNodeId,
        onAddNodeCallback,
      })
    default:
      return getUpdatedElementsAfterActionNodeAddition({
        elements: clonedElements,
        newNodeId,
        newNode,
        targetNodeId,
        onAddNodeCallback,
      })
  }
}

export { getUpdatedElementsAfterNodeAddition }
