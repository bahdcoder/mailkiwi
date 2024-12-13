import type { OnPageTransitionEndAsync } from "vike/types"

export { onPageTransitionEnd }

const onPageTransitionEnd: OnPageTransitionEndAsync = async (
  pageContext,
): ReturnType<OnPageTransitionEndAsync> => {
  // ...
  console.log("Page transition end")
  console.log("Is backwards navigation?", pageContext.isBackwardNavigation)
  document.body.classList.remove("page-transition")
}
