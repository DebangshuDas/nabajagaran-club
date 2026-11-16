import axios from "axios";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminToast } from "../../components/admin/AdminToast";
import {
  getAdminHomepage,
  updateAdminHomepage,
} from "../../services/adminService";
import type {
  HomepageAdminResponse,
  HomepageAdminSectionResponse,
  HomepageUpdateRequest,
} from "../../types/api";

type AdminOutletContext = {
  authorization: string;
  onLogout: () => void;
  onUnsavedChangesChange: (hasChanges: boolean) => void;
};

type HomepageDraft = {
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  ctaText: string;
  ctaUrl: string;
  sections: HomepageAdminSectionResponse[];
};

type ApiErrorResponse = {
  message?: string;
};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10 disabled:bg-slate-50";

const sectionLabels: Record<HomepageAdminSectionResponse["type"], string> = {
  EVENTS: "Featured events",
  ANNOUNCEMENTS: "Featured announcements",
  INITIATIVES: "Featured initiatives",
  FESTIVALS: "Featured festivals",
  FESTIVAL_EDITIONS: "Featured festival editions",
  GALLERY_ALBUMS: "Featured gallery albums",
};

function draftFromResponse(response: HomepageAdminResponse): HomepageDraft {
  return {
    heroTitle: response.heroTitle,
    heroSubtitle: response.heroSubtitle ?? "",
    heroImageUrl: response.heroImageUrl ?? "",
    ctaText: response.ctaText ?? "",
    ctaUrl: response.ctaUrl ?? "",
    sections: response.sections.map((section) => ({
      ...section,
      selectedIds: [...section.selectedIds],
    })),
  };
}

function requestFromDraft(draft: HomepageDraft): HomepageUpdateRequest {
  return {
    heroTitle: draft.heroTitle,
    heroSubtitle: optionalText(draft.heroSubtitle),
    heroImageUrl: optionalText(draft.heroImageUrl),
    ctaText: optionalText(draft.ctaText),
    ctaUrl: optionalText(draft.ctaUrl),
    sections: draft.sections.map(({ type, visible, displayOrder, selectedIds }) => ({
      type,
      visible,
      displayOrder,
      selectedIds,
    })),
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isValidSiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return !trimmed.includes("\\");
  try {
    const url = new URL(trimmed);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function errorMessage(error: unknown, fallback: string, onLogout: () => void) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      onLogout();
      return "Your admin access could not be verified. Please sign in again.";
    }
    if (error.response?.data?.message) return error.response.data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function HomepageManagementPage() {
  const { authorization, onLogout, onUnsavedChangesChange } =
    useOutletContext<AdminOutletContext>();
  const [savedRequest, setSavedRequest] = useState<HomepageUpdateRequest | null>(null);
  const [draft, setDraft] = useState<HomepageDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    getAdminHomepage(authorization)
      .then((response) => {
        if (!isCurrent) return;
        const nextDraft = draftFromResponse(response);
        setDraft(nextDraft);
        setSavedRequest(requestFromDraft(nextDraft));
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(errorMessage(error, "Homepage configuration could not be loaded.", onLogout));
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [authorization, onLogout, refreshKey]);

  const currentRequest = useMemo(
    () => draft ? requestFromDraft(draft) : null,
    [draft],
  );
  const isDirty = Boolean(
    currentRequest && savedRequest
      && JSON.stringify(currentRequest) !== JSON.stringify(savedRequest),
  );

  useEffect(() => {
    onUnsavedChangesChange(isDirty);
  }, [isDirty, onUnsavedChangesChange]);

  useEffect(() => {
    if (!isDirty || isSaving) return;
    function preventAccidentalLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", preventAccidentalLeave);
    return () => window.removeEventListener("beforeunload", preventAccidentalLeave);
  }, [isDirty, isSaving]);

  function updateDraft(update: (current: HomepageDraft) => HomepageDraft) {
    setDraft((current) => current ? update(current) : current);
    setValidationError(null);
    setToast(null);
  }

  function updateSection(
    type: HomepageAdminSectionResponse["type"],
    update: (section: HomepageAdminSectionResponse) => HomepageAdminSectionResponse,
  ) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => section.type === type ? update(section) : section),
    }));
  }

  function moveSection(type: HomepageAdminSectionResponse["type"], direction: -1 | 1) {
    updateDraft((current) => {
      const index = current.sections.findIndex((section) => section.type === type);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.sections.length) return current;
      const sections = [...current.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return {
        ...current,
        sections: sections.map((section, displayOrder) => ({ ...section, displayOrder })),
      };
    });
  }

  async function saveHomepage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentRequest || !draft) return;
    if (!isValidSiteUrl(draft.heroImageUrl)) {
      setValidationError("Hero image must be a valid HTTP, HTTPS, or site-relative URL.");
      return;
    }
    if (!isValidSiteUrl(draft.ctaUrl)) {
      setValidationError("Call-to-action URL must be a valid HTTP, HTTPS, or site-relative URL.");
      return;
    }
    if (!isDirty) return;

    setIsSaving(true);
    setToast(null);
    setValidationError(null);
    try {
      const response = await updateAdminHomepage(authorization, currentRequest);
      const nextDraft = draftFromResponse(response);
      setDraft(nextDraft);
      setSavedRequest(requestFromDraft(nextDraft));
      setToast({ message: "Homepage configuration saved.", variant: "success" });
    } catch (error) {
      setToast({
        message: errorMessage(error, "Homepage configuration could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function discardChanges() {
    if (!savedRequest || !draft) return;
    if (isDirty && !window.confirm("Discard your unsaved homepage changes?")) return;
    setDraft({
      heroTitle: savedRequest.heroTitle,
      heroSubtitle: savedRequest.heroSubtitle ?? "",
      heroImageUrl: savedRequest.heroImageUrl ?? "",
      ctaText: savedRequest.ctaText ?? "",
      ctaUrl: savedRequest.ctaUrl ?? "",
      sections: draft.sections.map((section) => {
        const saved = savedRequest.sections.find(({ type }) => type === section.type);
        return {
          ...section,
          visible: saved?.visible ?? section.visible,
          displayOrder: saved?.displayOrder ?? section.displayOrder,
          selectedIds: saved?.selectedIds ?? section.selectedIds,
        };
      }).sort((left, right) => left.displayOrder - right.displayOrder),
    });
    setValidationError(null);
    setToast(null);
  }

  function refresh() {
    if (isDirty && !window.confirm("Reload the homepage configuration and discard unsaved changes?")) return;
    setIsLoading(true);
    setLoadError(null);
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Homepage Management"
        description="Choose the published content and sections visitors see on the public homepage."
        actions={
          <button
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading || isSaving}
            onClick={refresh}
            type="button"
          >
            Refresh
          </button>
        }
      />

      {toast && (
        <AdminToast
          message={toast.message}
          onDismiss={() => setToast(null)}
          variant={toast.variant}
        />
      )}

      {isLoading ? (
        <div aria-busy="true" className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading homepage configuration...
        </div>
      ) : loadError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
          <p className="text-sm text-red-800">{loadError}</p>
          <button className="mt-3 text-sm font-semibold text-red-900 underline" onClick={refresh} type="button">
            Try again
          </button>
        </section>
      ) : draft ? (
        <form className="space-y-5" onSubmit={(event) => void saveHomepage(event)}>
          <fieldset className="space-y-5" disabled={isSaving}>
            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">Hero content</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Hero title *
                  <input
                    className={fieldClass}
                    maxLength={200}
                    onChange={(event) => updateDraft((current) => ({ ...current, heroTitle: event.target.value }))}
                    required
                    value={draft.heroTitle}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Hero subtitle
                  <textarea
                    className={fieldClass}
                    maxLength={500}
                    onChange={(event) => updateDraft((current) => ({ ...current, heroSubtitle: event.target.value }))}
                    rows={2}
                    value={draft.heroSubtitle ?? ""}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Hero image URL
                  <input
                    className={fieldClass}
                    maxLength={255}
                    onChange={(event) => updateDraft((current) => ({ ...current, heroImageUrl: event.target.value }))}
                    placeholder="https://... or /images/..."
                    type="text"
                    value={draft.heroImageUrl ?? ""}
                  />
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Call-to-action text
                    <input
                      className={fieldClass}
                      maxLength={100}
                      onChange={(event) => updateDraft((current) => ({ ...current, ctaText: event.target.value }))}
                      value={draft.ctaText ?? ""}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Call-to-action URL
                    <input
                      className={fieldClass}
                      maxLength={255}
                      onChange={(event) => updateDraft((current) => ({ ...current, ctaUrl: event.target.value }))}
                      placeholder="/membership or https://..."
                      value={draft.ctaUrl ?? ""}
                    />
                  </label>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Images use an existing image URL or a path served by your site; this project does not have file upload storage.
              </p>
            </section>

            <section aria-labelledby="homepage-sections-heading" className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900" id="homepage-sections-heading">
                  Homepage sections
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Toggle visibility, reorder sections, and select only published records.
                </p>
              </div>
              {draft.sections.map((section, index) => (
                <section
                  aria-labelledby={`homepage-section-${section.type}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
                  key={section.type}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        aria-label={`Show ${sectionLabels[section.type]}`}
                        checked={section.visible}
                        className="size-4 accent-[#7b1e2b]"
                        onChange={(event) => updateSection(section.type, (current) => ({
                          ...current,
                          visible: event.target.checked,
                        }))}
                        type="checkbox"
                      />
                      <h3 className="font-semibold text-slate-900" id={`homepage-section-${section.type}`}>
                        {sectionLabels[section.type]}
                      </h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        aria-label={`Move ${sectionLabels[section.type]} up`}
                        className="rounded-md border border-slate-300 p-2 text-slate-600 disabled:opacity-40"
                        disabled={index === 0}
                        onClick={() => moveSection(section.type, -1)}
                        type="button"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        aria-label={`Move ${sectionLabels[section.type]} down`}
                        className="rounded-md border border-slate-300 p-2 text-slate-600 disabled:opacity-40"
                        disabled={index === draft.sections.length - 1}
                        onClick={() => moveSection(section.type, 1)}
                        type="button"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                  {section.options.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                      There are no published records available for this section.
                    </p>
                  ) : (
                    <fieldset className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                      <legend className="sr-only">{sectionLabels[section.type]} content</legend>
                      {section.options.map((option) => (
                        <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-slate-50" key={option.id}>
                          <input
                            checked={section.selectedIds.includes(option.id)}
                            className="mt-1 size-4 accent-[#7b1e2b]"
                            onChange={(event) => updateSection(section.type, (current) => ({
                              ...current,
                              selectedIds: event.target.checked
                                ? [...current.selectedIds, option.id]
                                : current.selectedIds.filter((id) => id !== option.id),
                            }))}
                            type="checkbox"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-slate-800">{option.title}</span>
                            {option.detail && (
                              <span className="mt-0.5 block truncate text-xs text-slate-500">{option.detail}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  )}
                </section>
              ))}
            </section>
          </fieldset>

          {validationError && <p className="text-sm text-red-700" role="alert">{validationError}</p>}
          <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Selected content is removed from the public page when it is unpublished or deleted.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={isSaving || !isDirty}
                onClick={discardChanges}
                type="button"
              >
                Discard
              </button>
              <button
                className="rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#641925] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving || !isDirty}
                type="submit"
              >
                {isSaving ? "Saving..." : "Save Homepage"}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}
