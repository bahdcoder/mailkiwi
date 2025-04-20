#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ICONS_DIR = path.join(__dirname, '../pages/components/icons')

// Skip these files
const SKIP_FILES = ['utils', 'index.ts']

// Function to convert camelCase to Title Case with spaces
function camelCaseToTitleCase(str) {
  // Handle special cases
  if (str === 'InfoCircleSolid') return 'Info Circle'
  if (str === 'MoreVert') return 'More Options'
  if (str === 'NavArrowDown') return 'Arrow Down'
  if (str === 'NavArrowUp') return 'Arrow Up'
  if (str === 'NavArrowLeft') return 'Arrow Left'
  if (str === 'NavArrowRight') return 'Arrow Right'
  if (str === 'MailOut') return 'Mail Send'
  if (str === 'MailOpen') return 'Mail Open'

  // Regular conversion
  return (
    str
      // Insert a space before all uppercase letters
      .replace(/([A-Z])/g, ' $1')
      // Remove the space at the beginning
      .replace(/^./, (str) => str.trim())
      // Capitalize the first letter of each word
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1))
  )
}

async function processFile(filePath) {
  // Skip if not a .tsx file
  if (!filePath.endsWith('.svg.tsx')) {
    return
  }

  const content = await readFile(filePath, 'utf8')

  // Extract the icon name from the filename
  const filename = path.basename(filePath, '.svg.tsx')
  const iconName = filename
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  const accessibleTitle = camelCaseToTitleCase(iconName)

  // Create a completely new file with the correct structure
  const newContent = `import React from "react"

export const ${iconName}Icon = React.forwardRef<
  React.ElementRef<"svg">,
  React.ComponentPropsWithoutRef<"svg">
>((props, forwardedRef) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="${accessibleTitle}"
      {...props}
      ref={forwardedRef}
    >
      <title>${accessibleTitle}</title>
      ${content.match(/<path[^>]*>.*?<\/path>/gs)?.join('\n      ') || ''}
    </svg>
  )
})

${iconName}Icon.displayName = "${iconName}Icon"
`

  // Write the updated content back to the file
  await writeFile(filePath, newContent)
  console.log(`Updated ${filePath}`)
}

async function processDirectory(directory) {
  const entries = await readdir(directory)

  for (const entry of entries) {
    if (SKIP_FILES.includes(entry)) {
      continue
    }

    const fullPath = path.join(directory, entry)
    const stats = await stat(fullPath)

    if (stats.isDirectory()) {
      await processDirectory(fullPath)
    } else {
      await processFile(fullPath)
    }
  }
}

async function main() {
  try {
    await processDirectory(ICONS_DIR)
    console.log('All SVG icons have been processed')
  } catch (error) {
    console.error('Error processing SVG icons:', error)
    process.exit(1)
  }
}

main()
