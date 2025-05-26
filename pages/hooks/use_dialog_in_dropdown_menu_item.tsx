import React from 'react'

export function useDialogInDropdownMenuItem() {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [hasOpenDialog, setHasOpenDialog] = React.useState(false)

  const dropdownTriggerRef = React.useRef<HTMLButtonElement | null>(null)
  const focusRef = React.useRef<HTMLButtonElement | null>(null)

  function handleDialogItemSelect(event: Event) {
    event.preventDefault()

    focusRef.current = dropdownTriggerRef.current
  }

  function handleDialogItemOpenChange(open: boolean) {
    setHasOpenDialog(open)
    if (open === false) {
      setDropdownOpen(false)
    }
  }

  function onCloseAutoFocus(event: Event) {
    if (focusRef.current) {
      focusRef.current.focus()
      focusRef.current = null
      event.preventDefault()
    }
  }

  return {
    focusRef,
    dropdownOpen,
    hasOpenDialog,
    setDropdownOpen,
    setHasOpenDialog,
    dropdownTriggerRef,
    handleDialogItemSelect,
    handleDialogItemOpenChange,
    onCloseAutoFocus,
  }
}
