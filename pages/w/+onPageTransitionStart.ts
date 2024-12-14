import type { OnPageTransitionStartAsync } from "vike/types"

export { onPageTransitionStart }

// Create custom page transition animations
const onPageTransitionStart: OnPageTransitionStartAsync = async (
  ctx,
): ReturnType<OnPageTransitionStartAsync> => {
  document.body.classList.remove("vike-router-transition-in")
  document.body.classList.add("vike-router-transition-out")
}
