// import "../styles/about.css"
import React, { useState } from "react"

interface AboutProps {
  defaultCount: number
}

export function About({ defaultCount = 0 }: AboutProps) {
  const [count, setCount] = useState(defaultCount)

  return (
    <button
      onClick={function () {
        setCount((current) => current + 1)
      }}
    >
      About count here:{count}
    </button>
  )
}

export default About
