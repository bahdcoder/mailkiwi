export function SlashesDivider() {
  return (
    <div className="w-full flex gap-2 h-6 overflow-x-hidden my-5">
      {new Array(60)
        .fill(0)
        .map((_, idx) => idx)
        .map((slash) => (
          <div
            key={slash}
            className=" h-full w-px bg-(--border-tertiary) transform rotate-45"
          />
        ))}
    </div>
  )
}
