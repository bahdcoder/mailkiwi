import { CancelIcon } from '#root/pages/components/icons/cancel.svg.jsx'
import { CheckIcon } from '#root/pages/components/icons/check.svg.jsx'
import { PlusIcon } from '#root/pages/components/icons/plus.svg.jsx'
import { Checkbox } from '@kibamail/owly/checkbox'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import cn from 'classnames'
import { useCombobox, useMultipleSelection } from 'downshift'
import React, { useEffect } from 'react'

export type ComboboxItem = {
  id: string
  label: string
  new?: boolean
  value?: string
}

interface TagsComboboxProps {
  defaultValue?: Omit<ComboboxItem, 'new'>[]
  name?: string
  items: Omit<ComboboxItem, 'new'>[]
  maxWidth?: number
  onChange?: (value: ComboboxItem[]) => void
}

export function TagsCombobox({
  items: defaultAllItems,
  defaultValue,
  onChange,
  maxWidth,
}: TagsComboboxProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [selectedItems, setSelectedItems] = React.useState<ComboboxItem[]>(
    defaultValue ?? [],
  )
  const [allItems, setAllItems] = React.useState<ComboboxItem[]>(defaultAllItems)
  const items = React.useMemo(() => searchItems(inputValue), [inputValue])

  function searchItems(inputValue: string) {
    const lowerCasedInputValue = inputValue.toLowerCase()

    return allItems.filter(function filterBook(item) {
      return item.label.toLowerCase().includes(lowerCasedInputValue)
    })
  }

  useEffect(() => {
    onChange?.(selectedItems)
  }, [selectedItems, onChange])

  const { getSelectedItemProps, getDropdownProps, removeSelectedItem } =
    useMultipleSelection({
      selectedItems,
      onStateChange({ selectedItems: newSelectedItems, type }) {
        switch (type) {
          case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownBackspace:
          case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownDelete:
          case useMultipleSelection.stateChangeTypes.DropdownKeyDownBackspace:
          case useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem:
            setSelectedItems(newSelectedItems ?? [])
            break
          default:
            break
        }
      },
    })
  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    selectedItem,
  } = useCombobox({
    items,
    itemToString(item) {
      return item ? item.label : ''
    },
    defaultHighlightedIndex: 0,
    selectedItem: null,
    inputValue,
    stateReducer(state, actionAndChanges) {
      const { changes, type } = actionAndChanges

      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: true,
            highlightedIndex: state.highlightedIndex,
          }
        default:
          return changes
      }
    },
    onStateChange({ inputValue: newInputValue, type, selectedItem: newSelectedItem }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          if (newSelectedItem) {
            if (selectedItems.includes(newSelectedItem)) {
              setSelectedItems(selectedItems.filter((item) => item !== newSelectedItem))
            } else {
              setSelectedItems([...selectedItems, newSelectedItem])
            }

            setInputValue('')
          }
          break

        case useCombobox.stateChangeTypes.InputChange:
          setInputValue(newInputValue ?? '')

          break
        default:
          break
      }
    },
  })

  function onCreateNewItem() {
    const item = { id: inputValue, label: inputValue, new: true }
    setAllItems((current) => [...current, item])

    setInputValue('')
    setSelectedItems((current) => [...current, item])
  }

  return (
    <div className="w-full" style={{ maxWidth }}>
      <TextField.Root
        placeholder="Search tags or type to add a new tag"
        className="w-full"
        {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
      >
        <TextField.Label {...getLabelProps()}>Select tags</TextField.Label>
      </TextField.Root>
      <ul
        className={cn(
          'kb-combobox-popover-content absolute p-1 w-[inherit] bg-(--background-primary) mt-1 rounded-xl border kb-border-tertiary shadow-[0px_16px_24px_-8px_var(--black-10)] max-h-60 overflow-scroll z-10',
          { hidden: !isOpen },
        )}
        style={{ maxWidth }}
        data-state={isOpen ? 'open' : 'closed'}
        {...getMenuProps()}
      >
        {isOpen ? (
          <>
            {items.map((item, index) => {
              return (
                <li
                  className={cn(
                    'h-9 box-border rounded-lg flex items-center cursor-pointer px-2 transition-[background] ease-in-out',
                    highlightedIndex === index && 'kb-background-secondary',
                    selectedItem === item && 'font-bold',
                  )}
                  key={item.id}
                  {...getItemProps({ item, index })}
                >
                  <Checkbox
                    className="mr-2"
                    checked={selectedItems.includes(item)}
                    variant="circle"
                  />
                  <Text className="kb-content-secondary">{item.label}</Text>

                  {selectedItems.includes(item) ? (
                    <CheckIcon className="ml-auto w-5 h-5" />
                  ) : null}
                </li>
              )
            })}

            {items.length === 0 && !inputValue ? (
              <div className="flex items-center justify-center py-2">
                <Text className="kb-content-tertiary">
                  No tags yet. Type a new tag to add one.
                </Text>
              </div>
            ) : null}

            {inputValue ? (
              <>
                {items.length > 0 ? (
                  <div aria-hidden className="h-px my-1 kb-background-secondary w-full" />
                ) : null}
                <li
                  onClick={onCreateNewItem}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onCreateNewItem()
                    }
                  }}
                  aria-label={`Create new tag "${inputValue}"`}
                  className="h-9 box-border select-none bg-(--background-primary) rounded-lg hover:bg-(--background-secondary) flex items-center cursor-pointer px-2 transition-[background] ease-in-out"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  <Text className="kb-content-secondary">
                    Create new tag "{inputValue}"
                  </Text>
                </li>
              </>
            ) : null}
          </>
        ) : null}
      </ul>

      <div className="mt-2 flex flex-wrap gap-2">
        {selectedItems.map(function renderSelectedItem(selectedItemForRender, index) {
          return (
            <span
              className="flex items-center border kb-border-tertiary font-medium bg-(--background-primary) px-2 py-1 rounded-lg shadow-[0px_2px_0px_0px_var(--white-5)_inset,0px_1px_0px_0px_var(--black-10)]"
              key={`selected-item-${
                selectedItemForRender.id || selectedItemForRender.value
              }`}
              {...getSelectedItemProps({
                selectedItem: selectedItemForRender,
                index,
              })}
            >
              <Text className="kb-content-secondary">{selectedItemForRender.label}</Text>
              <button type="button" className="kb-reset">
                <CancelIcon
                  className="kb-content-disabled ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSelectedItem(selectedItemForRender)
                  }}
                />
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}
