// import "../styles/home.css"
import React, { useState } from "react"

interface HomeProps {
  defaultCount: number
}

export function Home({ defaultCount = 0 }: HomeProps) {
  const [count, setCount] = useState(defaultCount)

  return (
    <button
      onClick={function () {
        setCount((current) => current + 1)
      }}
      style={{ fontSize: "32px" }}
    >
      Home count here:{count}
    </button>
  )
}

export default Home
