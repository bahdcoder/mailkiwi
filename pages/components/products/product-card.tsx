import type React from 'react'

interface ProductCardProps
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<'a'> {}

function ProductCard({ ...linkProps }: ProductCardProps) {
  return (
    <a
      {...linkProps}
      className="w-full flex gap-y-2 transition-[background] ease-in-out hover:bg-(--background-hover) flex-col border kb-border-tertiary rounded-xl border-b-2 shadow-[0px_2px_0px_0px_var(--white-5)_inset,0px_1px_0px_0px_var(--black-10)] p-5"
    />
  )
}

export { ProductCard as Root }
