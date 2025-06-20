export function DocsFooter() {
  return (
    <footer className="bg-white text-sm/loose text-gray-950 dark:bg-gray-950 dark:text-white">
      <div className="flex gap-4 p-4 md:hidden max-w-2xl lg:max-w-5xl">
        <div className="flex flex-1 flex-col gap-10">
          <div>
            <h3 className="font-semibold">Learn</h3>
            <ul className="mt-4 grid gap-4">
              <li>
                <a className="hover:underline" href="/docs">
                  Documentation
                </a>
              </li>
              <li>
                <a className="hover:underline" href="/showcase">
                  Showcase
                </a>
              </li>
              <li>
                <a className="hover:underline" href="/blog">
                  Blog
                </a>
              </li>
              <li>
                <a className="hover:underline" href="https://play.tailwindcss.com/">
                  Playground
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Resources</h3>
            <ul className="mt-4 grid gap-4">
              <li>
                <a className="hover:underline" href="https://www.refactoringui.com">
                  Refactoring UI
                </a>
              </li>
              <li>
                <a className="hover:underline" href="https://headlessui.com">
                  Headless UI
                </a>
              </li>
              <li>
                <a className="hover:underline" href="https://heroicons.com">
                  Heroicons
                </a>
              </li>
              <li>
                <a className="hover:underline" href="https://heropatterns.com">
                  Hero Patterns
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-10">
          <div>
            <h3 className="mb-2 font-semibold">
              <a href="/plus?ref=footer" className="hover:underline">
                Tailwind Plus
              </a>
            </h3>
            <ul className="mt-4 grid gap-4">
              <li>
                <a href="/plus/ui-blocks?ref=footer" className="hover:underline">
                  UI Blocks
                </a>
              </li>
              <li>
                <a href="/plus/templates?ref=footer" className="hover:underline">
                  Templates
                </a>
              </li>
              <li>
                <a href="/plus/ui-kit?ref=footer" className="hover:underline">
                  UI Kit
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Community</h3>
            <ul className="mt-4 grid gap-4">
              <li>
                <a
                  className="hover:underline"
                  href="https://github.com/tailwindlabs/tailwindcss"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a className="hover:underline" href="https://tailwindcss.com/discord">
                  Discord
                </a>
              </li>
              <li>
                <a className="hover:underline" href="https://x.com/tailwindcss">
                  X
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto hidden w-full grid-cols-4 justify-between gap-y-0 md:grid md:grid-cols-4 md:gap-6 md:gap-x-4 lg:gap-8 max-w-2xl lg:max-w-5xl">
        <div className="border-x border-b border-gray-950/5 py-10 pl-2 not-md:border-0 md:border-b-0 dark:border-white/10">
          <h3 className="font-semibold">Learn</h3>
          <ul className="mt-4 grid gap-4">
            <li>
              <a className="hover:underline" href="/docs">
                Documentation
              </a>
            </li>
            <li>
              <a className="hover:underline" href="/showcase">
                Showcase
              </a>
            </li>
            <li>
              <a className="hover:underline" href="/blog">
                Blog
              </a>
            </li>
            <li>
              <a className="hover:underline" href="https://play.tailwindcss.com/">
                Playground
              </a>
            </li>
          </ul>
        </div>
        <div className="border-x border-b border-gray-950/5 py-10 pl-2 not-md:border-0 md:border-b-0 dark:border-white/10">
          <h3 className="mb-2 font-semibold">
            <a href="/plus?ref=footer" className="hover:underline">
              Tailwind Plus
            </a>
          </h3>
          <ul className="mt-4 grid gap-4">
            <li>
              <a href="/plus/ui-blocks?ref=footer" className="hover:underline">
                UI Blocks
              </a>
            </li>
            <li>
              <a href="/plus/templates?ref=footer" className="hover:underline">
                Templates
              </a>
            </li>
            <li>
              <a href="/plus/ui-kit?ref=footer" className="hover:underline">
                UI Kit
              </a>
            </li>
          </ul>
        </div>
        <div className="border-x border-b border-gray-950/5 py-10 pl-2 not-md:border-0 sm:border-b-0 dark:border-white/10">
          <h3 className="font-semibold">Resources</h3>
          <ul className="mt-4 grid gap-4">
            <li>
              <a className="hover:underline" href="https://www.refactoringui.com">
                Refactoring UI
              </a>
            </li>
            <li>
              <a className="hover:underline" href="https://headlessui.com">
                Headless UI
              </a>
            </li>
            <li>
              <a className="hover:underline" href="https://heroicons.com">
                Heroicons
              </a>
            </li>
            <li>
              <a className="hover:underline" href="https://heropatterns.com">
                Hero Patterns
              </a>
            </li>
          </ul>
        </div>
        <div className="border-x border-gray-950/5 py-10 pl-2 not-md:border-0 dark:border-white/10">
          <h3 className="font-semibold">Community</h3>
          <ul className="mt-4 grid gap-4">
            <li>
              <a
                className="hover:underline"
                href="https://github.com/tailwindlabs/tailwindcss"
              >
                GitHub
              </a>
            </li>
            <li>
              <a className="hover:underline" href="https://tailwindcss.com/discord">
                Discord
              </a>
            </li>
            <li>
              <a className="hover:underline" href="https://x.com/tailwindcss">
                X
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
