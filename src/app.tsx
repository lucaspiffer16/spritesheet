import { AppStateProvider } from './app/app-state'
import { AppShell } from './app/app-shell'
import './app.css'

export function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  )
}
