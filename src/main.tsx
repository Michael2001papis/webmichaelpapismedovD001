/*
 ================================================================
  HOLIKAR
  Hotel Maintenance & Inspection Management System

  Copyright © 2026 Michael Papismedov
  All rights reserved.

  Proprietary software.
  Unauthorized copying, distribution, modification,
  publication or commercial use is prohibited.

  Third-party libraries remain under their own licenses.
 ================================================================
*/

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { COPYRIGHT } from './config/copyright'
import { seedDatabase } from './lib/db'
import './index.css'

async function start() {
  await seedDatabase()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

console.info(`${COPYRIGHT.product} — ${COPYRIGHT.text}`)
void start()
