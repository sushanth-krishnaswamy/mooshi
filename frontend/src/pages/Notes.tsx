import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, Plus, StickyNote, Archive, Trash2, RotateCcw } from "lucide-react"
import { RichTextEditor } from "@/components/RichTextEditor"

import { useAppStore } from "@/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function Notes() {
    const notes = useAppStore(state => state.notes)
    const addNote = useAppStore(state => state.addNote)
    const updateNote = useAppStore(state => state.updateNote)
    const deleteNote = useAppStore(state => state.deleteNote)
    const archiveNote = useAppStore(state => state.archiveNote)
    const restoreNote = useAppStore(state => state.restoreNote)
    const permanentlyDeleteNote = useAppStore(state => state.permanentlyDeleteNote)
    const folders = useAppStore(state => state.folders)

    const [searchParams, setSearchParams] = useSearchParams()
    const currentFolderId = searchParams.get("folderId")
    const currentNoteId = searchParams.get("noteId")
    const view = searchParams.get("view") ?? "active" // "active" | "archived" | "deleted"

    const addImage = (noteId: string, url: string) => {
        const note = notes.find((n) => n.id === noteId)
        if (note) updateNote(noteId, { images: [...(note.images || []), url] })
    }

    const [search, setSearch] = useState("")
    const [open, setOpen] = useState(false)
    const [newNote, setNewNote] = useState({ title: "", content: "" })
    const [selectedNote, setSelectedNote] = useState<typeof notes[0] | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    useEffect(() => {
        if (currentNoteId) {
            const note = notes.find(n => n.id === currentNoteId)
            if (note) setSelectedNote(note)
        }
    }, [currentNoteId, notes])

    const handleCloseNote = () => {
        setSelectedNote(null)
        if (currentNoteId) {
            setSearchParams(prev => { prev.delete("noteId"); return prev })
        }
    }

    const filteredNotes = notes.filter(n => {
        if (n.status !== (view === "archived" ? "archived" : view === "deleted" ? "deleted" : "active")) return false
        if (view === "active" && currentFolderId && n.folderId !== currentFolderId) return false
        return n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
    })

    const handleAddNote = () => {
        if (!newNote.title.trim() && !newNote.content.trim()) return
        addNote({
            title: newNote.title || "Untitled",
            content: newNote.content,
            status: 'active',
            tags: [],
            tasks: [],
            folderId: currentFolderId || undefined,
        })
        setNewNote({ title: "", content: "" })
        setOpen(false)
    }

    const handleUpdateContent = (content: string) => {
        if (!selectedNote) return
        updateNote(selectedNote.id, { content })
        setSelectedNote({ ...selectedNote, content })
    }

    const viewMeta = {
        active: { title: "Notes", emptyMsg: "No notes yet", emptyHint: "Capture your thoughts by creating a new note." },
        archived: { title: "Archived Notes", emptyMsg: "No archived notes", emptyHint: "Archive notes to store them here." },
        deleted: { title: "Deleted Notes", emptyMsg: "No deleted notes", emptyHint: "Deleted notes will appear here." },
    }[view as 'active' | 'archived' | 'deleted'] ?? { title: "Notes", emptyMsg: "No notes yet", emptyHint: "" }

    return (
        <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            {/* Permanent delete confirmation */}
            <Dialog open={!!confirmDeleteId} onOpenChange={(o) => { if (!o) setConfirmDeleteId(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Permanently Delete Note?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The note will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => {
                            if (confirmDeleteId) permanentlyDeleteNote(confirmDeleteId)
                            setConfirmDeleteId(null)
                        }}>
                            Delete Forever
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{viewMeta.title}</h1>
                {view === "active" && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Note
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create Note</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Input
                                        className="font-bold text-lg"
                                        placeholder="Note Title"
                                        value={newNote.title}
                                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Content</Label>
                                    <RichTextEditor
                                        content={newNote.content}
                                        onChange={(html) => setNewNote({ ...newNote, content: html })}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleAddNote}>
                                    Create
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={`Search ${viewMeta.title.toLowerCase()}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {selectedNote ? (
                <Card className="flex-1 flex flex-col overflow-hidden bg-card shadow-sm border">
                    <CardHeader className="border-b space-y-4 shrink-0 flex flex-row items-center justify-between py-3">
                        <div>
                            <CardTitle>{selectedNote.title}</CardTitle>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{new Date(selectedNote.updatedAt).toLocaleDateString()}</Badge>
                                {selectedNote.status === "archived" && <Badge variant="secondary">Archived</Badge>}
                                {selectedNote.folderId && (
                                    <Badge variant="secondary">
                                        {folders.find(f => f.id === selectedNote.folderId)?.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCloseNote}>
                                Back to List
                            </Button>
                            {selectedNote.status === "active" && (
                                <Button variant="outline" onClick={() => {
                                    archiveNote(selectedNote.id)
                                    handleCloseNote()
                                }}>
                                    <Archive className="h-4 w-4 mr-1" /> Archive
                                </Button>
                            )}
                            {(selectedNote.status === "archived" || selectedNote.status === "deleted") && (
                                <Button variant="outline" onClick={() => {
                                    restoreNote(selectedNote.id)
                                    handleCloseNote()
                                }}>
                                    <RotateCcw className="h-4 w-4 mr-1" /> Restore
                                </Button>
                            )}
                            <Button variant="destructive" onClick={() => {
                                if (selectedNote.status === "deleted") {
                                    setConfirmDeleteId(selectedNote.id)
                                } else {
                                    deleteNote(selectedNote.id)
                                    handleCloseNote()
                                }
                            }}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                {selectedNote.status === "deleted" ? "Delete Forever" : "Delete"}
                            </Button>
                        </div>
                    </CardHeader>
                    <div className={`flex flex-1 overflow-hidden w-full ${selectedNote.status !== "active" ? "pointer-events-none opacity-75" : ""}`}>
                        <RichTextEditor
                            content={selectedNote.content}
                            onChange={(html) => handleUpdateContent(html)}
                            editable={selectedNote.status === "active"}
                            onImageAttach={selectedNote.status === "active" ? (url) => {
                                addImage(selectedNote.id, url)
                                setSelectedNote({ ...selectedNote, images: [...(selectedNote.images || []), url] })
                            } : undefined}
                        />
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-auto items-start">
                    {filteredNotes.map((note) => (
                        <Card
                            key={note.id}
                            className="cursor-pointer hover:border-primary transition-colors flex flex-col shadow-sm"
                            onClick={() => setSelectedNote(note)}
                        >
                            <CardHeader className="pb-3 text-lg font-semibold space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="line-clamp-1 flex-1">{note.title}</CardTitle>
                                    <div className="flex gap-1 shrink-0">
                                        {/* Archive / Restore */}
                                        {note.status === "active" && (
                                            <Button
                                                variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"
                                                title="Archive"
                                                onClick={(e) => { e.stopPropagation(); archiveNote(note.id) }}
                                            >
                                                <Archive className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        {(note.status === "archived" || note.status === "deleted") && (
                                            <Button
                                                variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"
                                                title="Restore"
                                                onClick={(e) => { e.stopPropagation(); restoreNote(note.id) }}
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        {/* Delete */}
                                        <Button
                                            variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                            title={note.status === "deleted" ? "Delete forever" : "Delete"}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (note.status === "deleted") {
                                                    setConfirmDeleteId(note.id)
                                                } else {
                                                    deleteNote(note.id)
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground flex gap-2 flex-wrap">
                                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                    {note.folderId && <span>• {folders.find(f => f.id === note.folderId)?.name}</span>}
                                    {note.status === "archived" && <span>• Archived</span>}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden">
                                <div
                                    className="text-sm text-muted-foreground line-clamp-4 prose prose-sm dark:prose-invert max-w-none pointer-events-none"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                />
                            </CardContent>
                        </Card>
                    ))}

                    {filteredNotes.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <StickyNote className="h-6 w-6" />
                            </div>
                            <p className="text-lg font-medium text-foreground">{viewMeta.emptyMsg}</p>
                            <p className="max-w-sm mt-1">{viewMeta.emptyHint}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
