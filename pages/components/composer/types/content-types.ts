export type ContentTypePickerOption = {
  label: string
  id: string
  type: 'option'
  disabled: () => boolean
  isActive: () => boolean
  onClick: () => void
  icon: React.ReactNode
}

export type ContentTypePickerCategory = {
  id: string
  label: string
  type: 'category'
}

export type ContentPickerOptions = Array<
  ContentTypePickerOption | ContentTypePickerCategory
>
