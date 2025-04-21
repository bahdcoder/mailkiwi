import React from 'react'

/**
 * Higher-order component to add an accessible title to SVG icons
 * @param WrappedComponent The SVG component to wrap
 * @param title The title to add to the SVG for accessibility
 * @returns A new component with the title added
 */
export function addTitleToSvg(
  WrappedComponent: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>
  >,
  title: string,
) {
  const ComponentWithTitle = React.forwardRef<
    SVGSVGElement,
    React.SVGProps<SVGSVGElement>
  >((props, ref) => {
    const { 'aria-label': ariaLabel, ...restProps } = props

    // Use aria-label from props if provided, otherwise use the title
    const accessibilityLabel = ariaLabel || title

    return (
      <WrappedComponent
        ref={ref}
        aria-label={accessibilityLabel}
        role="img"
        {...restProps}
      >
        <title>{accessibilityLabel}</title>
      </WrappedComponent>
    )
  })

  ComponentWithTitle.displayName = `WithTitle(${WrappedComponent.displayName || 'SVGComponent'})`

  return ComponentWithTitle
}
