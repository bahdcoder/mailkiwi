import React, { useState } from "react"

function Page() {
  return (
    <>
      <h1>Products list</h1>
      <p>This app showcases a list of all products.</p>

      <ul>
        <li>
          <a href="/products/singo-1">Singo 1</a>
        </li>
        <li>
          <a href="/products/singo-2">Singo 2</a>
        </li>
        <li>
          <a href="/products/singo-3">Singo 3</a>
        </li>
      </ul>
    </>
  )
}

export { Page }
