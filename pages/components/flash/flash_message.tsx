import './flash_message.css'
import { WarningCircleSolidIcon } from '#root/pages/components/icons/warning-circle-solid.svg.jsx'
import * as Alert from '@kibamail/owly/alert'
import { Text } from '@kibamail/owly/text'
import { usePageContext } from 'vike-react/usePageContext'

import type { FlashMessagePayload } from '#root/core/shared/controllers/flash_controller.js'

interface FlashMessageProps extends Alert.AlertRootProps {
  alert?: FlashMessagePayload
}

export function FlashMessage({ alert: defaultAlert, ...rootProps }: FlashMessageProps) {
  const { flash } = usePageContext()

  function parseFlashMessage() {
    let alert: FlashMessagePayload | undefined

    try {
      alert = JSON.parse(flash)
    } catch (error) {}

    return alert
  }

  const alert = parseFlashMessage() ?? defaultAlert

  if (!alert) {
    return null
  }

  return (
    <Alert.Root {...rootProps} variant={alert.variant}>
      <Alert.Icon>
        <WarningCircleSolidIcon />
      </Alert.Icon>

      <div className="w-full flex flex-col">
        <Alert.Title className="font-medium">{alert?.title}</Alert.Title>

        {alert?.description ? (
          <Text className="kb-content-secondary mt-1">{alert?.description}</Text>
        ) : null}
      </div>
    </Alert.Root>
  )
}
