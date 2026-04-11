import { useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { CheckSquare, StickyNote, Folder as FolderIcon, Plus, Archive, Trash2, Bell } from "lucide-react"
import { useAppStore } from "@/store"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SidebarContent() {
    const { pathname } = useLocation()
    const [searchParams] = useSearchParams()
    const currentFolderId = searchParams.get("folderId")
    const { folders, tags, tasks, notes, addFolder, addTag } = useAppStore()
    const completedCount = tasks.filter(t => t.status === 'completed').length
    const deletedTaskCount = tasks.filter(t => t.status === 'deleted').length
    const archivedNotesCount = notes.filter(n => n.status === 'archived').length
    const deletedNotesCount = notes.filter(n => n.status === 'deleted').length

    const [isFolderOpen, setIsFolderOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")

    const [isTagOpen, setIsTagOpen] = useState(false)
    const [newTagName, setNewTagName] = useState("")
    const [newTagColor, setNewTagColor] = useState("#3b82f6")

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return
        addFolder({ name: newFolderName, type: 'note' })
        setNewFolderName("")
        setIsFolderOpen(false)
    }

    const handleCreateTag = () => {
        if (!newTagName.trim()) return
        addTag({ name: newTagName, color: newTagColor })
        setNewTagName("")
        setNewTagColor("#3b82f6")
        setIsTagOpen(false)
    }

    return (
        <div className="flex h-full flex-col">
            <div className="h-14 px-4 border-b flex items-center shrink-0">
                <h2 className="text-xl font-bold tracking-tight">Mooshi</h2>
            </div>

            <div className="flex-1 overflow-auto py-4">
                <nav className="space-y-1.5 px-3">
                    {/* Tasks section */}
                    <Link to="/">
                        <Button
                            variant={pathname === "/" && !searchParams.get("view") ? "secondary" : "ghost"}
                            className="w-full justify-start font-medium"
                        >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Tasks
                        </Button>
                    </Link>
                    <div className="pl-6 space-y-1">
                        <Link to="/?view=completed">
                            <Button
                                variant={searchParams.get("view") === "completed" ? "secondary" : "ghost"}
                                className="w-full justify-start font-normal h-8 text-sm"
                            >
                                <Archive className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                Completed
                                {completedCount > 0 && (
                                    <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-full">{completedCount}</span>
                                )}
                            </Button>
                        </Link>
                        <Link to="/?view=deleted">
                            <Button
                                variant={searchParams.get("view") === "deleted" ? "secondary" : "ghost"}
                                className="w-full justify-start font-normal h-8 text-sm"
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                Deleted
                                {deletedTaskCount > 0 && (
                                    <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-full">{deletedTaskCount}</span>
                                )}
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-1">
                        <Link to="/notes">
                            <Button
                                variant={pathname === "/notes" && !currentFolderId && !searchParams.get("view") ? "secondary" : "ghost"}
                                className="w-full justify-start font-medium"
                            >
                                <StickyNote className="mr-2 h-4 w-4" />
                                All Notes
                            </Button>
                        </Link>
                        <div className="pl-6 space-y-1">
                            <Link to="/notes?view=archived">
                                <Button
                                    variant={pathname === "/notes" && searchParams.get("view") === "archived" ? "secondary" : "ghost"}
                                    className="w-full justify-start font-normal h-8 text-sm"
                                >
                                    <Archive className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    Archived
                                    {archivedNotesCount > 0 && (
                                        <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-full">{archivedNotesCount}</span>
                                    )}
                                </Button>
                            </Link>
                            <Link to="/notes?view=deleted">
                                <Button
                                    variant={pathname === "/notes" && searchParams.get("view") === "deleted" ? "secondary" : "ghost"}
                                    className="w-full justify-start font-normal h-8 text-sm"
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    Deleted
                                    {deletedNotesCount > 0 && (
                                        <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-full">{deletedNotesCount}</span>
                                    )}
                                </Button>
                            </Link>
                        </div>
                        <div className="pl-6 pt-2">
                            <div className="flex items-center justify-between pr-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                <span>Folders</span>
                                <Dialog open={isFolderOpen} onOpenChange={setIsFolderOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-muted">
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Folder</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="folder-name">Name</Label>
                                                <Input
                                                    id="folder-name"
                                                    placeholder="E.g., Ideas"
                                                    value={newFolderName}
                                                    onChange={(e) => setNewFolderName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button onClick={handleCreateFolder} className="w-full">
                                            Create Folder
                                        </Button>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="space-y-1">
                                {folders.filter(f => f.type === 'note' || !f.type).map((folder) => (
                                    <Link key={folder.id} to={`/notes?folderId=${folder.id}`}>
                                        <Button
                                            variant={currentFolderId === folder.id ? "secondary" : "ghost"}
                                            className="w-full justify-start font-normal h-8 px-2"
                                        >
                                            <FolderIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate">{folder.name}</span>
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="mt-6 px-3">
                    <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>Tags</span>
                        <Dialog open={isTagOpen} onOpenChange={setIsTagOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-muted">
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Tag</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="tag-name">Name</Label>
                                        <Input
                                            id="tag-name"
                                            placeholder="E.g., Urgent"
                                            value={newTagName}
                                            onChange={(e) => setNewTagName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tag-color">Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="tag-color"
                                                type="color"
                                                value={newTagColor}
                                                onChange={(e) => setNewTagColor(e.target.value)}
                                                className="w-12 h-10 p-1"
                                            />
                                            <Input
                                                value={newTagColor}
                                                onChange={(e) => setNewTagColor(e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={handleCreateTag} className="w-full">
                                    Create Tag
                                </Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <nav className="space-y-1">
                        {tags.map((tag) => (
                            <div
                                key={tag.id}
                                className="flex items-center w-full px-2 py-1.5 text-sm font-normal rounded-md"
                            >
                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                                <span className="truncate">{tag.name}</span>
                            </div>
                        ))}
                    </nav>
                </div>
            </div>
            <div className="p-4 border-t">
                <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                    onClick={() => {
                        if ('Notification' in window) {
                            Notification.requestPermission().then(permission => {
                                if (permission === 'granted') {
                                    alert('Notifications enabled!');
                                }
                            });
                        }
                    }}
                >
                    <Bell className="mr-2 h-4 w-4" />
                    Enable Notifications
                </Button>
            </div>
        </div>
    )
}

export function Sidebar() {
    return (
        <div className="hidden md:flex h-screen w-64 flex-col border-r bg-muted/30">
            <SidebarContent />
        </div>
    )
}
