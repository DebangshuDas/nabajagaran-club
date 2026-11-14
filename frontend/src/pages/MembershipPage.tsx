import { useState, type FormEvent } from "react";
import { PageHero } from "../components/ui/PageHero";
import { PlaceholderNote } from "../components/ui/PlaceholderNote";
import { SelectField, TextAreaField, TextField } from "../components/ui/TextField";

const interests = [
  "Cultural programmes",
  "Community welfare",
  "Local directory",
  "General membership",
];

const points = [
  "Hear about gatherings once the club announces them.",
  "Offer time for welfare work the club actually runs.",
  "Stay connected to neighbourhood life without a published fee yet.",
];

export default function MembershipPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("");
  const [interest, setInterest] = useState(interests[0]);
  const [note, setNote] = useState("");
  const [kept, setKept] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setKept(true);
  }

  return (
    <>
      <PageHero
        bengali="সদস্য"
        eyebrow="Become a member"
        title="A place in the club, when the club opens it."
        lede="This page explains how someone can ask to take part. It does not set a fee, a rule, or a list of current members."
        photoLabel="Photograph — members gathering"
        tone="maroon"
      />
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className="font-display text-4xl text-maroon">What membership can mean</h2>
          <ul className="mt-6 space-y-4">
            {points.map((point) => (
              <li key={point} className="border-l-2 border-gold pl-4 leading-relaxed text-ink/90">
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <PlaceholderNote>
              Any contribution, eligibility, or approval step must come from the club. This form does
              not enroll anyone.
            </PlaceholderNote>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-5 border border-line bg-white p-6 md:p-8">
          <TextField id="member-name" label="Full name" value={name} onChange={setName} required autoComplete="name" />
          <TextField
            id="member-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <TextField
            id="member-phone"
            label="Phone (optional)"
            type="tel"
            value={phone}
            onChange={setPhone}
            autoComplete="tel"
          />
          <TextField
            id="member-locality"
            label="Locality (optional)"
            value={locality}
            onChange={setLocality}
            autoComplete="address-level2"
          />
          <SelectField
            id="member-interest"
            label="How you hope to take part"
            value={interest}
            onChange={setInterest}
            options={interests}
          />
          <TextAreaField id="member-note" label="Note" value={note} onChange={setNote} />
          <button type="submit" className="bg-maroon px-5 py-3 text-sm font-medium text-ivory hover:bg-maroon-dark">
            Keep this request on this page
          </button>
          {kept ? (
            <p className="text-sm leading-relaxed text-maroon" role="status">
              Held in this browser only, {name.trim() || "friend"}. Nabajaran Club has not received it.
            </p>
          ) : (
            <p className="text-sm text-muted">Nothing on this form is stored on a server.</p>
          )}
        </form>
      </section>
    </>
  );
}
