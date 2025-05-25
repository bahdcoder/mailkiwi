import './fill-panel.styles.css'
import * as Tabs from '@kibamail/owly/tabs'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import * as Popover from '@radix-ui/react-popover'
import React from 'react'
import { HexColorPicker } from 'react-colorful'

export type FillValue = { type: 'image' | 'color'; value: string | undefined }
export interface FillPanelProps extends React.PropsWithChildren {
  allowImageFills?: boolean
  value?: string
  sideOffset?: number
  onChange?: (_fill: FillValue) => void
}

export function FillPanel({
  children,
  allowImageFills,
  value,
  onChange,
  sideOffset = 64,
}: FillPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  function onHexColorManuallyChanged(value: string) {
    // todo: check if hex color is valid. if not, show an error and do not set the value.
    // onChange?.({ type: "color", value })
  }

  const ColorPicker = (
    <>
      <HexColorPicker
        color={value}
        onChange={(color) => onChange?.({ type: 'color', value: color })}
        className="w-composer-color-picker"
      />

      <div className="mt-4 flex gap-1 w-full items-center ">
        <TextField.Root
          className="shrink-0 w-2/5"
          value={value ?? ''}
          onChange={(event) => onHexColorManuallyChanged(event.target.value)}
        >
          <TextField.Slot side="left">
            <Text className="text-(--content-disabled)">HEX</Text>
          </TextField.Slot>
        </TextField.Root>
        <div className="flex items-center gap-1 w-3/5">
          {['R', 'G', 'B'].map((codeLetter) => (
            <TextField.Root
              readOnly
              key={codeLetter}
              className="shrink-0 w-auto max-w-[32%]"
            >
              <TextField.Slot side="left">
                <Text className="text-(--content-disabled)">{codeLetter}</Text>
              </TextField.Slot>
            </TextField.Root>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="rounded-lg border-(--black-10) flex items-center gap-1.5 relative"
          onClick={() => onChange?.({ type: 'color', value: undefined })}
        >
          <img
            src="https://s3-alpha-sig.figma.com/img/7f12/ea13/00756f144a0fb5daaf68dbfc01103a46?Expires=1739145600&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=eSntLVzp9xgCrbNiMhbOw-uvrLOfEhr7fteuDAtygCnCbgktGQSq9EM7oF4VvkPCHYiJaHve1u7WWX5RpjkRai0g6ilCo5deAERqoFbpX1tG8GtBYxcifoXCoENVhtmdol39PrL1DGbtopznoW6EyZ5dtheN8vtPmSDyI5S8kzeZmlzMkN27W4CssVTMnc8pVL3CjMv~d3ksvP-wHViLIPiUt0FyE1Dm-dwSp1NMrPFs1fRALcx9200VfkSDHQ3L54vNGOBrzPe-484p2dL1YGGUoTpCQlmwXzV~LNPcZ97PpRA0LSFAWpBcDNHi6EtMt6~00Ukbg7QGr4sHylT9zg__"
            className="rounded-lg w-6 h-6"
            alt="checkers grid"
          />

          <Text className="shrink-0">Remove fill</Text>

          <div className="absolute h-6 w-[2px] bg-[#FF0000] transform rotate-45 left-[11px]" />
        </button>
      </div>
    </>
  )

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Content
        align="center"
        sideOffset={sideOffset}
        side="bottom"
        className="z-50 w-96 overflow-hidden border kb-border-tertiary rounded-xl shadow-[0px_16px_24px_-8px_var(--black-10)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-(--background-primary) p-4"
      >
        {allowImageFills ? (
          <Tabs.Root defaultValue="color" width="full">
            <Tabs.List>
              <Tabs.TabsTrigger value="color">Color</Tabs.TabsTrigger>
              <Tabs.TabsTrigger disabled={!allowImageFills} value="image">
                Image
              </Tabs.TabsTrigger>
              <Tabs.Indicator />
            </Tabs.List>

            <Tabs.Content value="color" className="py-2">
              {ColorPicker}
            </Tabs.Content>
            <Tabs.Content value="image">Image here</Tabs.Content>
          </Tabs.Root>
        ) : (
          ColorPicker
        )}
      </Popover.Content>
    </Popover.Root>
  )
}
