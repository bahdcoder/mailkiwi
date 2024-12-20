import { useImportcontactsContext } from "../state/import_contacts_context.jsx"
import { CheckCircleSolidIcon } from "@/pages/components/icons/check-circle-solid.svg.jsx"
import { MailIcon } from "@/pages/components/icons/mail.svg.jsx"
import { NavArrowRightIcon } from "@/pages/components/icons/nav-arrow-right.svg.jsx"
import { PlusIcon } from "@/pages/components/icons/plus.svg.jsx"
import { TextIcon } from "@/pages/components/icons/text.svg.jsx"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import * as Select from "@kibamail/owly/select-field"
import { Text } from "@kibamail/owly/text"
import * as Dialog from "@radix-ui/react-dialog"
import cn from "classnames"
import * as React from "react"

export function StepTwoMatchCsvHeadersToContactProperties() {
  const { step, formState } = useImportcontactsContext(
    "MatchCsvHeadersToContactProperties",
  )

  const [addingCustomPropertyForColumn, setAddingCustomPropertyForColumn] =
    React.useState("")

  if (step !== 1) {
    return null
  }

  const properties = [
    {
      name: "Email address",
      id: "email",
      type: "standard",
      icon: MailIcon,
    },
    {
      name: "First name",
      id: "firstName",
      type: "standard",
      icon: TextIcon,
    },
    {
      name: "Last name",
      id: "lastName",
      type: "standard",
      icon: TextIcon,
    },
  ]

  const matches = [
    ...(formState.propertiesMap?.["email"]
      ? [
          {
            property: {
              name: "Email address",
              id: "email",
              type: "standard",
            },
            column: {
              name: formState.propertiesMap?.["email"],
              count: formState.headerCounts?.[formState.propertiesMap?.["email"]],
              samples: formState.headerSamples?.[formState.propertiesMap?.["email"]],
            },
          },
        ]
      : []),
    ...(formState.propertiesMap?.["firstName"]
      ? [
          {
            column: {
              name: formState.propertiesMap?.["firstName"],
              count: formState.headerCounts?.[formState.propertiesMap?.["firstName"]],
              samples: formState.headerSamples?.[formState.propertiesMap?.["firstName"]],
            },
            property: {
              name: "First name",
              id: "firstName",
              type: "standard",
            },
          },
        ]
      : []),
    ...(formState.propertiesMap?.["lastName"]
      ? [
          {
            property: {
              name: "Last name",
              id: "lastName",
              type: "standard",
            },
            column: {
              name: formState.propertiesMap?.["lastName"],
              count: formState.headerCounts?.[formState.propertiesMap?.["lastName"]],
              samples: formState.headerSamples?.[formState.propertiesMap?.["lastName"]],
            },
          },
        ]
      : []),
    ...formState.propertiesMap.customPropertiesHeaders.map((header) => {
      return {
        column: {
          name: header,
          count: formState.headerCounts?.[header],
          samples: formState.headerSamples?.[header],
        },
        property: undefined,
      }
    }),
  ]

  function onCreateNewProperty(column: string) {
    setAddingCustomPropertyForColumn(column)
  }

  const isAddingCustomPropertyForColumn = addingCustomPropertyForColumn !== ""

  return (
    <>
      <Dialog.Title asChild className="text-left">
        <Heading>Match your csv to contact properties</Heading>
      </Dialog.Title>

      <Dialog.Description asChild>
        <Text as="p">
          Great. We got your csv file. Now, tell us how you want to save the contacts from
          your csv on Kibamail. We need your help mapping every head in the csv to a
          contact property on Kibamail. You may also skip any headers you don't need.
        </Text>
      </Dialog.Description>

      <div className="mt-6 grid grid-cols-1 gap-y-8">
        {matches.map((match, idx) => (
          <div
            className="flex flex-col md:flex-row items-start w-full md:gap-x-24"
            key={idx}
          >
            <Text className="flex-shrink-0 mb-6 md:mb-0 md:mt-2">
              Column {idx + 1}/{matches.length}
            </Text>

            <div className="flex flex-col w-full">
              <div className="h-9 w-full border kb-border-tertiary flex items-center justify-between px-2 rounded-lg kb-background-disabled">
                <Text className="kb-content-secondary">{match?.column?.name}</Text>
                <div className="flex gap-x-1 items-center">
                  <Text className="kb-content-secondary">
                    {match?.column?.samples?.[0]}
                  </Text>
                  <Text className="kb-content-tertiary">+{match?.column?.count}</Text>
                </div>
              </div>

              <div className="h-16 kb-background-secondary w-full flex flex-col justify-center relative">
                <div className="absolute w-px border-l kb-border-tertiary  h-14 top-1 left-4"></div>

                <div className="w-full py-1 kb-background-secondary z-[1] flex items-center justify-between">
                  <Text size="sm" className="hidden md:inline kb-content-secondary">
                    Matches to the following property on your Kibamail account:
                  </Text>
                  <Text size="sm" className="md:hidden kb-content-secondary">
                    Matches to the following property:
                  </Text>

                  <CheckCircleSolidIcon
                    className={cn("w-4 h-4", {
                      "kb-content-disabled": true,
                      "kb-content-positive": true,
                    })}
                  />
                </div>
              </div>
              <Select.Root>
                <Select.Trigger placeholder="Select a property" />
                <Select.Content>
                  <Select.Item value="skip">None - Skip this column</Select.Item>
                  <Select.Separator />

                  {properties.map((property) => (
                    <Select.Item key={property.id} value={property.id}>
                      <property.icon className="w-5 h-5" />
                      {property.name}
                    </Select.Item>
                  ))}
                  <Select.Separator />
                  <button
                    className="kb-select-item kb-reset"
                    type="button"
                    onClick={() => onCreateNewProperty(match.column.name)}
                  >
                    <span className="kb-text kb-reset kb-r-size-md kb-select-item-text">
                      <PlusIcon className="w-5 h-5" />
                      Create a custom property
                    </span>

                    <NavArrowRightIcon />
                  </button>
                </Select.Content>

                <Select.Hint>You can only select one option</Select.Hint>
              </Select.Root>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 pb-64 flex items-center justify-between">
        <Dialog.Close>
          <Button variant="tertiary">Cancel import </Button>
        </Dialog.Close>
        <Button>Finalise import </Button>
      </div>
    </>
  )
}
