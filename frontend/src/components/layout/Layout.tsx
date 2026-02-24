import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Menu } from "lucide-react"

import { Sidebar, SidebarContent } from "./Sidebar"
import { ModeToggle } from "../theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Layout() {
    const [open, setOpen] = useState(false)
    const location = useLocation()

    // Close the mobile sheet when navigating to a new route
    useEffect(() => {
        setOpen(false)
    }, [location.pathname])

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar: render with matching top border strip */}
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
                    <div className="flex items-center gap-2 md:hidden">
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle mobile menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-64">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>
                        <span className="font-semibold px-2">Mooshi</span>
                    </div>
                    <div className="flex-1 hidden md:block" />
                    <ModeToggle />
                </header>
                <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
