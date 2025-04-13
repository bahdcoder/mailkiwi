import { AddEdgeButton } from './add-button.tsx'

const EdgeAddButton = (props) => {
  const { data, id } = props

  return (
    <div className="flex items-center justify-center">
      <AddEdgeButton onClick={() => data.onAddNodeCallback(id)} />
    </div>
  )
}

export default EdgeAddButton
