import { useState, useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { isBefore, startOfDay, isToday, isTomorrow, addDays, isWithinInterval, parseISO } from "date-fns"
import { Search, Plus, Calendar as CalendarIcon, Tag, CheckSquare, StickyNote, ChevronDown, ChevronRight, Trash2, RotateCcw, Archive, GripVertical } from "lucide-react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

import { useAppStore } from "@/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export function Tasks() {
    const { tasks, notes, addTask, updateTask, toggleTask, deleteTask, permanentlyDeleteTask, restoreTask, tags, reorderTasks } = useAppStore()
    const [searchParams] = useSearchParams()
    const view = searchParams.get("view") ?? "active"  // "active" | "completed" | "deleted"

    const [search, setSearch] = useState("")
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

    // Delete confirmation state
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const toggleNoteCollapse = (noteId: string) => {
        setExpandedNotes(prev => {
            const next = new Set(prev)
            next.has(noteId) ? next.delete(noteId) : next.add(noteId)
            return next
        })
    }

    // Dialog state
    const [open, setOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [taskForm, setTaskForm] = useState<{ title: string; description: string; dueDate: string; tags: string[] }>({
        title: "", description: "", dueDate: "", tags: []
    })

    const handleOpenAdd = () => {
        setTaskForm({ title: "", description: "", dueDate: "", tags: [] })
        setEditingId(null)
        setOpen(true)
    }

    const handleOpenEdit = (task: typeof tasks[0]) => {
        setTaskForm({
            title: task.title,
            description: task.description || "",
            dueDate: task.dueDate || "",
            tags: task.tags || []
        })
        setEditingId(task.id)
        setOpen(true)
    }

    const handleSaveTask = () => {
        if (!taskForm.title.trim()) return

        const taskData = {
            title: taskForm.title,
            description: taskForm.description,
            dueDate: taskForm.dueDate || undefined,
            tags: taskForm.tags,
        }

        if (editingId) {
            updateTask(editingId, taskData)
        } else {
            addTask({ ...taskData, completed: false, status: 'active' })
        }

        setOpen(false)
    }

    // Helper: handle delete — soft-delete from active/completed views, confirm-then-permanently-delete from deleted view
    const handleDeleteClick = (id: string) => {
        if (view === "deleted") {
            setConfirmDeleteId(id)  // show permanent-delete confirmation
        } else {
            deleteTask(id)  // soft delete
        }
    }

    const { noteGroups, groupedTasks } = useMemo(() => {
        const today = startOfDay(new Date())
        const next7DaysEnd = addDays(today, 7)

        const statusFilter = view === "completed" ? "completed" : view === "deleted" ? "deleted" : "active"

        const filtered = tasks.filter(t =>
            t.status === statusFilter &&
            (t.title.toLowerCase().includes(search.toLowerCase()) ||
                (t.description || "").toLowerCase().includes(search.toLowerCase()))
        )

        // Group note-linked tasks by noteId (only for active view)
        const noteGroupMap = new Map<string, typeof tasks>()
        const manualTasks: typeof tasks = []

        filtered.forEach(task => {
            if (task.noteId && view === "active") {
                const existing = noteGroupMap.get(task.noteId) || []
                existing.push(task)
                noteGroupMap.set(task.noteId, existing)
            } else {
                manualTasks.push(task)
            }
        })

        const noteGroups = Array.from(noteGroupMap.entries()).map(([noteId, noteTasks]) => ({
            noteId,
            noteTitle: notes.find(n => n.id === noteId)?.title || 'Untitled Note',
            tasks: noteTasks,
        }))

        // Group manual tasks by date (only relevant for active view)
        const groups = {
            Overdue: [] as typeof tasks,
            Today: [] as typeof tasks,
            Tomorrow: [] as typeof tasks,
            "Next 7 Days": [] as typeof tasks,
            Other: [] as typeof tasks,
        }

        manualTasks.sort((a, b) => a.order - b.order).forEach((task) => {
            if (!task.dueDate) {
                groups.Other.push(task)
                return
            }
            const dueDate = startOfDay(parseISO(task.dueDate))
            if (isBefore(dueDate, today)) {
                groups.Overdue.push(task)
            } else if (isToday(dueDate)) {
                groups.Today.push(task)
            } else if (isTomorrow(dueDate)) {
                groups.Tomorrow.push(task)
            } else if (isWithinInterval(dueDate, { start: addDays(today, 2), end: next7DaysEnd })) {
                groups["Next 7 Days"].push(task)
            } else {
                groups.Other.push(task)
            }
        })

        return { noteGroups, groupedTasks: groups }
    }, [tasks, notes, search, view])

    const totalFiltered = Object.values(groupedTasks).reduce((sum, arr) => sum + arr.length, 0) + noteGroups.length

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return

        const sourceIndex = result.source.index
        const destinationIndex = result.destination.index

        if (sourceIndex === destinationIndex && result.source.droppableId === result.destination.droppableId) return

        const groupTasks = groupedTasks[result.source.droppableId as keyof typeof groupedTasks]
        if (!groupTasks) return

        const newItems = Array.from(groupTasks)
        const [reorderedItem] = newItems.splice(sourceIndex, 1)
        newItems.splice(destinationIndex, 0, reorderedItem)

        const updates = newItems.map((item, index) => ({
            id: item.id,
            order: index
        }))

        reorderTasks(updates)
    }

    // Reusable task row renderer
    const renderTaskRow = (task: typeof tasks[0], opts?: { compact?: boolean, dragHandleProps?: any }) => (
        <div
            className={`group flex items-start gap-3 ${opts?.compact ? "px-4 py-3" : "p-3 rounded-lg border border-transparent hover:border-border"} hover:bg-muted/50 transition-colors bg-card`}
        >
            {view === "active" && opts?.dragHandleProps && (
                <div {...opts.dragHandleProps} className="mt-1 cursor-grab opacity-0 group-hover:opacity-50 hover:!opacity-100 shrink-0">
                    <GripVertical className="h-4 w-4" />
                </div>
            )}
            {view === "active" && (
                <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-0.5 shrink-0"
                />
            )}
            <div className="flex-1 min-w-0 space-y-1">
                <p className={`font-medium leading-snug ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                </p>
                {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {task.dueDate && (
                        <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                    )}
                    {task.tags.map(tagId => {
                        const t = tags.find(x => x.id === tagId)
                        if (!t) return null
                        return (
                            <div key={t.id} className="flex items-center text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                                <Tag className="mr-1 h-3 w-3" />
                                {t.name}
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {view === "deleted" && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        title="Restore"
                        onClick={() => restoreTask(task.id)}
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                )}
                {view === "active" && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => handleOpenEdit(task)}
                    >
                        <span className="sr-only">Edit</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteClick(task.id)}
                    title={view === "deleted" ? "Delete forever" : "Delete"}
                >
                    <span className="sr-only">Delete</span>
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )

    const viewMeta = {
        active: {
            title: "Tasks",
            icon: <CheckSquare className="h-6 w-6" />,
            emptyMsg: "No tasks yet",
            emptyHint: "Get started by adding a new task using the button above.",
        },
        completed: {
            title: "Completed Tasks",
            icon: <Archive className="h-6 w-6" />,
            emptyMsg: "No completed tasks",
            emptyHint: "Check off tasks to see them archived here.",
        },
        deleted: {
            title: "Deleted Tasks",
            icon: <Trash2 className="h-6 w-6" />,
            emptyMsg: "No deleted tasks",
            emptyHint: "Deleted tasks will appear here before being permanently removed.",
        },
    }[view as 'active' | 'completed' | 'deleted'] ?? { title: "Tasks", icon: null, emptyMsg: "No tasks", emptyHint: "" }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{viewMeta.title}</h1>
                {view === "active" && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleOpenAdd}>
                                <Plus className="mr-2 h-4 w-4" /> Add Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Edit Task" : "Add New Task"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="task-title">Title</Label>
                                    <Input
                                        id="task-title"
                                        placeholder="What do you need to do?"
                                        value={taskForm.title}
                                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTask() }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="task-desc">Description</Label>
                                    <Textarea
                                        id="task-desc"
                                        placeholder="Optional details..."
                                        value={taskForm.description}
                                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                        className="min-h-[80px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="task-due">Due Date</Label>
                                    <Input
                                        id="task-due"
                                        type="date"
                                        value={taskForm.dueDate}
                                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map(tag => {
                                            const isSelected = taskForm.tags.includes(tag.id)
                                            return (
                                                <Badge
                                                    key={tag.id}
                                                    variant={isSelected ? "default" : "outline"}
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        setTaskForm(prev => ({
                                                            ...prev,
                                                            tags: isSelected
                                                                ? prev.tags.filter(t => t !== tag.id)
                                                                : [...prev.tags, tag.id]
                                                        }))
                                                    }}
                                                    style={isSelected ? { backgroundColor: tag.color, color: '#fff' } : { borderColor: tag.color, color: tag.color }}
                                                >
                                                    {tag.name}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                                <Button className="w-full mt-4" onClick={handleSaveTask}>
                                    {editingId ? "Save Changes" : "Save Task"}
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

            {/* Permanent delete confirmation dialog */}
            <Dialog open={!!confirmDeleteId} onOpenChange={(o) => { if (!o) setConfirmDeleteId(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Permanently Delete Task?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The task will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => {
                            if (confirmDeleteId) permanentlyDeleteTask(confirmDeleteId)
                            setConfirmDeleteId(null)
                        }}>
                            Delete Forever
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex-1 overflow-auto bg-card rounded-xl border shadow-sm p-4 space-y-6">

                {/* Active view: date-grouped manual tasks first, then note groups */}
                {view === "active" && (
                    <>
                        {(Object.entries(groupedTasks) as [keyof typeof groupedTasks, typeof tasks][]).map(([groupName, groupTasks]) => {
                            if (groupTasks.length === 0) return null
                            return (
                                <Droppable key={groupName} droppableId={groupName}>
                                    {(provided) => (
                                        <div key={groupName} className="space-y-2" ref={provided.innerRef} {...provided.droppableProps}>
                                            <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                                                {groupName}
                                                <Badge variant="secondary" className="ml-auto rounded-full">
                                                    {groupTasks.length}
                                                </Badge>
                                            </h3>
                                            <div className="space-y-1">
                                                {groupTasks.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps}>
                                                                {renderTaskRow(task, { dragHandleProps: provided.dragHandleProps })}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            )
                        })}

                        {/* Note-sourced groups come AFTER regular tasks */}
                        {noteGroups.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                                    <StickyNote className="h-4 w-4" />
                                    From Notes
                                </h3>
                                <div className="space-y-3">
                                    {noteGroups.map(({ noteId, noteTitle, tasks: noteTasks }) => {
                                        const isCollapsed = !expandedNotes.has(noteId)
                                        const completedCount = noteTasks.filter(t => t.completed).length
                                        return (
                                            <div key={noteId} className="border rounded-lg overflow-hidden">
                                                <button
                                                    className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                                                    onClick={() => toggleNoteCollapse(noteId)}
                                                >
                                                    {isCollapsed
                                                        ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    }
                                                    <Link
                                                        to={`/notes?noteId=${noteId}`}
                                                        onClick={e => e.stopPropagation()}
                                                        className="flex-1 min-w-0 text-sm font-semibold hover:text-primary transition-colors truncate"
                                                    >
                                                        {noteTitle}
                                                    </Link>
                                                    <Badge variant="secondary" className="rounded-full ml-auto shrink-0 text-xs">
                                                        {completedCount}/{noteTasks.length}
                                                    </Badge>
                                                </button>
                                                {!isCollapsed && (
                                                    <div className="divide-y">
                                                        {noteTasks.map(task => (
                                                            <div key={task.id}>
                                                                {renderTaskRow(task, { compact: true })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Completed / Deleted flat list */}
                {(view === "completed" || view === "deleted") && (
                    <div className="space-y-1">
                        {Object.values(groupedTasks).flat().map(task => (
                            <div key={task.id}>
                                {renderTaskRow(task)}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty states */}
                {totalFiltered === 0 && tasks.filter(t => t.status === (view === "active" ? "active" : view === "completed" ? "completed" : "deleted")).length > 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No tasks found matching your search.
                    </div>
                )}

                {tasks.filter(t => t.status === (view === "active" ? "active" : view === "completed" ? "completed" : "deleted")).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            {viewMeta.icon}
                        </div>
                        <p className="text-lg font-medium text-foreground">{viewMeta.emptyMsg}</p>
                        <p className="max-w-sm mt-1">{viewMeta.emptyHint}</p>
                    </div>
                )}
            </div>
        </div>
        </DragDropContext>
    )
}
