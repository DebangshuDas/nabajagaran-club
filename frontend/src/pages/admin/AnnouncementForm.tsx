import { useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AdminFormActions } from "../../components/admin/AdminFormActions";
import { AnnouncementContent } from "../../components/ui/AnnouncementContent";
import type {
  AnnouncementCreateRequest,
  AnnouncementResponse,
  AnnouncementUpdateRequest,
} from "../../types/api";

type AnnouncementFormProps = {
  announcement: AnnouncementResponse | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (request: AnnouncementCreateRequest | AnnouncementUpdateRequest) => void;
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10";

export function AnnouncementForm({
  announcement,
  isSubmitting,
  onCancel,
  onSubmit,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [content, setContent] = useState(announcement?.content ?? "");
  const [audience, setAudience] = useState(announcement?.audience ?? "");
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationError, setValidationError] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function applyInline(before: string, after = before) {
    const textarea = contentRef.current;
    if (!textarea) return;
    const selected = content.slice(textarea.selectionStart, textarea.selectionEnd);
    const insertion = `${before}${selected || "text"}${after}`;
    const start = textarea.selectionStart;
    const next = `${content.slice(0, start)}${insertion}${content.slice(textarea.selectionEnd)}`;
    setContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const selectionStart = start + before.length;
      textarea.setSelectionRange(
        selectionStart,
        selectionStart + (selected ? selected.length : "text".length),
      );
    });
  }

  function applyLinePrefix(prefix: string) {
    const textarea = contentRef.current;
    if (!textarea) return;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const lineStart = content.lastIndexOf("\n", selectionStart - 1) + 1;
    const selected = content.slice(selectionStart, selectionEnd);
    const lineEnd = content.indexOf("\n", selectionStart);
    const target = selected || content.slice(lineStart, lineEnd < 0 ? content.length : lineEnd);
    const prefixed = target.split("\n").map((line) => `${prefix}${line}`).join("\n");
    const replacementStart = selected ? selectionStart : lineStart;
    const next = `${content.slice(0, replacementStart)}${prefixed}${content.slice(
      selected ? selectionEnd : lineStart + target.length,
    )}`;
    setContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = replacementStart + prefixed.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      setValidationError("Title and content are required.");
      return;
    }
    setValidationError("");
    if (announcement) {
      onSubmit({
        title: trimmedTitle,
        content: trimmedContent,
        audience: audience.trim() || null,
      });
    } else {
      onSubmit({
        title: trimmedTitle,
        content: trimmedContent,
        audience: audience.trim() || null,
        publishImmediately,
      });
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">
          {announcement ? "Edit announcement" : "Create announcement"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Content formatting uses lightweight Markdown and is previewed as it will appear publicly.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <fieldset className="space-y-5" disabled={isSubmitting}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="announcement-title">
            Title *
            <input
              className={inputClass}
              id="announcement-title"
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700" htmlFor="announcement-content">
            Content *
            <div className="mt-1.5 flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-slate-300 bg-slate-50 p-2">
              <button className="rounded px-2.5 py-1 text-xs font-bold hover:bg-white" onClick={() => applyInline("**")} type="button">Bold</button>
              <button className="rounded px-2.5 py-1 text-xs italic hover:bg-white" onClick={() => applyInline("*")} type="button">Italic</button>
              <button className="rounded px-2.5 py-1 text-xs font-medium hover:bg-white" onClick={() => applyLinePrefix("## ")} type="button">Heading</button>
              <button className="rounded px-2.5 py-1 text-xs hover:bg-white" onClick={() => applyLinePrefix("- ")} type="button">Bullets</button>
              <button className="rounded px-2.5 py-1 text-xs hover:bg-white" onClick={() => applyLinePrefix("1. ")} type="button">Numbered list</button>
              <button className="rounded px-2.5 py-1 text-xs underline hover:bg-white" onClick={() => applyInline("[", "](https://example.com)")} type="button">Link</button>
              <button
                aria-pressed={showPreview}
                className="ml-auto inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs hover:bg-white"
                onClick={() => setShowPreview((current) => !current)}
                type="button"
              >
                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPreview ? "Hide preview" : "Preview"}
              </button>
            </div>
            <textarea
              aria-describedby="announcement-content-help"
              className="w-full rounded-b-lg border border-slate-300 px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10"
              id="announcement-content"
              maxLength={20000}
              onChange={(event) => setContent(event.target.value)}
              ref={contentRef}
              required
              rows={9}
              value={content}
            />
            <span className="mt-1 block text-xs font-normal text-slate-500" id="announcement-content-help">
              Separate paragraphs with a blank line. Use Markdown syntax for headings, lists, links, bold, and italic text.
            </span>
          </label>

          {showPreview && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Content preview</p>
              <AnnouncementContent className="space-y-2 text-sm leading-relaxed text-slate-700" content={content} />
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="announcement-audience">
              Audience <span className="font-normal text-slate-500">(optional)</span>
              <input
                className={inputClass}
                id="announcement-audience"
                maxLength={50}
                onChange={(event) => setAudience(event.target.value)}
                placeholder="e.g. Public, Members"
                value={audience}
              />
            </label>
            {!announcement && (
              <label className="block text-sm font-medium text-slate-700" htmlFor="announcement-publication">
                Publication
                <select
                  className={inputClass}
                  id="announcement-publication"
                  onChange={(event) => setPublishImmediately(event.target.value === "publish")}
                  value={publishImmediately ? "publish" : "draft"}
                >
                  <option value="draft">Save as draft</option>
                  <option value="publish">Publish immediately</option>
                </select>
              </label>
            )}
          </div>
        </fieldset>

        {validationError && <p className="text-sm text-red-700" role="alert">{validationError}</p>}
        <AdminFormActions
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          submitLabel={announcement ? "Save changes" : "Create announcement"}
        />
      </form>
    </section>
  );
}
