import { Layout } from "./layouts/layout-default.tsx"
import "./root.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"
import React, { StrictMode } from "react"
import ReactDOM from "react-dom/client"

const Login = React.lazy(() => import("./pages/Login.tsx"))
const Dashbaord = React.lazy(() => import("./pages/Dashboard.tsx"))

const queryClient = new QueryClient()

const rootRoute = createRootRoute({
  component: () => <Layout />,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashbaord,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
})

const routeTree = rootRoute.addChildren([dashboardRoute, loginRoute])

const router = createRouter({ routeTree, basepath: "/p" })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById("root")

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
