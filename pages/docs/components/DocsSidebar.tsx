import { CodeBlockIcon } from '#root/pages/components/icons/codeblock.svg.jsx'
import { MailIcon } from '#root/pages/components/icons/mail.svg.jsx'
import { LinkIcon } from '#root/pages/components/icons/link.svg.jsx'
import { NotesIcon } from '#root/pages/components/icons/notes.svg.jsx'
import { BookStackIcon } from '#root/pages/components/icons/book-stack.svg.jsx'
import { usePageContext } from 'vike-react/usePageContext'
import productDocs from '../sidebar-items/product-docs.jsx'
import developerDocs from '../sidebar-items/developer-docs.jsx'
import apiDocs from '../sidebar-items/api-docs.jsx'
import guides from '../sidebar-items/guides.jsx'
import academy from '../sidebar-items/academy.jsx'

export function DocsSidebar() {
  const pageContext = usePageContext()
  const currentUrl = pageContext.urlPathname || ''

  // Determine which docs group is active based on URL
  const getActiveGroup = () => {
    if (currentUrl.startsWith('/docs/products')) return 'products'
    if (currentUrl.startsWith('/docs/developers')) return 'developers'
    if (currentUrl.startsWith('/docs/api')) return 'api'
    if (currentUrl.startsWith('/docs/guides')) return 'guides'
    if (currentUrl.startsWith('/docs/academy')) return 'academy'
    return 'products' // default
  }

  const activeGroup = getActiveGroup()

  // Get the appropriate sidebar items
  const getSidebarItems = () => {
    switch (activeGroup) {
      case 'products':
        return productDocs
      case 'developers':
        return developerDocs
      case 'api':
        return apiDocs
      case 'guides':
        return guides
      case 'academy':
        return academy
      default:
        return productDocs
    }
  }

  const sidebarItems = getSidebarItems()

  const getBasePath = () => {
    switch (activeGroup) {
      case 'products':
        return '/docs/products'
      case 'developers':
        return '/docs/developers'
      case 'api':
        return '/docs/api'
      case 'guides':
        return '/docs/guides'
      case 'academy':
        return '/docs/academy'
      default:
        return '/docs/products'
    }
  }

  const basePath = getBasePath()

  const navGroups = [
    { href: '/docs/products', icon: MailIcon, label: 'Products', key: 'products' },
    {
      href: '/docs/developers',
      icon: CodeBlockIcon,
      label: 'Developers',
      key: 'developers',
    },
    { href: '/docs/api', icon: LinkIcon, label: 'API reference', key: 'api' },
    { href: '/docs/guides', icon: NotesIcon, label: 'Guides', key: 'guides' },
    { href: '/docs/academy', icon: BookStackIcon, label: 'Academy', key: 'academy' },
  ]

  return (
    <div className="relative col-start-1 row-span-full row-start-1 max-lg:hidden">
      <div className="absolute inset-0">
        <div className="sticky top-14.25 bottom-0 left-0 h-full max-h-[calc(100dvh-(var(--spacing)*14.25))] w-2xs overflow-y-auto p-6">
          <div>
            <nav className="flex flex-col gap-8">
              <ul className="flex flex-col gap-2">
                {navGroups.map((group) => {
                  const Icon = group.icon
                  const isActive = activeGroup === group.key
                  return (
                    <li key={group.key}>
                      <a
                        className="group inline-flex items-center gap-3 text-base/8 text-gray-600 sm:text-sm/7 dark:text-gray-300 **:data-outline:stroke-gray-400 dark:**:data-outline:stroke-gray-500 **:[svg]:first:size-5 **:[svg]:first:sm:size-4 hover:text-gray-950 hover:**:data-highlight:fill-gray-300 hover:**:data-outline:stroke-gray-950 dark:hover:text-white dark:hover:**:data-highlight:fill-gray-600 dark:hover:**:data-outline:stroke-white aria-[current]:font-semibold aria-[current]:text-gray-950 aria-[current]:**:data-highlight:fill-gray-300 aria-[current]:**:data-outline:stroke-gray-950 dark:aria-[current]:text-white dark:aria-[current]:**:data-highlight:fill-gray-600 dark:aria-[current]:**:data-outline:stroke-white"
                        href={group.href}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon />
                        {group.label}
                      </a>
                    </li>
                  )
                })}
              </ul>

              {Object.entries(sidebarItems).map(([sectionName, section]) => (
                <div
                  key={sectionName}
                  className="flex flex-col gap-3"
                  data-autoscroll="true"
                >
                  <h3 className="font-mono text-sm/6 font-medium tracking-widest text-gray-500 uppercase sm:text-xs/6 dark:text-gray-400">
                    {sectionName}
                  </h3>
                  <ul className="flex flex-col gap-2 border-l dark:border-[color-mix(in_oklab,_var(--color-gray-950),white_20%)] border-[color-mix(in_oklab,_var(--color-gray-950),white_90%)]">
                    {section.routes.map(
                      ([title, href, method]: readonly [string, string, string?]) => {
                        const fullHref = basePath + href
                        const isCurrentPage = currentUrl === fullHref
                        return (
                          <li
                            key={fullHref}
                            className="-ml-px flex flex-row items-center justify-between gap-2"
                          >
                            <a
                              className="inline-block border-l border-transparent text-base/8 text-gray-600 hover:border-gray-950/25 hover:text-gray-950 sm:text-sm/6 dark:text-gray-300 dark:hover:border-white/25 dark:hover:text-white aria-[current]:border-gray-950 aria-[current]:font-semibold aria-[current]:text-gray-950 dark:aria-[current]:border-white dark:aria-[current]:text-white pl-5 sm:pl-4"
                              href={fullHref}
                              aria-current={isCurrentPage ? 'page' : undefined}
                            >
                              {title}
                            </a>

                            {activeGroup === 'api' && method ? (
                              <span
                                className={`font-mono text-xs uppercase ${
                                  method === 'GET'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : method === 'POST'
                                      ? 'text-green-600 dark:text-green-400'
                                      : method === 'PUT'
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : method === 'DELETE'
                                          ? 'text-red-600 dark:text-red-400'
                                          : 'text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {method}
                              </span>
                            ) : null}
                          </li>
                        )
                      },
                    )}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
