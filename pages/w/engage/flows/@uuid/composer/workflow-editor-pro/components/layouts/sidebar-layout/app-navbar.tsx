'use client';

import * as React from 'react';

import AppPopover from '../../app-popover.jsx';

export function AppNavbar() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <AppPopover />
    </div>
  );
}
