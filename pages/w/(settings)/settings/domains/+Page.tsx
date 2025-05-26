import { Divider } from '#root/pages/components/divider/divider.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '#root/core/shared/routes/route_aliases.js'

function ProfilePage() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 lg:py-16 grid grid-cols-1 gap-y-4 p-4">
      <Heading size="xs" variant="display">
        Domains
      </Heading>

      <Divider />
    </div>
  )
}

export { ProfilePage as Page }
