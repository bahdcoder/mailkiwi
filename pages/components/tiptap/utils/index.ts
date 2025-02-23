import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function randomElement<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)]
}

export * from './cssVar.js'
export * from './getConnectionText.js'
export * from './getRenderContainer.js'
export * from './isCustomNodeSelected.js'
export * from './isTextSelected.js'
