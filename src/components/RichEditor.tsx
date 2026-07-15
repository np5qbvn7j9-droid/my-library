import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useEffect, useRef } from 'react'

export default function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: 'اكتب هنا… استخدم [[اسم ملاحظة]] للربط بين الملاحظات' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Load new content when switching notes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!editor) return null

  const B = ({ label, on, act, title }: { label: string; on?: boolean; act: () => void; title: string }) => (
    <button type="button" className={on ? 'on' : ''} title={title} onMouseDown={(e) => { e.preventDefault(); act() }}>
      {label}
    </button>
  )

  function addImage(file: File) {
    if (file.size > 400 * 1024 && !confirm('الصورة كبيرة وقد تبطئ المزامنة. المتابعة؟')) return
    const reader = new FileReader()
    reader.onload = () => editor!.chain().focus().setImage({ src: reader.result as string }).run()
    reader.readAsDataURL(file)
  }

  return (
    <div
      onDrop={(e) => {
        const f = e.dataTransfer?.files?.[0]
        if (f && f.type.startsWith('image/')) { e.preventDefault(); addImage(f) }
      }}
    >
      <div className="editor-toolbar">
        <B label="H1" title="عنوان 1" on={editor.isActive('heading', { level: 1 })} act={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <B label="H2" title="عنوان 2" on={editor.isActive('heading', { level: 2 })} act={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <B label="H3" title="عنوان 3" on={editor.isActive('heading', { level: 3 })} act={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <div className="sep" />
        <B label="B" title="عريض" on={editor.isActive('bold')} act={() => editor.chain().focus().toggleBold().run()} />
        <B label="I" title="مائل" on={editor.isActive('italic')} act={() => editor.chain().focus().toggleItalic().run()} />
        <B label="U" title="تحته خط" on={editor.isActive('underline')} act={() => editor.chain().focus().toggleUnderline().run()} />
        <div className="sep" />
        <B label="•" title="قائمة نقطية" on={editor.isActive('bulletList')} act={() => editor.chain().focus().toggleBulletList().run()} />
        <B label="١." title="قائمة مرقمة" on={editor.isActive('orderedList')} act={() => editor.chain().focus().toggleOrderedList().run()} />
        <B label="☑" title="قائمة مهام" on={editor.isActive('taskList')} act={() => editor.chain().focus().toggleTaskList().run()} />
        <div className="sep" />
        <B label="❝" title="اقتباس" on={editor.isActive('blockquote')} act={() => editor.chain().focus().toggleBlockquote().run()} />
        <B label="</>" title="كود" on={editor.isActive('codeBlock')} act={() => editor.chain().focus().toggleCodeBlock().run()} />
        <B label="⊞" title="جدول" act={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
        <B label="🖼" title="صورة" act={() => fileRef.current?.click()} />
        <B
          label="🔗" title="رابط"
          on={editor.isActive('link')}
          act={() => {
            const url = prompt('أدخل الرابط:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
            else editor.chain().focus().unsetLink().run()
          }}
        />
        <div className="sep" />
        <B label="↩" title="تراجع" act={() => editor.chain().focus().undo().run()} />
        <B label="↪" title="إعادة" act={() => editor.chain().focus().redo().run()} />
      </div>
      <input
        ref={fileRef} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = '' }}
      />
      <EditorContent editor={editor} />
    </div>
  )
}
