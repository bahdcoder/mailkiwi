import cn from 'classnames'
import { usePageContext } from 'vike-react/usePageContext'

interface SubmenuItemLinkProps
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<'a'> {}

export function SubmenuItemLink({ children, ...linkProps }: SubmenuItemLinkProps) {
  const { urlOriginal } = usePageContext()

  const isActive =
    urlOriginal.includes(linkProps.href as string) ||
    `${urlOriginal}/`.includes(linkProps.href as string)

  return (
    <a
      data-active={isActive}
      className={cn(
        'w-full p-2 border-t border-l border-r border-b-2 rounded-lg gap-x-2 flex items-center  transition-[background] ease-in-out group',
        {
          'bg-(--background-primary) kb-border-tertiary shadow-[0px_1px_0px_0px_var(--black-5)] kb-content-primary [&>span]:text-(--content-primary) [&>svg]:text-(--content-primary)':
            isActive,
          'hover:bg-(--background-hover) border-transparent kb-content-secondary':
            !isActive,
        },
      )}
      {...linkProps}
    >
      {children}
    </a>
  )
}
