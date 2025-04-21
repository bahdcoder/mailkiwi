interface StyleThemeGlobalOptions {
  fontFamily?: string
  monospaceFontFamily?: string
}

export function defaultEditorStylesTheme(defaultThemeOptions?: StyleThemeGlobalOptions) {
  const fontFamily =
    defaultThemeOptions?.fontFamily ??
    '-apply-system, system-ui, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'

  const monospaceFontFamily =
    defaultThemeOptions?.monospaceFontFamily ??
    'Consolas,Liberation Mono,Menlo,Courier,monospace'

  const commonStyles = {
    'line-height': '24px', // var(--w-composer-default-paragraph-line-height)
    'word-break': 'break-word',
    'font-size': '1em', // var(--w-composer-default-paragraph-font-size)
    'font-family': fontFamily, // var(--w-composer-default-paragraph-font-family)
    'letter-spacing': '-0.16px', // var(--w-composer-default-paragraph-letter-spacing)
    'font-variation-settings': `"wght" 440`,
    color: '#3D3B39', // var(--w-composer-default-paragraph-color)
  } as const

  return {
    paragraph: {
      ...commonStyles,
      padding: '0.5em 0em 0.5em 0em',
    },
    headingOne: {
      ...commonStyles,
      'line-height': '1.44em',
      'font-size': '2.25em',
      padding: '0.389em 0em 0em',
      'font-weight': '600',
    },
    headingTwo: {
      ...commonStyles,
      padding: '0.389em 0em 0em',
      'font-size': '1.8em',
      'line-height': '1.44em',
      'font-weight': '600',
    },
    headingThree: {
      ...commonStyles,
      padding: '0.389em 0em 0em',
      'font-size': '1.4em',
      'line-height': '1.08em',
      'font-weight': '600',
    },

    link: {
      ...commonStyles,
      'text-decoration': 'underline',
    },
    code: {
      ...commonStyles,
      'font-family': monospaceFontFamily,
    },
    container: {
      width: '100%',
      padding: '0.5em',
      'box-sizing': 'border-box',
      'border-width': '1px',
      'border-style': 'solid',
      'border-color': 'transparent',
    },
    button: {
      ...commonStyles,
      padding: '0.5em 0.8em',
      'border-style': 'solid',
      'border-color': 'transparent',
      'border-width': '1px',
      'box-sizing': 'border-box',
      'background-color': '#000000',
      color: '#fff',
      width: 'fit-content',
      'border-radius': '0.5em',
      display: 'inline-block',
    },
    unorderedList: {
      ...commonStyles,
      padding: '0em 1.8em',
      margin: '0.5em 0em',
      'list-style-type': 'disc',
    },
    orderedList: {
      ...commonStyles,
      padding: '0em 1.8em',
      margin: '0.5em 0em',
      'list-style-type': 'decimal',
    },
    horizontalRule: {
      margin: '1.5em 0em',
    },
  }
}

export function getDefaultStylesForNode<T = Record<string, string>>(
  nodeName: keyof ReturnType<typeof defaultEditorStylesTheme>,
  theme?: StyleThemeGlobalOptions,
) {
  const styles = defaultEditorStylesTheme(theme)[nodeName]
  return { styles } as unknown as Record<string, T>
}
