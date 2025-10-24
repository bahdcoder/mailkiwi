import { Button } from '@kibamail/owly/button'
import * as SelectField from '@kibamail/owly/select-field'
import { Text } from '@kibamail/owly/text'
import type React from 'react'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './components/sheet.jsx'
import { GenerateSubdomain } from './tools/generate-subdomain.jsx'
import { ConfigureDnsRecords } from './tools/configure-dns-records.jsx'
import { ViewDomainRecords } from './tools/view-domain-records.jsx'

export function DeveloperTools() {
  const [selectedTool, setSelectedTool] = useState('')

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4">Developer tools</Button>
      </SheetTrigger>
      <SheetContent className="bg-white overflow-y-auto">
        <SheetHeader className="px-12">
          <SheetTitle>Kibamail developer tools</SheetTitle>
          <SheetDescription>
            A suite of tools to enable to test and develop kibamail features easily.
          </SheetDescription>
        </SheetHeader>

        <div className="p-12">
          <div className="">
            <SelectField.Root value={selectedTool} onValueChange={setSelectedTool}>
              <SelectField.Label>Select a developer tool</SelectField.Label>
              <SelectField.Trigger />
              <SelectField.Content className="z-100 relative">
                {/* DNS Group */}
                <div className="px-2 py-1">
                  <Text
                    size="xs"
                    className="text-xs font-semibold kb-content-tertiary uppercase tracking-wide"
                  >
                    DNS
                  </Text>
                </div>
                <SelectField.Item value="generate-subdomain">
                  Generate subdomain
                </SelectField.Item>
                <SelectField.Item value="configure-dns-records">
                  Configure dns records
                </SelectField.Item>
                <SelectField.Item value="view-domain-records">
                  View all domain records
                </SelectField.Item>
              </SelectField.Content>
            </SelectField.Root>
          </div>

          {selectedTool && (
            <div className="mt-6">
              {selectedTool === 'generate-subdomain' && <GenerateSubdomain />}
              {selectedTool === 'configure-dns-records' && <ConfigureDnsRecords />}
              {selectedTool === 'view-domain-records' && <ViewDomainRecords />}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
