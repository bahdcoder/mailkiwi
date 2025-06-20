interface DocsContentAreaProps {
  children: React.ReactNode
}

export function DocsContentArea({ children }: DocsContentAreaProps) {
  return (
    <div className="px-4 pt-10 pb-24 sm:px-6 xl:pr-0">
      <p className="flex items-center gap-2 font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
        Core concepts
      </p>

      <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">
        Styling the best paragraphs
      </h1>

      <p className="mt-6 text-base/7 text-gray-700 dark:text-gray-400">
        Building complex components from a constrained set of primitive utilities.
      </p>

      <div className="prose mt-10">{children}</div>

      <footer className="mt-16 text-sm leading-6">
        <div className="flex items-center justify-between gap-2 text-gray-700 dark:text-gray-200">
          <a
            className="group flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"
            href="/docs/upgrade-guide"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <title>Previous</title>
              <path
                fillRule="evenodd"
                d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
            <span>Upgrade guide</span>
          </a>

          <a
            className="group flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"
            href="/docs/hover-focus-states"
          >
            <span>Hover, focus, and other states</span>

            <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <title>Next</title>
              <path
                fillRule="evenodd"
                d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  )
}
