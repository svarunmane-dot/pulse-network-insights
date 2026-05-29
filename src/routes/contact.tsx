import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact – Pulse Speed" },
      {
        name: "description",
        content:
          "Get in touch with the Pulse Speed team. Feedback, partnership and support enquiries welcome.",
      },
      { property: "og:title", content: "Contact Pulse Speed" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px 80px" }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1px", margin: 0 }}>
        Contact
      </h1>
      <p style={{ color: "#c8d0e0", marginTop: 12, fontSize: 16, lineHeight: 1.6 }}>
        Questions, feedback or partnership ideas? Drop us a note.
      </p>

      <div style={{ marginTop: 16, fontSize: 14, color: "#c8d0e0" }}>
        <div>
          📧 <a href="mailto:pulse.speeed@gmail.com" style={{ color: "#00D4AA" }}>pulse.speeed@gmail.com</a>
        </div>
        <div style={{ marginTop: 6 }}>
          🔗 <a href="#" style={{ color: "#00D4AA" }}>LinkedIn</a> ·{" "}
          <a href="#" style={{ color: "#00D4AA" }}>X / Twitter</a> ·{" "}
          <a href="#" style={{ color: "#00D4AA" }}>GitHub</a>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
        style={{ marginTop: 32, display: "grid", gap: 14 }}
      >
        <Field id="name" label="Name" />
        <Field id="email" label="Email" type="email" />
        <div>
          <label
            htmlFor="message"
            style={{ display: "block", fontSize: 13, color: "#c8d0e0", marginBottom: 6 }}
          >
            Message
          </label>
          <textarea
            id="message"
            required
            rows={6}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #1f2740",
              background: "#0f1422",
              color: "#fff",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "12px 22px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg,#00D4AA,#00b894)",
            color: "#04150f",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Send message
        </button>
        {sent && (
          <div style={{ color: "#00D4AA", fontSize: 14 }} role="status">
            Thanks — we'll reply shortly.
          </div>
        )}
      </form>
    </section>
  );
}

function Field({
  id,
  label,
  type = "text",
}: {
  id: string;
  label: string;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: "block", fontSize: 13, color: "#c8d0e0", marginBottom: 6 }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "1px solid #1f2740",
          background: "#0f1422",
          color: "#fff",
          fontSize: 14,
        }}
      />
    </div>
  );
}