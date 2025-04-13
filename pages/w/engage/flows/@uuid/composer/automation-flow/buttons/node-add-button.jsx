import { AddButton } from './add-button'
import './node-add-button.css'

const NodeAddButton = (props) => {
  return (
    <div className="NodeAddButton">
      <AddButton {...props} />
    </div>
  )
}

export default NodeAddButton
