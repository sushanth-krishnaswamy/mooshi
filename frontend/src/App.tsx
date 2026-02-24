import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "./components/layout/Layout"
import { Tasks } from "./pages/Tasks"
import { Notes } from "./pages/Notes"
import { ThemeProvider } from "./components/theme-provider"
import { useEffect } from "react"

function App() {
  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(res => res.json())
      .then(data => console.log('Backend health:', data))
      .catch(err => console.error('Backend connection error:', err));
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
