import { useReducer, useRef } from 'react'

// Define actions as an enum for clarity and type safety
export enum FileUploadActionType {
  Open = 'OPEN',
  SetFiles = 'FILES.SET',
  DeleteFile = 'FILE.DELETE',
  ClearFiles = 'FILES.CLEAR',
  ClearRejectedFiles = 'REJECTED_FILES.CLEAR',
  DragOver = 'DROPZONE.DRAG_OVER',
  DragLeave = 'DROPZONE.DRAG_LEAVE',
  Drop = 'DROPZONE.DROP',
  Focus = 'DROPZONE.FOCUS',
  Blur = 'DROPZONE.BLUR',
}

// Define the shape of the state
interface FileUploadState {
  currentState: 'idle' | 'focused' | 'dragging'
  acceptedFiles: File[]
  rejectedFiles: File[]
  isFocused: boolean
  isDisabled: boolean
  allowDrop: boolean
  maxFiles: number
  minFileSize: number
  maxFileSize: number
  accept: string[] | undefined
}

// Define the shape of the actions
type FileUploadAction =
  | { type: FileUploadActionType.Open }
  | { type: FileUploadActionType.SetFiles; accepted: File[]; rejected: File[] }
  | { type: FileUploadActionType.DeleteFile; file: File }
  | { type: FileUploadActionType.ClearFiles }
  | { type: FileUploadActionType.ClearRejectedFiles }
  | { type: FileUploadActionType.DragOver }
  | { type: FileUploadActionType.DragLeave }
  | { type: FileUploadActionType.Drop; files: File[] }
  | { type: FileUploadActionType.Focus }
  | { type: FileUploadActionType.Blur }

// Define the initial state
const initialState: FileUploadState = {
  currentState: 'idle',
  acceptedFiles: [],
  rejectedFiles: [],
  isFocused: false,
  isDisabled: false,
  allowDrop: true,
  maxFiles: 1,
  minFileSize: 0,
  maxFileSize: Number.POSITIVE_INFINITY,
  accept: undefined,
}

function fileUploadReducer(
  state: FileUploadState,
  action: FileUploadAction,
): FileUploadState {
  switch (action.type) {
    case FileUploadActionType.Open:
      return state // No state change for now
    case FileUploadActionType.SetFiles:
      return {
        ...state,
        currentState: 'idle',
        acceptedFiles: [...state.acceptedFiles, ...action.accepted],
        rejectedFiles: [...state.rejectedFiles, ...action.rejected],
      }
    case FileUploadActionType.DeleteFile:
      return {
        ...state,
        acceptedFiles: state.acceptedFiles.filter((file) => file !== action.file),
      }
    case FileUploadActionType.ClearFiles:
      return {
        ...state,
        acceptedFiles: [],
        rejectedFiles: [],
      }
    case FileUploadActionType.ClearRejectedFiles:
      return {
        ...state,
        rejectedFiles: [],
      }
    case FileUploadActionType.DragOver:
      return { ...state, currentState: 'dragging' }
    case FileUploadActionType.DragLeave:
      return { ...state, currentState: 'idle' }
    case FileUploadActionType.Drop:
      return {
        ...state,
        currentState: 'idle',
        acceptedFiles: [...state.acceptedFiles, ...action.files],
      }
    case FileUploadActionType.Focus:
      return { ...state, currentState: 'focused', isFocused: true }
    case FileUploadActionType.Blur:
      return { ...state, currentState: 'idle', isFocused: false }
    default:
      return state
  }
}

export type UseFileUploadProps = Partial<FileUploadState> & {
  onFileChange?: (data: {
    acceptedFiles: File[]
    rejectedFiles: File[]
  }) => void
  onFileAccept?: (data: { files: File[] }) => void
  onFileReject?: (data: { files: File[] }) => void
}

type CommonTriggerProps = React.ComponentPropsWithoutRef<'button'> & {
  [key in `data-${string}`]?: string | number | boolean | undefined
}

export function useFileUpload(initialConfig: UseFileUploadProps) {
  const [state, dispatch] = useReducer(fileUploadReducer, {
    ...initialState,
    ...initialConfig,
  })
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)

  const validateFiles = (files: File[]) => {
    const accepted: File[] = []
    const rejected: File[] = []

    for (const file of files) {
      const isValidType = state.accept?.some((type) =>
        type.startsWith('.')
          ? file.name.endsWith(type)
          : file.type === type || file.type.startsWith(type.replace('*', '')),
      )

      const isValidSize = file.size >= state.minFileSize && file.size <= state.maxFileSize

      if (
        (!state.accept || isValidType) &&
        isValidSize &&
        (state.maxFiles === 1 || accepted.length < state.maxFiles)
      ) {
        accepted.push(file)
      } else {
        rejected.push(file)
      }
    }

    return { accepted, rejected }
  }

  const setFiles = (files: File[]) => {
    if (state.isDisabled) return

    const { accepted, rejected } = validateFiles(files)

    const totalAccepted = [...state.acceptedFiles, ...accepted].slice(0, state.maxFiles)

    dispatch({
      type: FileUploadActionType.SetFiles,
      accepted: totalAccepted,
      rejected,
    })

    initialConfig.onFileChange?.({
      acceptedFiles: totalAccepted,
      rejectedFiles: rejected,
    })
    if (accepted.length) initialConfig.onFileAccept?.({ files: accepted })
    if (rejected.length) initialConfig.onFileReject?.({ files: rejected })
  }

  const openFilePicker = () => {
    if (state.isDisabled) return
    hiddenInputRef.current?.click()
  }

  const deleteFile = (file: File) => {
    if (state.isDisabled) return
    dispatch({ type: FileUploadActionType.DeleteFile, file })
  }

  // Attribute getters
  const getRootProps = () => ({
    role: 'region',
    'aria-label': 'File Upload Area',
    'data-disabled': state.isDisabled ? true : undefined,
    'data-dragging': state.currentState === 'dragging' ? true : undefined,
  })

  const getDropzoneProps = () => ({
    role: 'button',
    'aria-label': 'Drop files here',
    'aria-disabled': state.isDisabled,
    'data-disabled': state.isDisabled ? true : undefined,
    'data-dragging': state.currentState === 'dragging' ? true : undefined,
    onClick: openFilePicker,
    onDragOver: (event: React.DragEvent) => {
      if (state.isDisabled || !state.allowDrop) return
      event.preventDefault()
      dispatch({ type: FileUploadActionType.DragOver })
    },
    onDragLeave: (event: React.DragEvent) => {
      if (state.isDisabled || !state.allowDrop) return
      dispatch({ type: FileUploadActionType.DragLeave })
    },
    onDrop: (event: React.DragEvent) => {
      if (state.isDisabled || !state.allowDrop) return
      event.preventDefault()
      const files = Array.from(event.dataTransfer.files)
      setFiles(files)
    },
  })

  const getHiddenInputProps = () => ({
    ref: hiddenInputRef,
    type: 'file',
    multiple: state.maxFiles > 1,
    accept: state.accept?.join(','),
    onClick: (event: React.MouseEvent<HTMLInputElement>) => {
      event.stopPropagation()
      ;(event.target as HTMLInputElement).value = '' // Reset value for re-selection
    },
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      if (state.isDisabled) return
      const files = Array.from(event.target.files || [])
      setFiles(files)
    },
    style: { display: 'none' },
  })

  const getTriggerProps = (): React.ComponentPropsWithoutRef<'button'> => ({
    type: 'button',
    'aria-label': 'Upload files',
    'aria-disabled': state.isDisabled,
    onClick: openFilePicker,
  })

  const getItemProps = (file: File) => ({
    id: `file-item-${file.name}`,
    'data-disabled': state.isDisabled ? true : undefined,
  })

  const getItemDeleteTriggerProps = (file: File): CommonTriggerProps => ({
    type: 'button',
    'aria-label': `Delete ${file.name}`,
    onClick: () => deleteFile(file),
  })

  const getClearTriggerProps = (): CommonTriggerProps => ({
    type: 'button',
    'aria-label': 'Clear all files',
    hidden: state.acceptedFiles.length === 0,
    'data-disabled': state.isDisabled ? true : undefined,
    onClick: () => dispatch({ type: FileUploadActionType.ClearFiles }),
  })

  return {
    state,
    openFilePicker,
    deleteFile,
    setFiles,
    getRootProps,
    getDropzoneProps,
    getHiddenInputProps,
    getTriggerProps,
    getItemProps,
    getItemDeleteTriggerProps,
    getClearTriggerProps,
  }
}
