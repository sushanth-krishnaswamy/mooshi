import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "./components/layout/Layout"
import { Tasks } from "./pages/Tasks"
import { Notes } from "./pages/Notes"
import { ThemeProvider } from "./components/theme-provider"
import { useEffect } from "react"
import { useAppStore } from "./store"

function App() {
  useEffect(() => {
    // Fetch initial state from PostgreSQL backend
    useAppStore.getState().initialize();
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Tasks />} />
            <Route path="notes" element={<Notes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
