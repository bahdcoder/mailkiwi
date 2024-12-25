import { FormState, useImportcontactsContext } from "../state/import_contacts_context.jsx"
import { CalendarIcon } from "@/pages/components/icons/calendar.jsx"
import { CheckCircleSolidIcon } from "@/pages/components/icons/check-circle-solid.svg.jsx"
import { CheckSquareIcon } from "@/pages/components/icons/check-square.svg.jsx"
import { HashTagIcon } from "@/pages/components/icons/hashtag.svg.jsx"
import { InfoCircleSolidIcon } from "@/pages/components/icons/info-circle-solid.svg.jsx"
import { MailIcon } from "@/pages/components/icons/mail.svg.jsx"
import { NavArrowRightIcon } from "@/pages/components/icons/nav-arrow-right.svg.jsx"
import { PlusIcon } from "@/pages/components/icons/plus.svg.jsx"
import { TextIcon } from "@/pages/components/icons/text.svg.jsx"
import { slugify } from "@/pages/utils/slugify.js"
import * as Alert from "@kibamail/owly/alert"
import { Button } from "@kibamail/owly/button"
import * as Dialog from "@kibamail/owly/dialog"
import { Heading } from "@kibamail/owly/heading"
import * as Select from "@kibamail/owly/select-field"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import cn from "classnames"
import * as React from "react"

type PropertyType = "date" | "float" | "text" | "boolean" | "standard" | "skip"
type SelectFieldPropertyState = Record<
  string,
  {
    open: boolean
    property: {
      id: string
      name: string
      type: PropertyType
    }
  }
>

const standardProperties = ["email", "firstName", "lastName"] as const
const standardPropertyNames = ["Email address", "First name", "Last name"] as const

export function StepTwoMatchCsvHeadersToContactProperties() {
  const { step, setStep, formState, setFormState } = useImportcontactsContext(
    "MatchCsvHeadersToContactProperties",
  )
  const matchingErrorAlertRef = React.useRef<HTMLDivElement | null>(null)

  const [addingCustomPropertyForColumn, setAddingCustomPropertyForColumn] =
    React.useState("")

  const [selectFieldPropertyStates, setSelectFieldPropertyStates] =
    React.useState<SelectFieldPropertyState>(function () {
      let defaultFieldPropertyStates: SelectFieldPropertyState = {}

      if (
        formState.contactProperties &&
        Object.keys(formState.contactProperties).length > 1
      ) {
        for (const standardProperty of standardProperties) {
          if (formState.contactProperties?.[standardProperty]) {
            defaultFieldPropertyStates[formState.contactProperties?.[standardProperty]] =
              {
                open: false,
                property: {
                  id: standardProperty,
                  name: standardPropertyNames[
                    standardProperties.indexOf(standardProperty)
                  ],
                  type: "standard",
                },
              }
          }
        }

        if (formState.contactProperties.customProperties) {
          for (const column in formState.contactProperties.customProperties) {
            const property = formState.contactProperties.customProperties[column]

            defaultFieldPropertyStates[column] = {
              open: false,
              property: {
                id: property.id,
                name: property.label,
                type: property.type,
              },
            }
          }
        }

        for (const propertyId of Object.keys(formState.contactProperties)) {
        }

        for (const column of formState.propertiesMap.customPropertiesHeaders) {
          if (!defaultFieldPropertyStates[column]) {
            defaultFieldPropertyStates[column] = {
              open: false,
              property: {
                id: "skip",
                name: "None - Skip this column",
                type: "skip",
              },
            }
          }
        }

        return defaultFieldPropertyStates
      }

      for (const propertyId of standardProperties) {
        if (formState.propertiesMap?.[propertyId]) {
          defaultFieldPropertyStates[formState.propertiesMap?.[propertyId]] = {
            open: false,
            property: {
              id: propertyId,
              name: standardPropertyNames[standardProperties.indexOf(propertyId)],
              type: "standard",
            },
          }
        }
      }

      return defaultFieldPropertyStates
    })

  const newProperties = Object.keys(selectFieldPropertyStates)
    .filter(
      (column) =>
        selectFieldPropertyStates[column]?.property &&
        selectFieldPropertyStates[column]?.property?.type !== "standard" &&
        selectFieldPropertyStates[column]?.property?.type !== "skip",
    )
    .map((column) => {
      const { property } = selectFieldPropertyStates[column]

      const icons = {
        date: CalendarIcon,
        float: HashTagIcon,
        text: TextIcon,
        boolean: CheckSquareIcon,
        standard: TextIcon,
        skip: TextIcon,
      }

      return {
        ...selectFieldPropertyStates[column]?.property,
        icon: icons[property.type],
      }
    })

  const uniqueNewProperties = Array.from(
    new Map(newProperties.map((property) => [property.id, property])).values(),
  )

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
    ...uniqueNewProperties,
  ]

  const matches = [
    ...(formState.propertiesMap?.["email"]
      ? [
          {
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
          },
        ]
      : []),
    ...(formState.propertiesMap?.["lastName"]
      ? [
          {
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
      }
    }),
  ]

  function onCreateNewProperty(column: string) {
    setAddingCustomPropertyForColumn(column)
  }

  function onGoBack() {
    setStep((current) => current - 1)
  }

  function onFinaliseImport() {
    if (!hasMatchedAllColumns()) {
      callUserAttentionToFormError()

      return
    }

    // serverFormProps.mutate({})
    console.log(selectFieldPropertyStates, properties)

    let contactProperties: FormState["contactProperties"] = {
      email: "",
      firstName: "",
      lastName: "",
    }

    for (const standardProperty of standardProperties) {
      const assignedColumn = Object.keys(selectFieldPropertyStates).find((column) => {
        return selectFieldPropertyStates[column]?.property?.id === standardProperty
      })

      if (assignedColumn) {
        contactProperties[standardProperty] = assignedColumn
      }
    }

    Object.keys(selectFieldPropertyStates).forEach((column) => {
      const property = selectFieldPropertyStates[column]?.property

      if (!property) {
        return
      }

      if (property.type === "skip" || property.type === "standard") {
        return
      }

      if (!contactProperties.customProperties) {
        contactProperties.customProperties = {}
      }

      contactProperties.customProperties[column] = {
        id: property.id,
        label: property.name,
        type: property.type,
      }
    })

    setFormState((state) => ({ ...state, contactProperties }))
    setStep((current) => current + 1)
  }

  const isAddingCustomPropertyForColumn = addingCustomPropertyForColumn !== ""

  function onAddingCustomPropertyDialogOpenChange(open: boolean) {
    if (open) {
      return
    }

    setAddingCustomPropertyForColumn("")
  }

  function onSelectPropertyOpenChange(name: string, open: boolean) {
    setSelectFieldPropertyStates((state) => ({
      ...state,
      [name]: { open, property: state?.[name]?.property },
    }))
  }

  function callUserAttentionToFormError() {
    const alert = matchingErrorAlertRef.current

    if (!alert) {
      return
    }

    alert.classList.toggle("animation-shake")

    alert.addEventListener(
      "animationend",
      function () {
        alert.classList.remove("animation-shake")
      },
      { once: true },
    )
  }

  function onSelectPropertyValueChange(column: string, value: string) {
    if (value === "skip") {
      setSelectFieldPropertyStates((state) => ({
        ...state,
        [column]: {
          open: false,
          property: {
            id: "skip",
            type: "skip",
            name: "None - Skip this column",
          },
        },
      }))

      return
    }

    const property = properties.find((property) => property.id === value)

    if (!property || !property.id || !property.name) {
      return
    }

    const { name, id, type } = property

    setSelectFieldPropertyStates((state) => ({
      ...state,
      [column]: {
        open: false,
        property: {
          id,
          name,
          type: type as PropertyType,
        },
      },
    }))
  }

  function onCreateNewCustomPropertySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget

    const formData = new FormData(form)

    const name = formData.get("name") as string
    const type = formData.get("type") as "text" | "float" | "date" | "boolean"

    setSelectFieldPropertyStates((state) => ({
      ...state,
      [addingCustomPropertyForColumn]: {
        open: false,
        property: { id: slugify(name), name, type },
      },
    }))

    form.reset()

    setAddingCustomPropertyForColumn("")
  }

  function hasPropertyAlreadyBeenMatchedToAColumn(propertyId?: string) {
    if (!propertyId) {
      return false
    }

    if (propertyId === "skip") {
      return false
    }

    return (
      Object.values(selectFieldPropertyStates).filter(
        (state) => state?.property?.id === propertyId,
      ).length > 1
    )
  }

  function hasMatchedAllColumns() {
    return (
      matches.length ===
      Object.keys(selectFieldPropertyStates).filter(
        (column) => selectFieldPropertyStates[column]?.property,
      ).length
    )
  }

  function hasMatchedAnEmailColumnProperty() {
    const matchedToEmailProperty = Object.values(selectFieldPropertyStates).some(
      (value) => value?.property?.id === "email",
    )

    return matchedToEmailProperty
  }

  function getMatchingErrorAlertContent():
    | {
        title: string
        description: React.ReactNode
        variant?: Alert.AlertRootProps["variant"]
      }
    | undefined {
    if (!hasMatchedAnEmailColumnProperty()) {
      return {
        title: "An email address is required in your csv complete the import.",
        description:
          "Please make sure you've matched an email address column to the email address property.",
        variant: "error",
      }
    }

    if (!hasMatchedAllColumns()) {
      return {
        title: "You need to match all columns in your csv to a contact property.",
        description: (
          <>
            For the columns you don't want to match, please select{" "}
            <strong>None - Skip this column.</strong>
          </>
        ),
        variant: "warning",
      }
    }

    return undefined
  }

  const matchingErrorAlert = getMatchingErrorAlertContent()

  return (
    <>
      <Dialog.Root
        open={isAddingCustomPropertyForColumn}
        onOpenChange={onAddingCustomPropertyDialogOpenChange}
      >
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Create custom subscriber property</Dialog.Title>
            <Dialog.Description>
              The column <strong>{addingCustomPropertyForColumn}</strong> will be mapped
              to this new subscriber property.
            </Dialog.Description>
          </Dialog.Header>

          <form onSubmit={onCreateNewCustomPropertySubmit}>
            <div className="p-6 grid grid-cols-1 gap-6">
              <TextField.Root
                autoFocus
                name="name"
                id="custom-property-name"
                placeholder={addingCustomPropertyForColumn}
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
                    the <strong>{`${addingCustomPropertyForColumn} `}</strong>
                    column of your csv is in a correct date format.
                  </Text>
                </div>
              </Alert.Root>
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
      <DialogPrimitive.Title asChild className="text-left">
        <Heading>Match your csv to contact properties</Heading>
      </DialogPrimitive.Title>

      <DialogPrimitive.Description asChild>
        <Text as="p">
          Great. We got your csv file. Now, tell us how you want to save the contacts from
          your csv on Kibamail. We need your help mapping every head in the csv to a
          contact property on Kibamail. You may also skip any headers you don't need.
        </Text>
      </DialogPrimitive.Description>

      <div className="mt-6 grid grid-cols-1 gap-y-8">
        {matches.map((match, idx) => {
          const hasSelectedProperty =
            !!selectFieldPropertyStates[match.column.name]?.property

          return (
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
                        "kb-content-disabled": !hasSelectedProperty,
                        "kb-content-positive": hasSelectedProperty,
                      })}
                    />
                  </div>
                </div>

                <Select.Root
                  open={selectFieldPropertyStates[match.column.name]?.open}
                  value={selectFieldPropertyStates[match.column.name]?.property?.id}
                  onOpenChange={(open) =>
                    onSelectPropertyOpenChange(match.column.name, open)
                  }
                  onValueChange={(value) =>
                    onSelectPropertyValueChange(match.column.name, value)
                  }
                >
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
                      value="create-new-property"
                      className="kb-select-item kb-reset sticky bottom-0 bg-[var(--background-primary)]"
                      onClick={function () {
                        onCreateNewProperty(match.column.name)
                      }}
                    >
                      <span className="kb-text kb-reset kb-r-size-md kb-select-item-text">
                        <PlusIcon className="w-5 h-5" />
                        Create a custom property
                      </span>

                      <NavArrowRightIcon />
                    </button>
                  </Select.Content>

                  {hasPropertyAlreadyBeenMatchedToAColumn(
                    selectFieldPropertyStates[match.column.name]?.property?.id,
                  ) ? (
                    <Select.Error>
                      You have already matched the{" "}
                      {selectFieldPropertyStates[match.column.name]?.property?.name}{" "}
                      property to a column. All properties must be uniquely matched.
                    </Select.Error>
                  ) : null}
                </Select.Root>
              </div>
            </div>
          )
        })}

        {matchingErrorAlert ? (
          <Alert.Root variant={matchingErrorAlert.variant} ref={matchingErrorAlertRef}>
            <Alert.Icon>
              <InfoCircleSolidIcon />
            </Alert.Icon>
            <div className="w-full flex flex-col">
              <Alert.Title className="font-medium">
                {matchingErrorAlert?.title}
              </Alert.Title>
              <Text className="kb-content-secondary mt-1">
                {matchingErrorAlert?.description}
              </Text>
            </div>
          </Alert.Root>
        ) : null}
      </div>

      <div className="mt-12 pb-64 flex items-center justify-between">
        <Button variant="tertiary" onClick={onGoBack}>
          Go back
        </Button>
        <Button onClick={onFinaliseImport}>Finalise import </Button>
      </div>
    </>
  )
}
