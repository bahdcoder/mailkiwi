import { fixTypescriptImportsCommand } from '#root/cli/commands/fix_typescript_imports_command.js'
import { run } from '@drizzle-team/brocli'

await run([fixTypescriptImportsCommand])
