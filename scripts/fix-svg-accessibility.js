#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ICONS_DIR = path.join(__dirname, '../pages/components/icons')
const UTILS_PATH = './utils/add-title-to-svg'

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

  // Skip if already using addTitleToSvg
  if (content.includes('addTitleToSvg')) {
    console.log(`Skipping ${filePath} - already using addTitleToSvg`)
    return
  }

  // Extract the icon name
  const iconNameMatch = content.match(/export const (\w+)Icon/)
  if (!iconNameMatch) {
    console.log(`Skipping ${filePath} - could not extract icon name`)
    return
  }

  const iconName = iconNameMatch[1]
  const accessibleTitle = camelCaseToTitleCase(iconName)

  // Create the base component name
  const baseComponentName = `${iconName}IconBase`

  // Replace the component definition
  let newContent = content.replace(
    /import React from ['"]react['"]\n\nexport const (\w+)Icon = React\.forwardRef</,
    `import React from 'react'\nimport { addTitleToSvg } from '${UTILS_PATH}'\n\nconst ${baseComponentName} = React.forwardRef<`,
  )

  // Add the displayName and export with title
  newContent = newContent.replace(
    /}\)$/,
    `})\n\n${baseComponentName}.displayName = '${baseComponentName}'\n\nexport const ${iconName}Icon = addTitleToSvg(${baseComponentName}, '${accessibleTitle}')`,
  )

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
