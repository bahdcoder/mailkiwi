import React from 'react'

export function Head() {
  return (
    <>
      <link
        as="font"
        rel="preload"
        href="/fonts/roca-two-rg.ttf"
        type="font/ttf"
        crossOrigin="anonymous"
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500;700&family=Manrope:wght@200..800&display=swap"
        rel="stylesheet"
      />
    </>
  )
}
