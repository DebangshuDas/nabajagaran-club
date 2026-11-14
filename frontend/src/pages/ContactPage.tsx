import { useState, type FormEvent } from "react";
import { PageHero } from "../components/ui/PageHero";
import { PlaceholderNote } from "../components/ui/PlaceholderNote";
import { SelectField, TextAreaField, TextField } from "../components/ui/TextField";

const topics = ["General", "Events", "Membership", "Directory", "Welfare"];

export default function ContactPage() {
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
        lede="A street address, phone number, and email are not published here yet. Use the note below only as a draft. It stays in this browser."
        photoLabel="Photograph — a place to meet"
      />
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <h2 className="font-display text-4xl text-maroon">Details still to be shared</h2>
          <dl className="grid gap-4 text-sm">
            <div className="border border-line bg-white p-4">
              <dt className="text-xs tracking-[0.16em] text-gold uppercase">Region</dt>
              <dd className="mt-2 text-ink">West Bengal, India</dd>
            </div>
            <div className="border border-line bg-white p-4">
              <dt className="text-xs tracking-[0.16em] text-gold uppercase">Address</dt>
              <dd className="mt-2 text-muted">Not published yet.</dd>
            </div>
            <div className="border border-line bg-white p-4">
              <dt className="text-xs tracking-[0.16em] text-gold uppercase">Phone and email</dt>
              <dd className="mt-2 text-muted">Not published yet.</dd>
            </div>
          </dl>
          <PlaceholderNote>
            Social profiles are named in the footer without links, until the club shares the real ones.
          </PlaceholderNote>
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
              Saved only in this browser session. Nothing was sent to nabajagaran-club.
            </p>
          ) : (
            <p className="text-sm text-muted">This form is not connected to a server.</p>
          )}
        </form>
      </section>
    </>
  );
}
