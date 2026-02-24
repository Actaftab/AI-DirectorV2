/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ApiKeyPrompt } from './components/ApiKeyPrompt';
import { CinematicTool } from './components/CinematicTool';

export default function App() {
  const [hasKey, setHasKey] = useState(false);

  if (!hasKey) {
    return <ApiKeyPrompt onKeySelected={() => setHasKey(true)} />;
  }

  return <CinematicTool />;
}
