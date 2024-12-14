import type { OnPageTransitionEndAsync } from "vike/types"

export { onPageTransitionEnd }

const onPageTransitionEnd: OnPageTransitionEndAsync = async (
  pageContext,
): ReturnType<OnPageTransitionEndAsync> => {
  document.body.classList.remove("vike-router-transition-out")
  document.body.classList.add("vike-router-transition-in")
}
