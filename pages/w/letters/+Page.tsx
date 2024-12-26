import { usePageContext } from "vike-react/usePageContext"

function LettersPage() {
  const ctx = usePageContext()

  console.log({ ctx })

  return (
    <div className="w-full max-w-2xl mx-auto py-16">
      <h1 className="text-center">The Letters dashboard</h1>
    </div>
  )
}

export { LettersPage as Page }
