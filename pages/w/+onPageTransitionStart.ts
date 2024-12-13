import type { OnPageTransitionStartAsync } from "vike/types"

export { onPageTransitionStart }

// Create custom page transition animations
const onPageTransitionStart: OnPageTransitionStartAsync = async (
  ctx,
): ReturnType<OnPageTransitionStartAsync> => {
  console.log("Page transition start")
  console.log("Is backwards navigation?", ctx.isBackwardNavigation)
  document.body.classList.add("page-transition")
}
