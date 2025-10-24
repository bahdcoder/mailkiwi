export function DocsHeader() {
  return (
    <div className="fixed inset-x-0 top-0 z-10 border-b border-gray-950/5 dark:border-white/10">
      <div className="bg-white dark:bg-gray-950">
        <div className="flex h-14 items-center justify-between gap-8 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <a href="/">
              <img src="/logos/full-light.svg" className="h-8" alt="Kibamail Logo" />
            </a>
          </div>

          <div className="flex items-center gap-6 max-md:hidden">
            <a className="text-sm/6 text-gray-950 dark:text-white" href="/docs">
              Docs
            </a>
            <a className="text-sm/6 text-gray-950 dark:text-white" href="/blog">
              Blog
            </a>
            <a className="text-sm/6 text-gray-950 dark:text-white" href="/showcase">
              Showcase
            </a>

            <a
              aria-label="GitHub repository"
              href="https://github.com/tailwindlabs/tailwindcss"
            >
              <svg
                viewBox="0 0 20 20"
                className="size-5 fill-black/40 dark:fill-gray-400"
              >
                <title>Github </title>
                <path d="M10 0C4.475 0 0 4.475 0 10a9.994 9.994 0 006.838 9.488c.5.087.687-.213.687-.476 0-.237-.013-1.024-.013-1.862-2.512.463-3.162-.612-3.362-1.175-.113-.287-.6-1.175-1.025-1.412-.35-.188-.85-.65-.013-.663.788-.013 1.35.725 1.538 1.025.9 1.512 2.337 1.087 2.912.825.088-.65.35-1.088.638-1.338-2.225-.25-4.55-1.112-4.55-4.937 0-1.088.387-1.987 1.025-2.688-.1-.25-.45-1.274.1-2.65 0 0 .837-.262 2.75 1.026a9.28 9.28 0 012.5-.338c.85 0 1.7.112 2.5.337 1.912-1.3 2.75-1.024 2.75-1.024.55 1.375.2 2.4.1 2.65.637.7 1.025 1.587 1.025 2.687 0 3.838-2.337 4.688-4.562 4.938.362.312.675.912.675 1.85 0 1.337-.013 2.412-.013 2.75 0 .262.188.574.688.474A10.016 10.016 0 0020 10c0-5.525-4.475-10-10-10z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex h-14 items-center border-t border-gray-950/5 bg-white px-4 sm:px-6 lg:hidden dark:border-white/10 dark:bg-gray-950">
          <button
            className="relative inline-grid size-7 place-items-center rounded-md text-gray-950 hover:bg-gray-950/5 dark:text-white dark:hover:bg-white/10 -ml-1.5"
            type="button"
          >
            <span className="absolute top-1/2 left-1/2 size-11 -translate-1/2 pointer-fine:hidden" />

            <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <title>Open navigation menu</title>
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 0 1 2.75 4h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 6.5a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
