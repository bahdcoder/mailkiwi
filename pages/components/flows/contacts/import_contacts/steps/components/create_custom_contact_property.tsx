import { CalendarIcon } from '#root/pages/components/icons/calendar.jsx'
import { CheckSquareIcon } from '#root/pages/components/icons/check-square.svg.jsx'
import { HashTagIcon } from '#root/pages/components/icons/hashtag.svg.jsx'
import { TextIcon } from '#root/pages/components/icons/text.svg.jsx'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import * as Select from '@kibamail/owly/select-field'
import * as TextField from '@kibamail/owly/text-field'
import type * as React from 'react'

export interface CreateCustomContactPropertyProps extends React.PropsWithChildren {
  open: boolean
  onOpenChange: (open: boolean) => void

  form?: {
    defaultValue?: string
    onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  }

  errors?: Record<string, string>
}

export function CreateCustomContactProperty({
  open,
  onOpenChange,
  children,
  form,
  errors,
}: CreateCustomContactPropertyProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title className="text-center">
            Create custom contact property
          </Dialog.Title>
          {form?.defaultValue ? (
            <Dialog.Description className="text-center">
              The column <strong>{form.defaultValue}</strong> will be mapped to this new
              contact property.
            </Dialog.Description>
          ) : null}
        </Dialog.Header>

        <form onSubmit={form?.onSubmit}>
          <div className="p-6 grid grid-cols-1 gap-6">
            <TextField.Root
              autoFocus
              name="name"
              id="custom-property-name"
              placeholder={form?.defaultValue ?? 'Job title, Interests, Company, etc.'}
            >
              <TextField.Label htmlFor="custom-property-name">Name</TextField.Label>
              {errors?.name && <TextField.Error>{errors.name}</TextField.Error>}
            </TextField.Root>

            <Select.Root name="type">
              <Select.Label htmlFor="custom-property-type">Type</Select.Label>
              <Select.Trigger
                placeholder="Select a property type"
                id="custom-property-type"
              />
              <Select.Content className="z-99">
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
              {errors?.type && <Select.Error>{errors.type}</Select.Error>}
            </Select.Root>

            {children}
          </div>

          <Dialog.Footer className="flex justify-between gap-2">
            <Dialog.Close asChild type="button">
              <Button variant="tertiary" width={'full'} type="button">
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
