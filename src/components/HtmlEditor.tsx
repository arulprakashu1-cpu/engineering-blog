"use client";

import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";

/**
 * Code-editor-style textarea for raw post HTML (including embedded widget
 * scripts). Using CodeMirror makes it explicit and intentional that the
 * content is hand-written HTML/JS, with syntax highlighting and line numbers.
 */
export default function HtmlEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <CodeMirror
      value={value}
      height="520px"
      extensions={[html({ autoCloseTags: true, matchClosingTags: true })]}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: true,
        autocompletion: true,
      }}
      className="overflow-hidden rounded-lg border border-slate-300 text-sm"
    />
  );
}
