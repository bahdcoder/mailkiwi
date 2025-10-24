import React from 'react'

export function Head() {
  return (
    <>
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      <link rel="manifest" href="/site.webmanifest" />

      <meta name="theme-color" content="#e0dcd9" />

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
