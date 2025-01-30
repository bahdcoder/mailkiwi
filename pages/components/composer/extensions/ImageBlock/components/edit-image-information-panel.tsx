import {
  ToolbarButton,
  getToolbarClassNames,
} from "@/pages/components/composer/components/toolbar/toolbar.jsx"
import { EditPencilIcon } from "@/pages/components/icons/edit-pencil.svg.jsx"
import * as Popover from "@/pages/components/popover/popover.jsx"
import * as TextField from "@kibamail/owly/text-field"

export function EditImageInformationPanel() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className={getToolbarClassNames(false)} onClick={console.log}>
          <EditPencilIcon className="w-4 h-4" />
        </button>
      </Popover.Trigger>
      <Popover.Content align="center" sideOffset={12} className="w-80">
        <div className="flex flex-col gap-3 py-2">
          <TextField.Root placeholder="Title">
            <TextField.Label>Image title</TextField.Label>
          </TextField.Root>
          <TextField.Root placeholder="Alt text">
            <TextField.Label>Alt text</TextField.Label>
          </TextField.Root>
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}
