import React, { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

// We use basic inline SVG icons to avoid needing another dependency right now
const IconBold = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8Z"/></svg>
const IconItalic = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
const IconList = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const IconTable = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
const IconColAdd = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
const IconRowAdd = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg> // Simplistic
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null
  }

  const btnStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    color: 'var(--fg-300)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  }

  const activeBtnStyle = {
    ...btnStyle,
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'var(--fg-100)',
  }

  return (
    <div style={{
      display: 'flex', gap: '4px', padding: '8px 12px', flexWrap: 'wrap',
      borderBottom: '1px solid var(--line-600)',
      backgroundColor: 'var(--bg-900)'
    }}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={editor.isActive('bold') ? activeBtnStyle : btnStyle}
        title="Bold"
      >
        <IconBold />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={editor.isActive('italic') ? activeBtnStyle : btnStyle}
        title="Italic"
      >
        <IconItalic />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={editor.isActive('bulletList') ? activeBtnStyle : btnStyle}
        title="Bullet List"
      >
        <IconList />
      </button>

      <div style={{ width: '1px', backgroundColor: 'var(--line-600)', margin: '0 8px' }} />

      <button
        type="button"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        style={btnStyle}
        title="Insert Table"
      >
        <IconTable />
      </button>

      {editor.isActive('table') && (
        <>
          <div style={{ width: '1px', backgroundColor: 'var(--line-600)', margin: '0 8px' }} />
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} style={btnStyle} title="Add Column After">
            + Col
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} style={btnStyle} title="Delete Column">
            - Col
          </button>
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} style={btnStyle} title="Add Row After">
            + Row
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} style={btnStyle} title="Delete Row">
            - Row
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} style={btnStyle} title="Delete Table">
            <IconTrash />
          </button>
        </>
      )}
    </div>
  )
}

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Send HTML to parent
      onChange(editor.getHTML())
    },
  })

  // Basic styling for the editor and tables inside it
  const editorStyles = `
    .ProseMirror {
      min-height: 150px;
      padding: 16px 24px;
      outline: none;
      font-size: 15px;
      line-height: 1.6;
      color: var(--fg-100);
      font-family: var(--font-sans), system-ui, sans-serif;
    }
    .ProseMirror p.is-editor-empty:first-child::before {
      color: var(--fg-500);
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }
    .ProseMirror table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;
      margin: 0;
      overflow: hidden;
    }
    .ProseMirror table td, .ProseMirror table th {
      min-width: 1em;
      border: 1px solid var(--line-600);
      padding: 8px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;
    }
    .ProseMirror table th {
      font-weight: bold;
      text-align: left;
      background-color: rgba(255, 255, 255, 0.05);
    }
    .ProseMirror table .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: -2px;
      width: 4px;
      background-color: var(--brand);
      pointer-events: none;
    }
    .ProseMirror table p {
      margin: 0;
    }
  `

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{editorStyles}</style>
      <MenuBar editor={editor} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <EditorContent editor={editor} style={{ height: '100%' }} />
      </div>
    </div>
  )
}
