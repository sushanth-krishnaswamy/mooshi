import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Heading from '@tiptap/extension-heading'
import Blockquote from '@tiptap/extension-blockquote'
import { Bold, Italic, Code, ListTodo, List, ListOrdered, Image as ImageIcon, Heading1, Heading2, Heading3, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MenuBarProps {
    editor: any
    onImageAttach?: (url: string) => void
}

const MenuBar = ({ editor, onImageAttach }: MenuBarProps) => {
    const [imageUrl, setImageUrl] = useState('')
    const [showImageInput, setShowImageInput] = useState(false)

    if (!editor) {
        return null
    }

    const handleAttach = () => {
        if (imageUrl.trim() && onImageAttach) {
            onImageAttach(imageUrl.trim())
            setImageUrl('')
            setShowImageInput(false)
        }
    }

    return (
        <div className="border-b bg-muted/30 shrink-0">
            <div className="p-2 flex flex-wrap items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
                >
                    <Heading3 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1 my-auto" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'bg-muted' : ''}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'bg-muted' : ''}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
                >
                    <Code className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1 my-auto" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'bg-muted' : ''}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'bg-muted' : ''}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    className={editor.isActive('taskList') ? 'bg-muted' : ''}
                >
                    <ListTodo className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'bg-muted' : ''}
                >
                    <Quote className="h-4 w-4" />
                </Button>

                {onImageAttach && (
                    <>
                        <div className="w-px h-6 bg-border mx-1 my-auto" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowImageInput(!showImageInput)}
                            className={showImageInput ? 'bg-muted' : ''}
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                        {showImageInput && (
                            <>
                                <Input
                                    className="h-8 w-52 text-sm"
                                    placeholder="Paste image URL..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAttach() }}
                                    autoFocus
                                />
                                <Button size="sm" onClick={handleAttach} disabled={!imageUrl.trim()}>
                                    Attach
                                </Button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

interface RichTextEditorProps {
    content: string
    onChange: (html: string) => void
    editable?: boolean
    onImageAttach?: (url: string) => void
}

export function RichTextEditor({ content, onChange, editable = true, onImageAttach }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Heading.configure({
                levels: [1, 2, 3],
            }),
            Blockquote,
            TaskList.configure({
                HTMLAttributes: {
                    class: 'not-prose pl-2',
                },
            }),
            TaskItem.configure({
                nested: true,
                HTMLAttributes: {
                    class: 'flex items-start gap-2 my-1',
                },
            }),
        ],
        content: content || '<p></p>',
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
            },
        }
    }, []) // Initialize once

    // Sync content if it changes externally (e.g. switching selected note)
    useEffect(() => {
        if (editor && content !== undefined && editor.getHTML() !== content) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    return (
        <div className="flex flex-col w-full h-full border rounded-md overflow-hidden bg-background">
            {editable && <MenuBar editor={editor} onImageAttach={onImageAttach} />}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    )
}
