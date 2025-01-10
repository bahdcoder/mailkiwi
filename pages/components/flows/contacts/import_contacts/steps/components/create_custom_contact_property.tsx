import { CalendarIcon } from "@/pages/components/icons/calendar.jsx"
import { CheckSquareIcon } from "@/pages/components/icons/check-square.svg.jsx"
import { HashTagIcon } from "@/pages/components/icons/hashtag.svg.jsx"
import { InfoCircleSolidIcon } from "@/pages/components/icons/info-circle-solid.svg.jsx"
import { TextIcon } from "@/pages/components/icons/text.svg.jsx"
import * as Alert from "@kibamail/owly/alert"
import { Button } from "@kibamail/owly/button"
import * as Dialog from "@kibamail/owly/dialog"
import * as Select from "@kibamail/owly/select-field"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import * as React from "react"

export interface CreateCustomContactPropertyProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  form: {
    defaultValue?: string
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  }
}

export function CreateCustomContactProperty({
  open,
  form: { onSubmit, defaultValue },
  onOpenChange,
}: CreateCustomContactPropertyProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create custom contact property</Dialog.Title>
          {defaultValue ? (
            <Dialog.Description>
              The column <strong>{defaultValue}</strong> will be mapped to this new
              contact property.
            </Dialog.Description>
          ) : null}
        </Dialog.Header>

        <form onSubmit={onSubmit}>
          <div className="p-6 grid grid-cols-1 gap-6">
            <TextField.Root
              autoFocus
              name="name"
              id="custom-property-name"
              placeholder={defaultValue}
            >
              <TextField.Label htmlFor="custom-property-name">Name</TextField.Label>
            </TextField.Root>

            <Select.Root name="type">
              <Select.Label htmlFor="custom-property-type">Type</Select.Label>
              <Select.Trigger
                placeholder="Select a property type"
                id="custom-property-type"
              />
              <Select.Content className="z-[99]">
                <Select.Item value="text">
                  <TextIcon />
                  Text
                </Select.Item>
                <Select.Item value="number">
                  <HashTagIcon />
                  Number
                </Select.Item>
                <Select.Item value="date">
                  <CalendarIcon />
                  Date
                </Select.Item>
                <Select.Item value="boolean">
                  <CheckSquareIcon />
                  Boolean
                </Select.Item>
              </Select.Content>
            </Select.Root>

            {defaultValue ? (
              <Alert.Root variant="info">
                <Alert.Icon>
                  <InfoCircleSolidIcon />
                </Alert.Icon>
                <div className="flex flex-col w-full">
                  <Alert.Title className="font-medium">
                    A note on custom property types
                  </Alert.Title>

                  <Text as="p" className="kb-content-secondary">
                    Please select a type that correctly represents the data in your csv.
                    For example, only select the <strong>Date</strong> type if the data in
                    the <strong>{`${defaultValue} `}</strong>
                    column of your csv is in a correct date format.
                  </Text>
                </div>
              </Alert.Root>
            ) : null}
          </div>

          <Dialog.Footer className="flex justify-between gap-2">
            <Dialog.Close asChild>
              <Button variant="tertiary" width={"full"} type="button">
                Close
              </Button>
            </Dialog.Close>
            <Button width="full" type="submit">
              Create custom property
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
