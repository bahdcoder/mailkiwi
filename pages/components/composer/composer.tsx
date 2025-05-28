import './composer.styles.css'
import LinkMenu from '#root/pages/components/composer/components/link-menu/link-menu.jsx'
import { TextMenu } from '#root/pages/components/composer/components/text-menu/text-menu.jsx'
import { useTextmenuStates } from '#root/pages/components/composer/components/text-menu/use-text-menu-states.js'
import { ButtonMenu } from '#root/pages/components/composer/extensions/Button/button-menu.jsx'
import { ContainerMenu } from '#root/pages/components/composer/extensions/Container/container-menu.jsx'
import ImageBlockMenu from '#root/pages/components/composer/extensions/ImageBlock/components/ImageBlockMenu.jsx'
import type { ShouldShowProps } from '#root/pages/components/tiptap/menus/types.js'
import { type Editor, EditorContent } from '@tiptap/react'
import React, { useCallback } from 'react'

interface ComposerMenusProps {
  editor: Editor
  container: React.MutableRefObject<HTMLDivElement | null>
}

function ComposerMenus({ editor, container }: ComposerMenusProps) {
  const { shouldShow } = useTextmenuStates(editor)

  const shouldShowTextMenu = useCallback(
    ({ view, from }: ShouldShowProps) => {
      return shouldShow({ view, from }) && !editor.isActive('button')
    },
    [editor, shouldShow],
  )

  const shouldShowNodeTextEditingMenu = useCallback(
    ({ view, from }: ShouldShowProps) => {
      // TODO: Add more conditions for other blocks like container, columns, etc
      return shouldShow({ view, from }) && editor.isActive('button')
    },
    [editor, shouldShow],
  )

  return (
    <>
      <TextMenu
        editor={editor}
        pluginKey="textMenu"
        shouldShow={shouldShowTextMenu}
        tippyProps={{ placement: 'top' }}
      />
      <ButtonMenu editor={editor} appendTo={container} />
      <TextMenu
        editor={editor}
        pluginKey="buttonTextMenu"
        tippyProps={{ placement: 'bottom' }}
        shouldShow={shouldShowNodeTextEditingMenu}
      />
      <LinkMenu editor={editor} appendTo={container} />
      <ImageBlockMenu editor={editor} appendTo={container} />
      <ContainerMenu editor={editor} appendTo={container} />
      {/* <ContentItemMenu editor={editor} /> */}
    </>
  )
}

export interface ComposerProps {
  editor: Editor
}

export function Composer({ editor }: ComposerProps) {
  const menuContainerRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <div className="w-full flex items-center justify-center h-full">
      <div
        className="grow h-full p-6 overflow-y-auto w-composer-inter"
        ref={menuContainerRef}
      >
        <div className="w-full max-w-180 mx-auto h-full flex flex-col gap-2">
          {/* TODO: Make this an auto expandable textarea */}
          {/* <textarea
            className="text-4xl font-bold text-(--content-secondary) placeholder:text-(--content-tertiary-inverse) bg-transparent border-none focus:outline-none focus:border-none w-full w-composer-inter resize-none"
            placeholder="Broadcast title"
          /> */}

          <div className="w-full w-composer-content grow p-8 bg-white shadow-[0px_16px_24px_-8px_var(--black-10)]">
            <ComposerMenus container={menuContainerRef} editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  )
}
