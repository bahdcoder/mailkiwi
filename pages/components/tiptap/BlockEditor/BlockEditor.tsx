// import { ContentItemMenu } from "../menus/ContentItemMenu"
// import { TextMenu } from "../menus/TextMenu"
// import { EditorHeader } from "./components/EditorHeader.jsx"
// import { useBlockEditor } from "#root/hooks/useBlockEditor.js"
// import { useSidebar } from "#root/hooks/useSidebar.js"
// import ImageBlockMenu from "#root/pages/components/composer/extensions/ImageBlock/components/ImageBlockMenu.jsx"
// import { ColumnsMenu } from "#root/pages/components/composer/extensions/MultiColumn/menus.jsx"
// import {
//   TableColumnMenu,
//   TableRowMenu,
// } from "#root/pages/components/composer/extensions/Table/menus.js"
// import { Sidebar } from "#root/pages/components/tiptap/Sidebar.js"
// import { LinkMenu } from "#root/pages/components/tiptap/menus.js"
// import "#root/styles/index.css"
// import { TiptapCollabProvider } from "@hocuspocus/provider"
// import { EditorContent } from "@tiptap/react"
// import React, { useRef } from "react"

// export const BlockEditor = () => {
//   const menuContainerRef = useRef(null)

//   const leftSidebar = useSidebar()
//   const { editor, users, collabState } = useBlockEditor()

//   if (!editor || !users) {
//     return null
//   }

//   return (
//     <div className="flex h-full" ref={menuContainerRef}>
//       <Sidebar isOpen={leftSidebar.isOpen} onClose={leftSidebar.close} editor={editor} />
//       <div className="relative flex flex-col flex-1 h-full overflow-hidden">
//         <EditorHeader
//           editor={editor}
//           collabState={collabState}
//           users={users}
//           isSidebarOpen={leftSidebar.isOpen}
//           toggleSidebar={leftSidebar.toggle}
//         />
//         <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
//         <ContentItemMenu editor={editor} />
//         <LinkMenu editor={editor} appendTo={menuContainerRef} />
//         <TextMenu editor={editor} />
//         <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
//         <TableRowMenu editor={editor} appendTo={menuContainerRef} />
//         <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
//         <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
//       </div>
//     </div>
//   )
// }

// export default BlockEditor
