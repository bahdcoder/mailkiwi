import { Root } from "./root"
// import "./styles/root.css"
import React from "react"
import { hydrateRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

hydrateRoot(
  document.querySelector("#root") as HTMLDivElement,
  <BrowserRouter basename="/">
    <Root pageProps={(window as any).__pageProps ?? {}} />
  </BrowserRouter>,
)
