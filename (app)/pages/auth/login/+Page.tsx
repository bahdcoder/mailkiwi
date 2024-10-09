import React, { FormEvent, useState } from "react"

function Page() {
  const [form, setForm] = useState<Record<string, string>>({})

  async function onSubmit(event: FormEvent) {
    event.preventDefault()

    const response = await fetch("/auth/login/", {
      method: "POST",
      body: JSON.stringify(form),
    })

    console.log({ response })
  }

  return (
    <form
      className="flex flex-col w-full max-w-2xl border border-gray-500 p-4 gap-6"
      onSubmit={onSubmit}
    >
      <input
        type="email"
        placeholder="Email"
        className="border border-gray-500 p-4"
        name="email"
        onChange={(event) =>
          setForm((current) => ({ ...current, email: event.target.value }))
        }
      />
      <input
        type="password"
        placeholder="Password"
        className="border border-gray-500 p-4"
        name="password"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            password: event.target.value,
          }))
        }
      />

      <button
        type="submit"
        className="bg-blue-500 rounded-md px-4 py-3 text-white hover:bg-blue-600"
      >
        Submit
      </button>
    </form>
  )
}

export { Page }
