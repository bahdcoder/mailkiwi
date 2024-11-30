import React, { useEffect } from "react"

function Page() {
  useEffect(() => {
    const WEBSOCKET_CONNECTION_URL = `wss://${window.location.host}`
    const ws = new WebSocket(WEBSOCKET_CONNECTION_URL)

    console.log({ ws })
  }, [])

  return (
    <>
      <h1>Index</h1>
      <p>This app showcases a migration from Vite to Vike.</p>
    </>
  )
}

export { Page }
