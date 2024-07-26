export class ArgParser {
  private args: { [key: string]: string } = {}

  constructor(argv: string[]) {
    this.parseArgs(argv)
  }

  private parseArgs(argv: string[]): void {
    for (let i = 2; i < argv.length; i++) {
      const arg = argv[i]
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=')
        if (key && value) {
          this.args[key] = value
        }
      }
    }
  }

  public get(key: string, defaultValue?: string): string {
    return this.args[key] ?? defaultValue
  }

  public getAll(): { [key: string]: string } {
    return { ...this.args }
  }
}
