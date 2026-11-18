import axios from "axios";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminToast } from "../../components/admin/AdminToast";
import {
  createAdminGalleryAlbum,
  deleteAdminGalleryAlbum,
  deleteAdminGalleryImage,
  getAdminGalleryAlbum,
  getAdminGalleryAlbums,
  getGalleryAssociationOptions,
  publishAdminGalleryAlbum,
  publishAdminGalleryImage,
  reorderAdminGalleryImages,
  unpublishAdminGalleryAlbum,
  unpublishAdminGalleryImage,
  updateAdminGalleryAlbum,
  updateAdminGalleryImage,
  uploadAdminGalleryImages,
} from "../../services/adminService";
import type {
  GalleryAlbumRequest,
  GalleryAlbumResponse,
  GalleryAssociationOptionResponse,
  GalleryAssociationType,
  GalleryImageMetadataRequest,
  GalleryImageResponse,
} from "../../types/api";
import { safeHttpUrl } from "../../utils/urls";

type AdminOutletContext = {
  authorization: string;
  onLogout: () => void;
  onUnsavedChangesChange: (hasChanges: boolean) => void;
};

type AlbumAssociationType = GalleryAssociationType | "NONE";

type AlbumForm = {
  title: string;
  description: string;
  category: string;
  associationType: AlbumAssociationType;
  associationId: string;
  coverImageId: string;
  published: boolean;
};

type ImageDraft = {
  title: string;
  caption: string;
  altText: string;
};

type BackendError = {
  message?: string;
};

const pageSize = 10;
const associationTypes: { value: AlbumAssociationType; label: string }[] = [
  { value: "NONE", label: "General club activity" },
  { value: "EVENT", label: "Event" },
  { value: "INITIATIVE", label: "Community initiative" },
  { value: "FESTIVAL_EDITION", label: "Festival edition" },
];

const emptyForm: AlbumForm = {
  title: "",
  description: "",
  category: "",
  associationType: "NONE",
  associationId: "",
  coverImageId: "",
  published: false,
};

function getErrorMessage(error: unknown, fallback: string, onLogout: () => void) {
  if (axios.isAxiosError<BackendError>(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      onLogout();
      return "Your admin access could not be verified. Please sign in again.";
    }
    if (error.response?.data?.message) return error.response.data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function formFromAlbum(album: GalleryAlbumResponse): AlbumForm {
  const associationType: AlbumAssociationType = album.eventId
    ? "EVENT"
    : album.initiativeId
      ? "INITIATIVE"
      : album.festivalEditionId
        ? "FESTIVAL_EDITION"
        : "NONE";
  const associationId = album.eventId ?? album.initiativeId ?? album.festivalEditionId;
  return {
    title: album.title,
    description: album.description ?? "",
    category: album.category ?? "",
    associationType,
    associationId: associationId?.toString() ?? "",
    coverImageId:
      album.images.find((image) => image.imageUrl === album.coverImageUrl)?.id.toString() ?? "",
    published: album.published,
  };
}

function requestFromForm(form: AlbumForm): GalleryAlbumRequest {
  const associationId = form.associationId ? Number(form.associationId) : null;
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    category: form.category.trim() || null,
    coverImageId: form.coverImageId ? Number(form.coverImageId) : null,
    eventId: form.associationType === "EVENT" ? associationId : null,
    initiativeId: form.associationType === "INITIATIVE" ? associationId : null,
    festivalEditionId: form.associationType === "FESTIVAL_EDITION" ? associationId : null,
    published: form.published,
  };
}

function albumAssociationLabel(album: GalleryAlbumResponse) {
  if (album.eventTitle) return `Event · ${album.eventTitle}`;
  if (album.initiativeTitle) return `Initiative · ${album.initiativeTitle}`;
  if (album.festivalName) return `Festival · ${album.festivalName} ${album.editionYear ?? ""}`.trim();
  return "General club activity";
}

function imageDraftFrom(image: GalleryImageResponse): ImageDraft {
  return {
    title: image.title ?? "",
    caption: image.caption ?? "",
    altText: image.altText ?? "",
  };
}

export function GalleryManagementPage() {
  const { authorization, onLogout, onUnsavedChangesChange } =
    useOutletContext<AdminOutletContext>();
  const [albums, setAlbums] = useState<GalleryAlbumResponse[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbumResponse | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbumResponse | null>(null);
  const [form, setForm] = useState<AlbumForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [publicationFilter, setPublicationFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [associationOptions, setAssociationOptions] =
    useState<GalleryAssociationOptionResponse[]>([]);
  const [associationSearch, setAssociationSearch] = useState("");
  const [associationLoading, setAssociationLoading] = useState(false);
  const [associationError, setAssociationError] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageBusyId, setImageBusyId] = useState<number | null>(null);
  const [imageDrafts, setImageDrafts] = useState<Record<number, ImageDraft>>({});

  const associationOptionType =
    form.associationType === "NONE" ? null : form.associationType;
  const publishedFilter =
    publicationFilter === "" ? undefined : publicationFilter === "published";
  const availableCategories = useMemo(
    () => [...new Set(albums.map((album) => album.category?.trim()).filter(
      (category): category is string => Boolean(category),
    ))].sort((left, right) => left.localeCompare(right)),
    [albums],
  );

  const handleDirtyChange = useCallback(
    (hasChanges: boolean) => {
      setFormDirty(hasChanges);
      onUnsavedChangesChange(hasChanges);
    },
    [onUnsavedChangesChange],
  );

  const refreshAlbums = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;
    getAdminGalleryAlbums(authorization, {
      search,
      category: categoryFilter,
      published: publishedFilter,
      page,
      size: pageSize,
    })
      .then((response) => {
        if (!Array.isArray(response.content)) {
          throw new Error("The gallery service returned an unexpected response.");
        }
        if (active) {
          setAlbums(response.content);
          setTotalAlbums(response.totalElements);
          setTotalPages(response.totalPages);
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(getErrorMessage(error, "Gallery albums could not be loaded.", onLogout));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorization, categoryFilter, onLogout, page, publishedFilter, refreshKey, search]);

  useEffect(() => {
    if (!associationOptionType) {
      return;
    }
    let active = true;
    getGalleryAssociationOptions(authorization, associationOptionType, associationSearch)
      .then((response) => {
        if (active) setAssociationOptions(response.content);
      })
      .catch((error: unknown) => {
        if (active) {
          setAssociationError(
            getErrorMessage(error, "Association options could not be loaded.", onLogout),
          );
        }
      })
      .finally(() => {
        if (active) setAssociationLoading(false);
      });
    return () => {
      active = false;
    };
  }, [associationOptionType, associationSearch, authorization, onLogout]);

  function updateForm<K extends keyof AlbumForm>(field: K, value: AlbumForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    handleDirtyChange(true);
  }

  function openCreateForm() {
    if (formOpen && formDirty && !window.confirm("Discard your unsaved album changes?")) return;
    setEditingAlbum(null);
    setForm(emptyForm);
    setFormOpen(true);
    setAssociationSearch("");
    setAssociationOptions([]);
    setAssociationError(null);
    setUploadFiles([]);
    setSelectedAlbum(null);
    handleDirtyChange(false);
  }

  function openEditForm(album: GalleryAlbumResponse) {
    if (formOpen && formDirty && !window.confirm("Discard your unsaved album changes?")) return;
    setEditingAlbum(album);
    setForm(formFromAlbum(album));
    setFormOpen(true);
    setAssociationOptions([]);
    setAssociationError(null);
    setAssociationSearch(
      album.eventTitle ?? album.initiativeTitle
        ?? (album.festivalName
          ? `${album.festivalName} ${album.editionYear ?? ""}`.trim()
          : ""),
    );
    setUploadFiles([]);
    handleDirtyChange(false);
  }

  function closeForm() {
    if (formDirty && !window.confirm("Discard your unsaved album changes?")) return;
    setFormOpen(false);
    setEditingAlbum(null);
    setForm(emptyForm);
    setUploadFiles([]);
    handleDirtyChange(false);
  }

  async function saveAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setToast(null);
    try {
      const request = requestFromForm(form);
      const saved = editingAlbum
        ? await updateAdminGalleryAlbum(authorization, editingAlbum.id, request)
        : await createAdminGalleryAlbum(authorization, request);
      setToast({
        message: editingAlbum ? "Album changes saved." : "Album created.",
        variant: "success",
      });
      setFormOpen(false);
      setEditingAlbum(null);
      setForm(emptyForm);
      handleDirtyChange(false);
      setSelectedAlbum(saved);
      setPage(0);
      refreshAlbums();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The album could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function openAlbum(albumId: number) {
    setLoadError(null);
    try {
      const response = await getAdminGalleryAlbum(authorization, albumId);
      setSelectedAlbum(response);
      setImageDrafts({});
      setUploadFiles([]);
      setToast(null);
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The album could not be opened.", onLogout),
        variant: "error",
      });
    }
  }

  async function changeAlbumPublication(album: GalleryAlbumResponse) {
    try {
      const updated = album.published
        ? await unpublishAdminGalleryAlbum(authorization, album.id)
        : await publishAdminGalleryAlbum(authorization, album.id);
      setToast({
        message: album.published ? "Album unpublished." : "Album published.",
        variant: "success",
      });
      if (selectedAlbum?.id === album.id) setSelectedAlbum(updated);
      refreshAlbums();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Album publication could not be changed.", onLogout),
        variant: "error",
      });
    }
  }

  async function removeAlbum(album: GalleryAlbumResponse) {
    if (!window.confirm(`Delete “${album.title}” and its images? This is a soft delete.`)) return;
    try {
      await deleteAdminGalleryAlbum(authorization, album.id);
      if (selectedAlbum?.id === album.id) setSelectedAlbum(null);
      setToast({ message: "Album and its images were deleted.", variant: "success" });
      refreshAlbums();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The album could not be deleted.", onLogout),
        variant: "error",
      });
    }
  }

  async function uploadSelectedImages() {
    if (!selectedAlbum || uploadFiles.length === 0) return;
    setIsUploading(true);
    setToast(null);
    try {
      await uploadAdminGalleryImages(authorization, selectedAlbum.id, uploadFiles);
      await openAlbum(selectedAlbum.id);
      setToast({ message: `${uploadFiles.length} image(s) uploaded as drafts.`, variant: "success" });
      refreshAlbums();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Images could not be uploaded.", onLogout),
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function updateImageDraft(image: GalleryImageResponse, field: keyof ImageDraft, value: string) {
    setImageDrafts((current) => ({
      ...current,
      [image.id]: {
        ...imageDraftFrom(image),
        ...current[image.id],
        [field]: value,
      },
    }));
  }

  async function saveImageMetadata(image: GalleryImageResponse) {
    if (!selectedAlbum) return;
    const draft = { ...imageDraftFrom(image), ...imageDrafts[image.id] };
    const request: GalleryImageMetadataRequest = {
      albumId: selectedAlbum.id,
      title: draft.title.trim() || null,
      caption: draft.caption.trim() || null,
      altText: draft.altText.trim() || null,
      displayOrder: image.displayOrder,
      published: image.published,
    };
    setImageBusyId(image.id);
    try {
      await updateAdminGalleryImage(authorization, image.id, request);
      await openAlbum(selectedAlbum.id);
      setToast({ message: "Image details saved.", variant: "success" });
      refreshAlbums();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Image details could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setImageBusyId(null);
    }
  }

  async function changeImagePublication(image: GalleryImageResponse) {
    setImageBusyId(image.id);
    try {
      if (image.published) {
        await unpublishAdminGalleryImage(authorization, image.id);
      } else {
        await publishAdminGalleryImage(authorization, image.id);
      }
      await openAlbum(image.albumId);
      setToast({ message: image.published ? "Image unpublished." : "Image published.", variant: "success" });
      refreshAlbums();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Image publication could not be changed.", onLogout),
        variant: "error",
      });
    } finally {
      setImageBusyId(null);
    }
  }

  async function removeImage(image: GalleryImageResponse) {
    if (!selectedAlbum || !window.confirm("Soft-delete this gallery image?")) return;
    setImageBusyId(image.id);
    try {
      await deleteAdminGalleryImage(authorization, image.id);
      await openAlbum(selectedAlbum.id);
      setToast({ message: "Image deleted.", variant: "success" });
      refreshAlbums();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The image could not be deleted.", onLogout),
        variant: "error",
      });
    } finally {
      setImageBusyId(null);
    }
  }

  async function moveImage(image: GalleryImageResponse, direction: -1 | 1) {
    if (!selectedAlbum) return;
    const images = [...selectedAlbum.images];
    const currentIndex = images.findIndex((item) => item.id === image.id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= images.length) return;
    [images[currentIndex], images[nextIndex]] = [images[nextIndex], images[currentIndex]];
    try {
      const reordered = await reorderAdminGalleryImages(authorization, selectedAlbum.id, {
        imageIds: images.map((item) => item.id),
      });
      setSelectedAlbum({ ...selectedAlbum, images: reordered });
      refreshAlbums();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Image order could not be saved.", onLogout),
        variant: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gallery management"
        description="Organize published club photographs into albums and connect them to events, initiatives, or festival editions."
        actions={
          <button
            className="rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#641925]"
            onClick={openCreateForm}
            type="button"
          >
            Create album
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

      {formOpen && (
        <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={saveAlbum}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {editingAlbum ? "Edit album" : "Create album"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                An album can be associated with one event, initiative, or festival edition.
              </p>
            </div>
            <button
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
              onClick={closeForm}
              type="button"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Album title
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
                maxLength={200}
                onChange={(event) => updateForm("title", event.target.value)}
                required
                value={form.title}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Category
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
                maxLength={50}
                onChange={(event) => updateForm("category", event.target.value)}
                placeholder="Optional"
                value={form.category}
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              maxLength={10000}
              onChange={(event) => updateForm("description", event.target.value)}
              value={form.description}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Associated content
              <select
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                onChange={(event) => {
                  updateForm("associationType", event.target.value as AlbumAssociationType);
                  updateForm("associationId", "");
                  setAssociationSearch("");
                  setAssociationLoading(event.target.value !== "NONE");
                }}
                value={form.associationType}
              >
                {associationTypes.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            {associationOptionType && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Find associated content
                  <input
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
                    onChange={(event) => {
                      setAssociationLoading(true);
                      setAssociationSearch(event.target.value);
                    }}
                    placeholder="Search title"
                    value={associationSearch}
                  />
                </label>
                {associationLoading ? (
                  <p className="mt-2 text-xs text-slate-500" role="status">Loading options...</p>
                ) : associationError ? (
                  <p className="mt-2 text-xs text-red-700" role="alert">{associationError}</p>
                ) : (
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    onChange={(event) => updateForm("associationId", event.target.value)}
                    required
                    value={form.associationId}
                  >
                    <option value="">Select content</option>
                    {editingAlbum && form.associationId && !associationOptions.some(
                      (option) => String(option.id) === form.associationId,
                    ) && (
                      <option value={form.associationId}>
                        {albumAssociationLabel(editingAlbum)}
                      </option>
                    )}
                    {associationOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}{option.detail ? ` · ${option.detail}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
          {editingAlbum && editingAlbum.images.length > 0 && (
            <label className="block max-w-md text-sm font-medium text-slate-700">
              Cover image
              <select
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                onChange={(event) => updateForm("coverImageId", event.target.value)}
                value={form.coverImageId}
              >
                <option value="">No cover image</option>
                {editingAlbum.images.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.title || `Image ${image.id}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              checked={form.published}
              onChange={(event) => updateForm("published", event.target.checked)}
              type="checkbox"
            />
            Publish album
          </label>
          <div className="flex justify-end gap-2">
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              onClick={closeForm}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-[#7b1e2b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving..." : editingAlbum ? "Save album" : "Create album"}
            </button>
          </div>
        </form>
      )}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex-1 text-sm font-medium text-slate-700">
            Search albums
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => {
                setPage(0);
                setIsLoading(true);
                setSearch(event.target.value);
              }}
              value={search}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Category
            <select
              className="mt-1.5 min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2"
              onChange={(event) => {
                setPage(0);
                setIsLoading(true);
                setCategoryFilter(event.target.value);
              }}
              value={categoryFilter}
            >
              <option value="">All categories</option>
              {availableCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Publication
            <select
              className="mt-1.5 min-w-40 rounded-lg border border-slate-300 bg-white px-3 py-2"
              onChange={(event) => {
                setPage(0);
                setIsLoading(true);
                setPublicationFilter(event.target.value);
              }}
              value={publicationFilter}
            >
              <option value="">All albums</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500" role="status">Loading gallery albums...</p>
        ) : loadError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-800">{loadError}</p>
            <button
              className="mt-3 text-sm font-semibold text-red-900 underline"
              onClick={refreshAlbums}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : albums.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No gallery albums match these filters.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {albums.map((album) => (
              <article className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between" key={album.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{album.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      album.published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {album.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {album.category || "Uncategorized"} · {albumAssociationLabel(album)} · {album.imageCount} images
                  </p>
                  {album.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{album.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                    onClick={() => void openAlbum(album.id)}
                    type="button"
                  >
                    Manage images
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                    onClick={() => openEditForm(album)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                    onClick={() => void changeAlbumPublication(album)}
                    type="button"
                  >
                    {album.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700"
                    onClick={() => void removeAlbum(album)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {!isLoading && !loadError && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">{totalAlbums} albums</p>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                disabled={page === 0}
                onClick={() => {
                  setIsLoading(true);
                  setPage((current) => current - 1);
                }}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                disabled={page + 1 >= totalPages}
                onClick={() => {
                  setIsLoading(true);
                  setPage((current) => current + 1);
                }}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedAlbum && (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedAlbum.title}</h3>
              <p className="mt-1 text-sm text-slate-500">Upload, edit, publish, or reorder album images.</p>
            </div>
            <button
              className="text-sm font-medium text-slate-500 underline"
              onClick={() => setSelectedAlbum(null)}
              type="button"
            >
              Close
            </button>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 p-4 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-slate-700">
              Select JPEG or PNG images (up to 10 files, 10 MiB each)
              <input
                accept="image/jpeg,image/png"
                className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#f8eff0] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#7b1e2b]"
                multiple
                onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
                type="file"
              />
            </label>
            <button
              className="rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              disabled={isUploading || uploadFiles.length === 0 || uploadFiles.length > 10}
              onClick={() => void uploadSelectedImages()}
              type="button"
            >
              {isUploading ? "Uploading..." : `Upload ${uploadFiles.length || ""} image(s)`}
            </button>
          </div>
          {uploadFiles.length > 10 && (
            <p className="text-sm text-red-700" role="alert">Select no more than 10 files per upload.</p>
          )}
          {selectedAlbum.images.length === 0 ? (
            <p className="py-6 text-sm text-slate-500">No images have been uploaded to this album.</p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {selectedAlbum.images.map((image, index) => {
                const draft = { ...imageDraftFrom(image), ...imageDrafts[image.id] };
                const imageUrl = safeHttpUrl(image.imageUrl);
                return (
                  <article className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-[150px_1fr]" key={image.id}>
                    {imageUrl ? (
                      <img
                        alt={draft.altText || draft.title || ""}
                        className="aspect-square w-full rounded-md bg-slate-100 object-cover"
                        src={imageUrl}
                      />
                    ) : (
                      <div className="grid aspect-square place-items-center rounded-md bg-slate-100 text-xs text-slate-500">
                        Image preview unavailable
                      </div>
                    )}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-600">
                        Image title
                        <input
                          className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm font-normal"
                          maxLength={200}
                          onChange={(event) => updateImageDraft(image, "title", event.target.value)}
                          value={draft.title}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-slate-600">
                        Caption
                        <textarea
                          className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm font-normal"
                          maxLength={10000}
                          onChange={(event) => updateImageDraft(image, "caption", event.target.value)}
                          value={draft.caption}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-slate-600">
                        Alternative text
                        <input
                          className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm font-normal"
                          maxLength={255}
                          onChange={(event) => updateImageDraft(image, "altText", event.target.value)}
                          value={draft.altText}
                        />
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="rounded-md bg-[#7b1e2b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          disabled={imageBusyId === image.id}
                          onClick={() => void saveImageMetadata(image)}
                          type="button"
                        >
                          Save details
                        </button>
                        <button
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                          disabled={index === 0}
                          onClick={() => void moveImage(image, -1)}
                          type="button"
                        >
                          Move up
                        </button>
                        <button
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                          disabled={index === selectedAlbum.images.length - 1}
                          onClick={() => void moveImage(image, 1)}
                          type="button"
                        >
                          Move down
                        </button>
                        <button
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                          disabled={imageBusyId === image.id}
                          onClick={() => void changeImagePublication(image)}
                          type="button"
                        >
                          {image.published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
                          disabled={imageBusyId === image.id}
                          onClick={() => void removeImage(image)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
