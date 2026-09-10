import nodemailer from "nodemailer";
import { Resend } from "resend";

/* ------------------------------------------------------------------ *
 *  Email küldés — a szolgáltató a .env-ből választódik ki:
 *
 *  1) SMTP  (Brevo / Gmail / bármi):  állítsd be az SMTP_HOST-ot.
 *       Brevo:  SMTP_HOST=smtp-relay.brevo.com  SMTP_PORT=587
 *               SMTP_USER=<brevo SMTP login>    SMTP_PASS=<brevo SMTP kulcs>
 *       Gmail:  SMTP_HOST=smtp.gmail.com        SMTP_PORT=587
 *               SMTP_USER=<gmail cím>           SMTP_PASS=<Google App Password>
 *
 *  2) Resend API:  ha nincs SMTP_HOST, de van RESEND_API_KEY.
 *
 *  3) Ha egyik sincs beállítva:  az emailek NEM mennek ki, csak a
 *     szerver konzoljára íródnak (fejlesztéshez / első teszthez).
 *
 *  Közös beállítások:
 *    MAIL_FROM      – feladó, pl. "Noir by Kriszta <foglalas@example.com>"
 *                     (SMTP-nél legyen azonos a hitelesített feladóval)
 *    MAIL_REPLY_TO  – válasz-cím (alapból az OWNER_EMAIL)
 *    OWNER_EMAIL    – ide érkeznek az admin értesítők
 *    SALON_ADDRESS  – a szalon címe az emailek láblécében
 * ------------------------------------------------------------------ */

const FROM = process.env.MAIL_FROM || "Noir by Kriszta <onboarding@resend.dev>";
const OWNER = process.env.OWNER_EMAIL || "kriszta@noirbykriszta.hu";
const REPLY_TO = process.env.MAIL_REPLY_TO || OWNER;
const ADDRESS = process.env.SALON_ADDRESS || "2119 Pécel, Kossuth Lajos utca 12.";

let provider = "console";
let smtp = null;
let resend = null;

if (process.env.SMTP_HOST) {
  provider = "smtp";
  const port = Number(process.env.SMTP_PORT || 587);
  smtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
} else if (process.env.RESEND_API_KEY) {
  provider = "resend";
  resend = new Resend(process.env.RESEND_API_KEY);
}

console.log(`[email] szolgáltató: ${provider}${provider === "smtp" ? ` (${process.env.SMTP_HOST})` : ""}`);

const fmtDateTime = (d) =>
  new Intl.DateTimeFormat("hu-HU", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Budapest",
  }).format(new Date(d));

const huf = (n) => new Intl.NumberFormat("hu-HU").format(Number(n) || 0) + " Ft";

/**
 * Elküld egy emailt. Hibát nem dob – logol és `{ ok:false }`-t ad vissza,
 * hogy egy email-probléma soha ne akassza meg a foglalási folyamatot.
 */
export async function sendMail({ to, subject, text, html }) {
  if (!to) return { ok: false, skipped: "no-recipient" };

  try {
    if (provider === "smtp") {
      const info = await smtp.sendMail({ from: FROM, to, replyTo: REPLY_TO, subject, text, html });
      return { ok: true, id: info.messageId };
    }

    if (provider === "resend") {
      const { data, error } = await resend.emails.send({
        from: FROM,
        to,
        replyTo: REPLY_TO,
        subject,
        text,
        html,
      });
      if (error) {
        console.error("Resend hiba:", error);
        return { ok: false, error };
      }
      return { ok: true, id: data?.id };
    }

    // provider === "console"
    console.log("\n📧 [EMAIL — nincs beállítva szolgáltató, csak log]");
    console.log(`   Feladó:  ${FROM}`);
    console.log(`   Címzett: ${to}`);
    console.log(`   Tárgy:   ${subject}`);
    console.log("   " + String(text || "").replace(/\n/g, "\n   ") + "\n");
    return { ok: true, mocked: true };
  } catch (e) {
    console.error("Email kivétel:", e.message);
    return { ok: false, error: e.message };
  }
}

/* ----------------------------- Sablonok ----------------------------- */

const COLORS = { dark: "#132A22", darker: "#0B1D17", gold: "#C6A15B", cream: "#FAF6EF", ink: "#1E1E1E" };

function shell(title, innerHtml) {
  return `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:${COLORS.cream};font-family:Helvetica,Arial,sans-serif;color:${COLORS.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.cream};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid ${COLORS.gold}33;border-radius:6px;overflow:hidden;">
        <tr><td style="background:${COLORS.dark};padding:28px 32px;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;color:${COLORS.gold};font-size:22px;letter-spacing:1px;">Noir by Kriszta</div>
          <div style="color:${COLORS.cream};font-size:10px;letter-spacing:4px;text-transform:uppercase;margin-top:4px;">Lash Stylist</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:normal;margin:0 0 16px;color:${COLORS.dark};">${title}</h1>
          ${innerHtml}
        </td></tr>
        <tr><td style="background:${COLORS.darker};padding:20px 32px;color:${COLORS.cream};font-size:12px;line-height:1.6;">
          Noir by Kriszta · ${ADDRESS}<br>
          Válaszért írj erre az emailre: ${REPLY_TO}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function detailsTable(appointment, service) {
  const rows = [
    ["Szolgáltatás", `${service.category} — ${service.name}`],
    ["Időpont", fmtDateTime(appointment.startTime)],
    ["Időtartam", `kb. ${service.durationMinutes} perc`],
    ["Ár (a helyszínen fizetendő)", huf(service.price)],
  ];
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border-top:1px solid ${COLORS.gold}33;">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid ${COLORS.gold}33;font-size:13px;color:#666;">${k}</td>
           <td style="padding:10px 0;border-bottom:1px solid ${COLORS.gold}33;font-size:14px;text-align:right;color:${COLORS.ink};">${v}</td></tr>`
      )
      .join("")}
  </table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  return { html, text };
}

function p(txt) {
  return `<p style="font-size:14px;line-height:1.7;margin:0 0 14px;">${txt}</p>`;
}

/* --------------------- Foglalás létrejött --------------------- */

export async function sendBookingCreated(appointment, service) {
  const d = detailsTable(appointment, service);

  // Vendégnek – az igényt megkaptuk, megerősítés hamarosan
  const guest = await sendMail({
    to: appointment.email,
    subject: "Megkaptuk a foglalási igényedet — Noir by Kriszta",
    html: shell(
      "Megkaptuk a foglalási igényedet",
      p(`Kedves ${appointment.customerName}!`) +
        p("Köszönöm a foglalásod. Az alábbi időpontot előjegyeztem — hamarosan visszaigazolom, és onnantól biztos a helyed.") +
        d.html +
        p("Ha módosítanál vagy le kell mondanod, egyszerűen válaszolj erre az emailre, vagy hívj telefonon.")
    ),
    text: `Kedves ${appointment.customerName}!

Köszönöm a foglalásod. Az alábbi időpontot előjegyeztem — hamarosan visszaigazolom.

${d.text}

Cím: ${ADDRESS}

Ha módosítanál vagy lemondanál, válaszolj erre az emailre vagy hívj telefonon.
Noir by Kriszta`,
  });

  // Adminnak – új foglalás
  const owner = await sendMail({
    to: OWNER,
    subject: `Új foglalás — ${appointment.customerName} — ${fmtDateTime(appointment.startTime)}`,
    html: shell(
      "Új online foglalás",
      d.html +
        p(
          `<strong>Vendég:</strong> ${appointment.customerName}<br>` +
            `<strong>Telefon:</strong> ${appointment.phone || "—"}<br>` +
            `<strong>Email:</strong> ${appointment.email || "—"}<br>` +
            `<strong>Megjegyzés:</strong> ${appointment.note || "—"}`
        ) +
        p("A foglalás <strong>megerősítésre vár</strong>. Az admin felületen tudod megerősíteni vagy lemondani — a vendég automatikus értesítést kap.")
    ),
    text: `Új online foglalás érkezett.

${d.text}

Vendég: ${appointment.customerName}
Telefon: ${appointment.phone || "—"}
Email: ${appointment.email || "—"}
Megjegyzés: ${appointment.note || "—"}

Státusz: megerősítésre vár.`,
  });

  return { guest, owner };
}

/* --------------- Foglalás állapota megváltozott --------------- */

const STATUS_COPY = {
  confirmed: {
    subject: "Foglalásod megerősítve — Noir by Kriszta",
    title: "A foglalásod megerősítve",
    lead: "Örömmel jelzem, hogy az időpontod megerősítettem. Lent a részletek — szeretettel várlak!",
    closing: "Ha közbejönne valami, kérlek időben jelezd (válasz erre az emailre vagy telefon).",
  },
  cancelled: {
    subject: "Foglalásod lemondva — Noir by Kriszta",
    title: "A foglalásod lemondva",
    lead: "A lenti időpont sajnos lemondásra került. Ha szeretnél új időpontot, a weboldalon bármikor foglalhatsz, vagy válaszolj erre az emailre.",
    closing: "Elnézést a kellemetlenségért — igyekszem mielőbb megfelelő időpontot találni.",
  },
  pending: {
    subject: "Foglalásod frissült — Noir by Kriszta",
    title: "A foglalásod állapota frissült",
    lead: "A foglalásod ismét megerősítésre vár.",
    closing: "Hamarosan jelentkezem a visszaigazolással.",
  },
};

export async function sendBookingStatusChanged(appointment, service) {
  const copy = STATUS_COPY[appointment.status] || STATUS_COPY.pending;
  const d = detailsTable(appointment, service);

  const guest = await sendMail({
    to: appointment.email,
    subject: copy.subject,
    html: shell(
      copy.title,
      p(`Kedves ${appointment.customerName}!`) + p(copy.lead) + d.html + p(copy.closing)
    ),
    text: `Kedves ${appointment.customerName}!

${copy.lead}

${d.text}

Cím: ${ADDRESS}

${copy.closing}
Noir by Kriszta`,
  });

  const owner = await sendMail({
    to: OWNER,
    subject: `Foglalás ${appointment.status === "confirmed" ? "megerősítve" : appointment.status === "cancelled" ? "lemondva" : "frissítve"} — ${appointment.customerName}`,
    html: shell(
      `Foglalás státusz: ${appointment.status}`,
      d.html +
        p(
          `<strong>Vendég:</strong> ${appointment.customerName}<br>` +
            `<strong>Telefon:</strong> ${appointment.phone || "—"}<br>` +
            `<strong>Email:</strong> ${appointment.email || "—"}`
        ) +
        p("A vendég automatikus értesítést kapott erről a változásról.")
    ),
    text: `A(z) "${appointment.customerName}" nevű foglalás új státusza: ${appointment.status}.

${d.text}

Telefon: ${appointment.phone || "—"}
Email: ${appointment.email || "—"}

A vendég értesítést kapott.`,
  });

  return { guest, owner };
}

/* ----------------------- Kapcsolatfelvétel ----------------------- */

export async function sendContactEmail({ name, email, message }) {
  return sendMail({
    to: OWNER,
    subject: `Kapcsolatfelvétel a weboldalról — ${name}`,
    html: shell(
      "Új üzenet a kapcsolati űrlapról",
      p(`<strong>Név:</strong> ${name}<br><strong>Email:</strong> ${email}`) +
        p(String(message).replace(/\n/g, "<br>"))
    ),
    text: `Név: ${name}\nEmail: ${email}\n\nÜzenet:\n${message}`,
  });
}
