import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { PageHero } from "../components/ui/PageHero";
import { PlaceholderNote } from "../components/ui/PlaceholderNote";
import { SelectField, TextAreaField, TextField } from "../components/ui/TextField";
import type { SiteLayoutContext } from "../components/layout/SiteLayout";
import { safeHttpUrl } from "../utils/urls";

const topics = ["General", "Events", "Membership", "Directory", "Welfare"];

export default function ContactPage() {
  const { club, clubLoading, clubError } = useOutletContext<SiteLayoutContext>();
  const location = [club?.city, club?.state, club?.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  const address = [club?.address, club?.postalCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  const phone = club?.phone?.trim();
  const clubEmail = club?.email?.trim();
  const websiteUrl = safeHttpUrl(club?.website);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState("");
  const [kept, setKept] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setKept(true);
  }

  return (
    <>
      <PageHero
        bengali="যোগাযোগ"
        eyebrow="Contact us"
        title="Write to the club."
        lede="Club contact details are listed below when they have been provided."
        photoLabel="Photograph — a place to meet"
      />
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <h2 className="font-display text-4xl text-maroon">Club Details</h2>
          {clubLoading && <p className="text-sm text-muted" role="status">Loading club details...</p>}
          {clubError && <p className="text-sm text-red-700" role="status">Club details are temporarily unavailable.</p>}
          <dl className="grid gap-4 text-sm">
            <div className="border border-line bg-white p-4">
              <dt className="text-xs tracking-[0.16em] text-gold uppercase">Location</dt>
              <dd className="mt-2 text-ink">
                {location || "Not provided"}
              </dd>
            </div>
            <div className="border border-line bg-white p-4">
              <dt className="text-xs tracking-[0.16em] text-gold uppercase">Address</dt>
              <dd className="mt-2 text-muted">
                {address || "Not provided"}
              </dd>
            </div>
            <div className="border border-line bg-white p-4">
              <dt className="text-xs tracking-[0.16em] text-gold uppercase">Phone</dt>
              <dd className="mt-2 text-muted">
                {phone ? <a href={`tel:${phone}`}>{phone}</a> : "Not provided"}
              </dd>
            </div>
            <div className="border border-line bg-white p-4">
              <dt className="text-xs tracking-[0.16em] text-gold uppercase">Official Email</dt>
              <dd className="mt-2 text-muted">
                {clubEmail ? <a href={`mailto:${clubEmail}`}>{clubEmail}</a> : "Not provided"}
              </dd>
            </div>
            {websiteUrl && (
              <div className="border border-line bg-white p-4">
                <dt className="text-xs tracking-[0.16em] text-gold uppercase">Website</dt>
                <dd className="mt-2 text-muted">
                  <a href={websiteUrl} rel="noreferrer" target="_blank">
                    {club?.website?.trim()}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <PlaceholderNote>Contact notes created below stay in this browser and are not sent.</PlaceholderNote>
        </div>
        <form onSubmit={onSubmit} className="space-y-5 border border-line bg-white p-6 md:p-8">
          <TextField id="contact-name" label="Name" value={name} onChange={setName} required autoComplete="name" />
          <TextField
            id="contact-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <SelectField id="contact-topic" label="Topic" value={topic} onChange={setTopic} options={topics} />
          <TextAreaField id="contact-message" label="Message" value={message} onChange={setMessage} required />
          <button type="submit" className="bg-maroon px-5 py-3 text-sm font-medium text-ivory hover:bg-maroon-dark">
            Keep this note on this page
          </button>
          {kept ? (
            <p className="text-sm leading-relaxed text-maroon" role="status">
              Saved only in this browser session. Nothing was sent to {club?.clubName?.trim() || "the club"}.
            </p>
          ) : (
            <p className="text-sm text-muted">This form is not connected to a server.</p>
          )}
        </form>
      </section>
    </>
  );
}
