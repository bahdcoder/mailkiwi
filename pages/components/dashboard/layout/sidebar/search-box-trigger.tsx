import { SearchIcon } from '#root/pages/components/icons/search.svg.jsx'
import { Text } from '@kibamail/owly/text'

export function SearchBoxTrigger() {
  return (
    <button
      type="button"
      className="w-full p-2 flex items-center border kb-border-tertiary kb-content-tertiary rounded-lg hover:bg-(--background-secondary) active:bg-(--background-hover) transition-[background] ease-in-out"
    >
      <SearchIcon className="w-5 h-5 mr-1.5" />

      <Text className="kb-content-tertiary grow text-left">Search...</Text>

      <span className="flex items-center ml-1.5 gap-x-0.5">
        <span className="w-5 text-xs h-5 rounded-lg flex items-center justify-center border kb-border-tertiary kb-content-tertiary">
          ⌘
        </span>
        <span className="w-5 text-xs h-5 rounded-lg flex items-center justify-center border kb-border-tertiary kb-content-tertiary">
          k
        </span>
      </span>
    </button>
  )
}
