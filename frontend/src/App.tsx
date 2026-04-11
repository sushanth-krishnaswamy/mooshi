import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "./components/layout/Layout"
import { Tasks } from "./pages/Tasks"
import { Notes } from "./pages/Notes"
import { ThemeProvider } from "./components/theme-provider"
import { useEffect, useRef } from "react"
import { useAppStore } from "./store"
import { isBefore, addHours, parseISO } from "date-fns"

function App() {
  const fetchInitialData = useAppStore(state => state.fetchInitialData);
  const tasks = useAppStore(state => state.tasks);
  const notifiedTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        const now = new Date();
        const nextHour = addHours(now, 1);

        tasks.forEach(task => {
          if (task.dueDate && !task.completed && task.status === 'active' && !notifiedTasks.current.has(task.id)) {
            const dueDate = parseISO(task.dueDate);
            if (isBefore(dueDate, nextHour) && isBefore(now, dueDate)) {
              new Notification("Task Due Soon", {
                body: `The task "${task.title}" is due soon!`,
              });
              notifiedTasks.current.add(task.id);
            }
          }
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks]);
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
