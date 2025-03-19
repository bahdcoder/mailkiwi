'use server';

import { cookies } from 'next/headers';
import { ColorMode } from '@xyflow/react';

export async function setColorModeCookie(colorMode: ColorMode) {
  const cookieStore = await cookies();
  cookieStore.set('colorMode', colorMode);
}
