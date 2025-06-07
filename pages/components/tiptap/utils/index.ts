import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export * from './getRenderContainer.js'
export * from './isCustomNodeSelected.js'
export * from './isTextSelected.js'
