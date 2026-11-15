import axios from "axios";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminToast } from "../../components/admin/AdminToast";
import { getClubProfile, updateClubProfile } from "../../services/adminService";
import type { ClubDetailsResponse, ClubProfileUpdateRequest } from "../../types/api";

type AdminOutletContext = {
  authorization: string;
  onLogout: () => void;
  onUnsavedChangesChange: (hasChanges: boolean) => void;
};

type ClubProfileFormValues = {
  clubName: string;
  tagline: string;
  description: string;
  mission: string;
  foundedYear: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  email: string;
  phone: string;
  website: string;
  facebookUrl: string;
  instagramUrl: string;
};

type ApiErrorResponse = {
  message?: string;
};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10 disabled:bg-slate-50";

function formValuesFromProfile(profile: ClubDetailsResponse): ClubProfileFormValues {
  return {
    clubName: profile.clubName?.trim() ?? "",
    tagline: profile.tagline?.trim() ?? "",
    description: profile.description?.trim() ?? "",
    mission: profile.mission?.trim() ?? "",
    foundedYear: profile.foundedYear == null ? "" : String(profile.foundedYear),
    address: profile.address?.trim() ?? "",
    city: profile.city?.trim() ?? "",
    state: profile.state?.trim() ?? "",
    country: profile.country?.trim() ?? "",
    postalCode: profile.postalCode?.trim() ?? "",
    email: profile.email?.trim() ?? "",
    phone: profile.phone?.trim() ?? "",
    website: profile.website?.trim() ?? "",
    facebookUrl: profile.facebookUrl?.trim() ?? "",
    instagramUrl: profile.instagramUrl?.trim() ?? "",
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toUpdateRequest(values: ClubProfileFormValues): ClubProfileUpdateRequest {
  return {
    clubName: values.clubName.trim(),
    tagline: optionalText(values.tagline),
    description: optionalText(values.description),
    mission: optionalText(values.mission),
    foundedYear: values.foundedYear.trim() ? Number(values.foundedYear) : null,
    address: optionalText(values.address),
    city: optionalText(values.city),
    state: optionalText(values.state),
    country: optionalText(values.country),
    postalCode: optionalText(values.postalCode),
    email: optionalText(values.email),
    phone: optionalText(values.phone),
    website: optionalText(values.website),
    facebookUrl: optionalText(values.facebookUrl),
    instagramUrl: optionalText(values.instagramUrl),
  };
}

function isValidHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
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

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ClubProfileManagementPage() {
  const { authorization, onLogout, onUnsavedChangesChange } =
    useOutletContext<AdminOutletContext>();
  const [profile, setProfile] = useState<ClubDetailsResponse | null>(null);
  const [values, setValues] = useState<ClubProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getClubProfile()
      .then((response) => {
        if (!isCurrent) return;
        setProfile(response);
        setValues(formValuesFromProfile(response));
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(errorMessage(error, "Club profile could not be loaded.", onLogout));
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [authorization, onLogout, refreshKey]);

  const isDirty = useMemo(
    () => Boolean(profile && values
      && JSON.stringify(values) !== JSON.stringify(formValuesFromProfile(profile))),
    [profile, values],
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

  function updateValue<K extends keyof ClubProfileFormValues>(
    key: K,
    value: ClubProfileFormValues[K],
  ) {
    setValues((current) => current ? { ...current, [key]: value } : current);
    setValidationError(null);
    setToast(null);
  }

  function cancelChanges() {
    if (!profile) return;
    if (isDirty && !window.confirm("Discard your unsaved club profile changes?")) return;
    setValues(formValuesFromProfile(profile));
    setValidationError(null);
    setToast(null);
  }

  function refreshProfile() {
    if (isDirty && !window.confirm("Reload the club profile and discard unsaved changes?")) return;
    setIsLoading(true);
    setLoadError(null);
    setRefreshKey((current) => current + 1);
  }

  function validate(valuesToValidate: ClubProfileFormValues) {
    const trimmedName = valuesToValidate.clubName.trim();
    if (!trimmedName) return "Club name is required.";

    const foundingYear = valuesToValidate.foundedYear.trim();
    const currentYear = new Date().getFullYear();
    if (foundingYear) {
      const year = Number(foundingYear);
      if (!Number.isInteger(year) || year < 1800 || year > currentYear) {
        return `Founding year must be a whole year between 1800 and ${currentYear}.`;
      }
    }
    const email = valuesToValidate.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address.";
    }
    for (const [label, url] of [
      ["Website", valuesToValidate.website],
      ["Facebook URL", valuesToValidate.facebookUrl],
      ["Instagram URL", valuesToValidate.instagramUrl],
    ] as const) {
      if (!isValidHttpUrl(url)) return `${label} must be a valid HTTP or HTTPS URL.`;
    }
    return null;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values || !profile) return;
    const error = validate(values);
    if (error) {
      setValidationError(error);
      return;
    }
    if (!isDirty) return;

    setIsSaving(true);
    setToast(null);
    setValidationError(null);
    try {
      const updatedProfile = await updateClubProfile(authorization, toUpdateRequest(values));
      setProfile(updatedProfile);
      setValues(formValuesFromProfile(updatedProfile));
      setToast({ message: "Club profile changes saved.", variant: "success" });
    } catch (saveError) {
      setToast({
        message: errorMessage(saveError, "Club profile could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Club Profile"
        description="Manage the information displayed across the public website."
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading}
            onClick={refreshProfile}
            type="button"
          >
            <RefreshCw size={15} />
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
        <div aria-busy="true" aria-label="Loading club profile" className="space-y-5">
          {[0, 1, 2].map((section) => (
            <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6" key={section}>
              <div className="h-5 w-48 rounded bg-slate-100" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="h-11 rounded bg-slate-100" />
                <div className="h-11 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
          <p className="text-sm text-red-800">{loadError}</p>
          <button
            className="mt-3 text-sm font-semibold text-red-900 underline"
            onClick={refreshProfile}
            type="button"
          >
            Try again
          </button>
        </section>
      ) : profile && values ? (
        <form className="space-y-5" onSubmit={(event) => void saveProfile(event)}>
          <fieldset className="space-y-5" disabled={isSaving}>
            <section aria-labelledby="basic-information-heading" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-base font-semibold text-slate-900" id="basic-information-heading">
                Basic Information
              </h3>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <ProfileInput
                  id="club-name"
                  label="Club Name"
                  maxLength={150}
                  required
                  value={values.clubName}
                  onChange={(value) => updateValue("clubName", value)}
                />
                <ProfileInput
                  id="club-tagline"
                  label="Tagline"
                  maxLength={200}
                  value={values.tagline}
                  onChange={(value) => updateValue("tagline", value)}
                />
                <ProfileTextArea
                  id="club-description"
                  label="Description"
                  maxLength={10000}
                  value={values.description}
                  onChange={(value) => updateValue("description", value)}
                />
                <ProfileTextArea
                  id="club-mission"
                  label="Mission"
                  maxLength={10000}
                  value={values.mission}
                  onChange={(value) => updateValue("mission", value)}
                />
                <ProfileInput
                  id="club-founded-year"
                  label="Founded Year"
                  max={new Date().getFullYear()}
                  min={1800}
                  type="number"
                  value={values.foundedYear}
                  onChange={(value) => updateValue("foundedYear", value)}
                />
              </div>
            </section>

            <section aria-labelledby="location-information-heading" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-base font-semibold text-slate-900" id="location-information-heading">
                Location Information
              </h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <ProfileInput id="club-address" label="Address" maxLength={255} value={values.address} onChange={(value) => updateValue("address", value)} />
                <ProfileInput id="club-city" label="City" maxLength={100} value={values.city} onChange={(value) => updateValue("city", value)} />
                <ProfileInput id="club-state" label="State" maxLength={100} value={values.state} onChange={(value) => updateValue("state", value)} />
                <ProfileInput id="club-country" label="Country" maxLength={100} value={values.country} onChange={(value) => updateValue("country", value)} />
                <ProfileInput id="club-postal-code" label="Postal Code" maxLength={20} value={values.postalCode} onChange={(value) => updateValue("postalCode", value)} />
              </div>
            </section>

            <section aria-labelledby="contact-information-heading" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-base font-semibold text-slate-900" id="contact-information-heading">
                Contact Information
              </h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <ProfileInput id="club-email" label="Official Email" maxLength={150} type="email" value={values.email} onChange={(value) => updateValue("email", value)} />
                <ProfileInput id="club-phone" label="Phone Number" maxLength={50} type="tel" value={values.phone} onChange={(value) => updateValue("phone", value)} />
                <ProfileInput id="club-website" label="Website URL" maxLength={255} type="url" value={values.website} onChange={(value) => updateValue("website", value)} />
              </div>
            </section>

            <section aria-labelledby="social-media-heading" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-base font-semibold text-slate-900" id="social-media-heading">
                Social Media
              </h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <ProfileInput id="club-facebook" label="Facebook URL" maxLength={255} type="url" value={values.facebookUrl} onChange={(value) => updateValue("facebookUrl", value)} />
                <ProfileInput id="club-instagram" label="Instagram URL" maxLength={255} type="url" value={values.instagramUrl} onChange={(value) => updateValue("instagramUrl", value)} />
              </div>
            </section>
          </fieldset>

          {validationError && <p className="text-sm text-red-700" role="alert">{validationError}</p>}

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Last updated: {profile.updatedAt ? formatUpdatedAt(profile.updatedAt) : "Not available"}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={isSaving || !isDirty}
                onClick={cancelChanges}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#641925] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving || !isDirty}
                type="submit"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}

type ProfileInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "url" | "number";
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
};

function ProfileInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  maxLength,
  min,
  max,
}: ProfileInputProps) {
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
      {label}{required ? " *" : ""}
      <input
        className={fieldClass}
        id={id}
        max={max}
        maxLength={maxLength}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={type === "number" ? 1 : undefined}
        type={type}
        value={value}
      />
    </label>
  );
}

type ProfileTextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
};

function ProfileTextArea({ id, label, value, onChange, maxLength }: ProfileTextAreaProps) {
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <textarea
        className={fieldClass}
        id={id}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        value={value}
      />
    </label>
  );
}
