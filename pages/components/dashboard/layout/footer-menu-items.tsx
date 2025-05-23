import { SettingsIcon } from '#root/pages/components/icons/settings.svg.jsx'
import { Text } from '@kibamail/owly/text'

export function FooterMenuItems() {
  return (
    <>
      <div className="flex items-center">
        <button type="button" className="underline kb-content-tertiary kb-reset">
          <Text className="kb-content-tertiary underline">Give feedback</Text>
        </button>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={2}
          height={2}
          viewBox="0 0 2 2"
          fill="none"
          className="mx-2"
          role="img"
          aria-label="Separator dot"
        >
          <title>Separator dot</title>
          <circle cx={1} cy={1} r={1} fill="#716D6A" />
        </svg>

        <a href="/docs">
          <Text className="kb-content-tertiary underline">Docs</Text>
        </a>
      </div>

      <a href="/w/settings">
        <SettingsIcon className="w-6 h-6 kb-content-tertiary" />
      </a>
    </>
  )
}
