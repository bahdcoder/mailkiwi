import * as Tabs from "@kibamail/owly/tabs"

export function StepOneComposer() {
  return (
    <div className="w-full flex items-center h-full">
      <div className="w-[16.25rem] h-full border-r kb-border-tertiary p-2">
        <Tabs.Root defaultValue="layers" width="full">
          <Tabs.List>
            <Tabs.TabsTrigger value="layers">Layers</Tabs.TabsTrigger>
            <Tabs.TabsTrigger value="blocks">Blocks</Tabs.TabsTrigger>
            <Tabs.Indicator />
          </Tabs.List>

          <Tabs.Content value="layers">Layers here</Tabs.Content>
          <Tabs.Content value="blocks">Blocks here</Tabs.Content>
        </Tabs.Root>
      </div>
      <div className="flex-grow h-full p-6 overflow-y-auto">
        <div className="w-full max-w-[45rem] mx-auto h-full flex flex-col gap-6">
          <input
            className="text-4xl font-bold text-[var(--content-secondary)] placeholder:text-[var(--content-tertiary-inverse)] bg-transparent border-none focus:outline-none focus:border-none w-full"
            placeholder="Broadcast title"
          />

          <div className="w-full flex-grow p-8 bg-white shadow-[0px_16px_24px_-8px_var(--black-10)]">
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>

            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
            <p>
              lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit
              amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor
              sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit ametlorem ipsum
              dolor sit amet lorem ipsum dolor sit ametlorem ipsum dolor sit amet lorem
              ipsum dolor sit ametlorem ipsum dolor sit amet lorem ipsum dolor sit amet
            </p>
          </div>
        </div>
      </div>
      <div className="w-[16.25rem] h-full border-l kb-border-tertiary"></div>
    </div>
  )
}
