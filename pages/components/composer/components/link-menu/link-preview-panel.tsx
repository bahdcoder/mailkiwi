// import {
//   ToolbarButton,
//   ToolbarContainer,
// } from "#root/pages/components/composer/components/toolbar/toolbar.jsx"
// import { EditPencilIcon } from "#root/pages/components/icons/edit-pencil.svg.jsx"
// import { TrashIcon } from "#root/pages/components/icons/trash.svg.jsx"
// import { Icon } from "#root/pages/components/tiptap/ui/Icon.jsx"
// import { Surface } from "#root/pages/components/tiptap/ui/Surface.jsx"
// import { Toolbar } from "#root/pages/components/tiptap/ui/Toolbar.jsx"
// import Tooltip from "#root/pages/components/tiptap/ui/Tooltip/index.jsx"
// import { Text } from "@kibamail/owly/text"

// export type LinkPreviewPanelProps = {
//   url: string
//   onEdit: () => void
//   onClear: () => void
// }

// export const LinkPreviewPanel = ({ onClear, onEdit, url }: LinkPreviewPanelProps) => {
//   const sanitizedLink = url?.startsWith("javascript:") ? "" : url

//   return (
//     <ToolbarContainer>
//       <div className="flex items-center px-2 border-r border-(--white-10)">
//         <a
//           href={sanitizedLink}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="cursor-pointer text-white underline underline-offset-2 decoration-(--content-tertiary-inverse)"
//         >
//           <Text className="kb-content-tertiary-inverse">{sanitizedLink}</Text>
//         </a>
//       </div>
//       {/* <ToolbarButton onClick={onEdit}>
//         <EditPencilIcon className="w-4 h-4" />
//       </ToolbarButton> */}
//       <LinkEditorPanel editor={editor}>
//         <button>
//           <EditPencilIcon className="w-4 h-4" />
//         </button>
//       </LinkEditorPanel>

//       <ToolbarButton onClick={onClear}>
//         <TrashIcon className="w-4 h-4" />
//       </ToolbarButton>
//     </ToolbarContainer>
//   )

//   return (
//     <Surface className="flex items-center gap-2 p-2">
//       <a
//         href={sanitizedLink}
//         target="_blank"
//         rel="noopener noreferrer"
//         className="text-sm underline break-all"
//       >
//         {url}
//       </a>
//       <Toolbar.Divider />
//       <Tooltip title="Edit link">
//         <Toolbar.Button onClick={onEdit}>
//           <Icon name="Pen" />
//         </Toolbar.Button>
//       </Tooltip>
//       <Tooltip title="Remove link">
//         <Toolbar.Button onClick={onClear}>
//           <Icon name="Trash2" />
//         </Toolbar.Button>
//       </Tooltip>
//     </Surface>
//   )
// }
