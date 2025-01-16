import * as Tabs from "@kibamail/owly/tabs"

export function BlockEditor() {
  return (
    <div className="p-2">
      <Tabs.Root defaultValue="mobile" width="full">
        <Tabs.List>
          <Tabs.Trigger value="mobile">Mobile</Tabs.Trigger>
          <Tabs.Trigger value="desktop">Desktop</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>
      </Tabs.Root>
    </div>
  )
}
