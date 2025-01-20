import { CommandButton } from "./CommandButton.js"
import { Command, MenuListProps } from "./types.js"
import { DropdownButton } from "@/pages/components/tiptap/ui/Dropdown/Dropdown.jsx"
import { Icon } from "@/pages/components/tiptap/ui/Icon.js"
import { Surface } from "@/pages/components/tiptap/ui/Surface.js"
import { Text } from "@kibamail/owly/text"
import cn from "classnames"
import React, { useCallback, useEffect, useRef, useState } from "react"

export const MenuList = React.forwardRef((props: MenuListProps, ref) => {
  const scrollContainer = useRef<HTMLDivElement>(null)
  const activeItem = useRef<HTMLButtonElement>(null)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)

  // Anytime the groups change, i.e. the user types to narrow it down, we want to
  // reset the current selection to the first menu item
  useEffect(() => {
    setSelectedGroupIndex(0)
    setSelectedCommandIndex(0)
  }, [props.items])

  const selectItem = useCallback(
    (groupIndex: number, commandIndex: number) => {
      const command = props.items[groupIndex].commands[commandIndex]
      props.command(command)
    },
    [props],
  )

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
      if (event.key === "ArrowDown") {
        if (!props.items.length) {
          return false
        }

        const commands = props.items[selectedGroupIndex].commands

        let newCommandIndex = selectedCommandIndex + 1
        let newGroupIndex = selectedGroupIndex

        if (commands.length - 1 < newCommandIndex) {
          newCommandIndex = 0
          newGroupIndex = selectedGroupIndex + 1
        }

        if (props.items.length - 1 < newGroupIndex) {
          newGroupIndex = 0
        }

        setSelectedCommandIndex(newCommandIndex)
        setSelectedGroupIndex(newGroupIndex)

        return true
      }

      if (event.key === "ArrowUp") {
        if (!props.items.length) {
          return false
        }

        let newCommandIndex = selectedCommandIndex - 1
        let newGroupIndex = selectedGroupIndex

        if (newCommandIndex < 0) {
          newGroupIndex = selectedGroupIndex - 1
          newCommandIndex = props.items[newGroupIndex]?.commands.length - 1 || 0
        }

        if (newGroupIndex < 0) {
          newGroupIndex = props.items.length - 1
          newCommandIndex = props.items[newGroupIndex].commands.length - 1
        }

        setSelectedCommandIndex(newCommandIndex)
        setSelectedGroupIndex(newGroupIndex)

        return true
      }

      if (event.key === "Enter") {
        if (
          !props.items.length ||
          selectedGroupIndex === -1 ||
          selectedCommandIndex === -1
        ) {
          return false
        }

        selectItem(selectedGroupIndex, selectedCommandIndex)

        return true
      }

      return false
    },
  }))

  useEffect(() => {
    if (activeItem.current && scrollContainer.current) {
      const offsetTop = activeItem.current.offsetTop
      const offsetHeight = activeItem.current.offsetHeight

      scrollContainer.current.scrollTop = offsetTop - offsetHeight
    }
  }, [selectedCommandIndex, selectedGroupIndex])

  const createCommandClickHandler = useCallback(
    (groupIndex: number, commandIndex: number) => {
      return () => {
        selectItem(groupIndex, commandIndex)
      }
    },
    [selectItem],
  )

  if (!props.items.length) {
    return null
  }

  return (
    <div className="w-full max-w-40 rounded-xl border kb-border-tertiary p-1">
      {props.items.map((group, groupIndex) => (
        <div
          key={group.title}
          className={cn({
            "border-b kb-border-tertiary": groupIndex !== props.items.length - 1,
          })}
        >
          <div className="grid grid-cols-1 gap-1">
            {group.commands.map((command, commandIndex) => (
              <button
                ref={
                  selectedGroupIndex === groupIndex &&
                  selectedCommandIndex === commandIndex
                    ? activeItem
                    : null
                }
                onClick={createCommandClickHandler(groupIndex, commandIndex)}
                className={cn(
                  "flex items-center w-full h-8 box-border p-2 gap-1 hover:bg-[var(--background-secondary)] cursor-pointer rounded-lg kb-reset transition ease-in-out duration-100",
                  {
                    "bg-[var(--background-secondary)]":
                      selectedGroupIndex === groupIndex &&
                      selectedCommandIndex === commandIndex,
                  },
                )}
              >
                {command.icon}
                <Text>{command.label}</Text>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <Surface
      ref={scrollContainer}
      className="text-black max-h-[min(80vh,24rem)] overflow-auto flex-wrap mb-8 p-2"
    >
      <div className="grid grid-cols-1 gap-0.5">
        {props.items.map((group, groupIndex: number) => (
          <React.Fragment key={`${group.title}-wrapper`}>
            <div
              className="text-neutral-500 text-[0.65rem] col-[1/-1] mx-2 mt-4 font-semibold tracking-wider select-none uppercase first:mt-0.5"
              key={`${group.title}`}
            >
              {group.title}
            </div>
            {group.commands.map((command: Command, commandIndex: number) => (
              <DropdownButton
                key={`${command.label}`}
                ref={
                  selectedGroupIndex === groupIndex &&
                  selectedCommandIndex === commandIndex
                    ? activeItem
                    : null
                }
                isActive={
                  selectedGroupIndex === groupIndex &&
                  selectedCommandIndex === commandIndex
                }
                onClick={createCommandClickHandler(groupIndex, commandIndex)}
              >
                <Icon name={command.iconName} className="mr-1" />
                {command.label}
              </DropdownButton>
            ))}
          </React.Fragment>
        ))}
      </div>
    </Surface>
  )
})

MenuList.displayName = "MenuList"

export default MenuList
