/**
 * The privacy policy, terms and cookie policy shown at /privacy
 * (?tab=terms, ?tab=cookies).
 *
 * DRAFTS. Written from the app's real data flows (API modules, mobile app,
 * this web app) for the January 2027 launch, NOT reviewed by a lawyer.
 * Every fact only the owner can give is a "[OWNER TO SUPPLY: ...]"
 * placeholder, and scripts/check-legal-ready.mjs fails a production build
 * while any placeholder remains or LEGAL_STATUS still says "draft".
 * Never replace a placeholder with an invented value.
 *
 * Law referred to: Nigeria Data Protection Act 2023 (NDPA) and the NDPC's
 * General Application and Implementation Directive 2025 (GAID). Sources and
 * open questions for counsel: docs/legal/LEGAL_DRAFTS.md.
 */
import type { ReactNode } from "react";

export type DocType = "privacy" | "terms" | "cookies";

export type Section = {
  num: string;
  title: string;
  /** A stable anchor for sections linked from outside (default `s-<num>`). */
  id?: string;
  content: ReactNode;
};

/**
 * Review state of each document. Set one to "reviewed" only after a lawyer
 * has approved that exact text; the production build refuses "draft".
 */
export const LEGAL_STATUS: Record<DocType, "draft" | "reviewed"> = {
  privacy: "draft",
  terms: "draft",
  cookies: "draft",
};

/* ── Shared building blocks (same values as the rest of the page) ── */
const strong = { color: "var(--ink)", fontWeight: 500 } as const;

function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-[1.65] mb-3.5 max-w-[60ch]" style={{ color: "var(--fg-2)" }}>{children}</p>;
}
function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-[16px] font-medium mt-7 mb-2.5" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{children}</h3>;
}
function UL({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch] mb-3.5 list-disc" style={{ color: "var(--fg-2)" }}>{children}</ul>;
}
function LI({ label, children }: { label?: string; children: ReactNode }) {
  return <li>{label ? <><strong style={strong}>{label}</strong>. </> : null}{children}</li>;
}
function Summary({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-r-(--r-2) py-3 px-4 my-4 max-w-[60ch]" style={{ background: "var(--bg-2)", borderLeft: "2px solid var(--ink)" }}>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1" style={{ color: "var(--fg-3)" }}>In one paragraph</div>
      <p className="text-[14px] leading-[1.5]" style={{ color: "var(--ink)", margin: 0 }}>{children}</p>
    </div>
  );
}
function Table({ head, rows }: { head: [string, string]; rows: [ReactNode, ReactNode][] }) {
  return (
    <div className="rounded-(--r-3) overflow-hidden my-4 max-w-[60ch]" style={{ border: "1px solid var(--border)" }}>
      <div className="grid font-mono text-[11px] uppercase tracking-[0.04em]" style={{ gridTemplateColumns: "1fr 1.5fr", padding: "10px 16px", background: "var(--bg-2)", borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}>
        <span>{head[0]}</span><span>{head[1]}</span>
      </div>
      {rows.map(([k, v], i) => (
        <div key={i} className="grid gap-3 text-[14px]" style={{ gridTemplateColumns: "1fr 1.5fr", padding: "12px 16px", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
          <span className="font-medium" style={{ color: "var(--ink)" }}>{k}</span>
          <span style={{ color: "var(--fg-2)" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
/** A fact only the owner can supply. The production build fails while one is left. */
function Ph({ children }: { children: ReactNode }) {
  return (
    <mark className="font-mono text-[13px] rounded-(--r-1) px-1" style={{ background: "var(--warn-soft, var(--bg-2))", color: "var(--ink)" }}>
      {children}
    </mark>
  );
}
const Email = ({ children }: { children: string }) => (
  <a href={`mailto:${children}`} className="font-mono text-[14px] underline underline-offset-2" style={{ color: "var(--ink)" }}>{children}</a>
);

/* ── Privacy policy ── */

const HEALTH_DATA_SECTION: Section = {
  num: "07",
  id: "health-data",
  title: "Connected health apps",
  content: (<>
    <Summary>If you connect <strong>Health Connect</strong> in the Binectics Android app, we read only the health data types you allow, and we never write to it. We use that data for your Health log and, only if you turn it on, to complete your program tasks. <strong>No ads, and we never sell it.</strong> Disconnecting deletes what we imported unless you choose to keep it, and deleting your account deletes all of it.</Summary>
    <P>This section applies only if you connect Health Connect, Android&apos;s shared health store. It includes data that other apps, such as Samsung Health or a Galaxy Watch, have saved to Health Connect.</P>
    <H3>What we read</H3>
    <UL>
      <LI label="Only these types, and only the ones you allow">Steps, workouts (exercise sessions, with their distance), sleep, resting heart rate and weight. You choose them on Health Connect&apos;s permission screen and can change them there at any time.</LI>
      <LI label="Read only">Binectics never writes anything to Health Connect.</LI>
      <LI label="When">Up to 30 days from before you connect, then whatever is new each time you open the app. Nothing is read in the background.</LI>
      <LI label="Steps">Added up on your phone; we store a total per day, not every reading. We read resting heart rate only, not your continuous heart rate.</LI>
      <LI label="With each record">We keep which app saved it and whether it was recorded by a device or typed in by hand.</LI>
    </UL>
    <H3>What we use it for</H3>
    <UL>
      <LI label="Your Health log">Imported workouts and weigh&#8209;ins appear next to the ones you log yourself, so you don&apos;t type them twice. Delete them in the app that recorded them, and they go here on the next sync.</LI>
      <LI label={"Your program tasks, only if you turn on “Use for my program tasks”"}>It is off until you turn it on. A task such as &ldquo;Walk 8,000 steps&rdquo; then completes itself. By default only data recorded by a device counts, unless the provider who set the task allowed hand entries. That provider sees the task completed and, for a measurement task such as hours slept or weight, the value that filled it.</LI>
      <LI label="Nothing else">Imported data never earns loyalty points or rewards.</LI>
    </UL>
    <H3>What your providers see</H3>
    <UL>
      <LI label="Sharing is per type and starts off">Steps, workouts, sleep, heart rate and weight each have their own &ldquo;share with my providers&rdquo; switch, in the connect flow and in Settings → Privacy. Every one starts off.</LI>
      <LI label="Only to providers you work with now">Imported data is shared only for the types you switch on, only while &ldquo;Share my progress with my providers&rdquo; is also on, and only with providers you are currently working with (and authorised staff at their gym or practice).</LI>
    </UL>
    <H3>What we never do</H3>
    <UL>
      <li>Use it for advertising, sell it, or give it to data brokers.</li>
      <li>Use it for insurance, credit, lending or employment decisions, or to train AI models.</li>
      <li>Put its values in error reports or logs. Our logs record counts and types, never values.</li>
    </UL>
    <H3>How long we keep it</H3>
    <Table head={["Data", "Retention"]} rows={[
      ["Records we read", "13 months after the activity, then deleted automatically"],
      ["Daily totals", "About 25 months after the day was last updated, then deleted automatically"],
      ["Workouts and weigh‑ins in your Health log", "Until you delete them at the source, disconnect, or delete your account"],
      ["Consent history", "When you connected, the types you allowed and what you changed. Kept until you delete your account"],
    ]} />
    <H3>Disconnecting and deleting</H3>
    <UL>
      <LI label="Disconnect">From Connected apps in the app. By default this deletes everything we imported; what you logged yourself is not touched. &ldquo;Keep my history&rdquo; stops syncing and keeps what was imported, on the schedule above.</LI>
      <LI label="Deleting your account">Deletes all of it: imported data, the connection and your consent history.</LI>
      <LI label="In Health Connect">You can also remove Binectics&apos;s access, or single types, at any time. We stop reading them.</LI>
    </UL>
  </>),
};

const PRIVACY: Section[] = [
  { num: "00", title: "Plain‑English summary", content: (<>
    <Summary>We collect what we need to run Binectics: your account, what you book and pay for, the messages you send, and the health, fitness and fasting records you choose to log. Some of that is <strong>sensitive personal data</strong> under Nigerian law (your health, and your religious practice if you use a faith fasting plan), so we only process it with your explicit consent, and you can withdraw it. <strong>We don&apos;t sell your data.</strong> You can see, correct, export or delete it, and complain to the Nigeria Data Protection Commission.</Summary>
  </>)},
  { num: "01", title: "Who we are", content: (<>
    <P>Binectics is operated by <Ph>[OWNER TO SUPPLY: registered company name]</Ph>, registered with the Corporate Affairs Commission under number <Ph>[OWNER TO SUPPLY: RC number]</Ph>, of <Ph>[OWNER TO SUPPLY: registered address]</Ph> (&ldquo;Binectics&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). We are the data controller for the personal data described here, except where a gym, trainer or dietitian you work with decides how to use your data in their own business (see section 06).</P>
    <P>Our Data Protection Officer is <Ph>[OWNER TO SUPPLY: DPO name or appointed firm]</Ph>, reachable at <Ph>[OWNER TO SUPPLY: DPO email and postal address]</Ph>. Our registration with the Nigeria Data Protection Commission: <Ph>[OWNER TO SUPPLY: NDPC registration status and number, if registered]</Ph>.</P>
    <P>This policy covers the website, the web app and the Binectics Android app.</P>
  </>)},
  { num: "02", title: "What we collect", content: (<>
    <H3>You give us</H3>
    <UL>
      <LI label="Account">Name, email address, password (stored only as a one&#8209;way hash), the role you sign up as, and optionally your phone number, date of birth, country and profile photo.</LI>
      <LI label="Provider details">For gyms, trainers and dietitians: business and listing details, photos, prices, credentials and documents you upload for verification, and the bank details needed to pay you.</LI>
      <LI label="Bookings, plans and payments">Sessions, classes and memberships you book or sell, programs and meal plans, invoices, refunds and payment status.</LI>
      <LI label="Messages and forms">Messages with providers or members, reviews, and forms you fill in for a provider (for example a gym&apos;s PAR&#8209;Q health questionnaire).</LI>
      <LI label="Health and fitness records">Anything you choose to log: weight, measurements, meals and meal feedback, workouts, water, check&#8209;ins, journals and progress photos.</LI>
      <LI label="Fasting and faith plans">If you use fasting tracking: your fasts, their times, and how you felt. If you start a faith&#8209;based fasting plan (for example Ramadan or Lent), its type and dates, and the city you pick so the app can work out dawn and sunset times on your phone. Those times are an estimate for planning, not a religious ruling.</LI>
    </UL>
    <H3>We collect automatically</H3>
    <UL>
      <LI label="Device and connection">IP address, browser or app version, device type and operating system, used to keep the service secure and working.</LI>
      <LI label="Approximate country">Worked out from your connection to show prices in a sensible currency. You can change it.</LI>
      <LI label="Device location, only if you allow it">In the Android app, to show providers near you. You can say no and pick a place instead.</LI>
      <LI label="Push notification tokens">If you allow notifications, a token from Firebase (web) or Expo (Android) so we can send them.</LI>
      <LI label="Sign&#8209;in safety ID">A random code made in your browser or app and sent when you sign in, used only to slow down repeated wrong passwords. It holds no device details.</LI>
      <LI label="Usage analytics, only if you agree">Pages viewed and sign&#8209;up buttons used, through PostHog (hosted in the EU). Off until you accept analytics cookies, and only on the public website and sign&#8209;up pages. Never your health, fasting, faith or payment details.</LI>
    </UL>
    <H3>Others give us</H3>
    <UL>
      <LI label="Paystack">The outcome of a payment, the amount, a reference, and limited card details such as the card type and last four digits. We never see or store your full card number.</LI>
      <LI label="Health Connect">Only if you connect it, see section 07.</LI>
      <LI label="Providers">A gym or coach may add you as a member or client (for example by importing their member list) with your name and contact details.</LI>
    </UL>
  </>)},
  { num: "03", title: "Sensitive personal data", id: "sensitive-data", content: (<>
    <P>The Nigeria Data Protection Act 2023 treats data about your <strong style={strong}>health</strong> and your <strong style={strong}>religious beliefs</strong> as sensitive personal data, which needs extra care. On Binectics that means:</P>
    <UL>
      <LI label="Health data">Your weight, measurements, meals, workouts, sleep and heart&#8209;rate records, health questionnaires, and progress photos.</LI>
      <LI label="Religious practice">Choosing a faith&#8209;based fasting plan (such as Ramadan or Lent) can reveal your religion.</LI>
    </UL>
    <P>We process these only with your <strong style={strong}>explicit consent</strong>, which you give when you start logging, connect Health Connect, or start a faith plan. You can withdraw it at any time by deleting the records, disconnecting, ending the plan, or deleting your account; withdrawing does not affect what was done before. We don&apos;t use sensitive data for advertising, and only the providers you work with and choose to share with can see it.</P>
    <P>Binectics is a tracking and coaching tool. It does not give medical, nutritional or religious advice, and nothing in it is a diagnosis. Talk to a doctor before fasting or changing your training if you have a health condition, are pregnant, or take medication.</P>
  </>)},
  { num: "04", title: "Why we use it, and our lawful basis", content: (<>
    <Table head={["Purpose", "Lawful basis"]} rows={[
      ["Running your account, bookings, plans, messages and payments", "Performing our contract with you"],
      ["Health, fitness, fasting and faith records", "Your explicit consent"],
      ["Sharing your progress with providers you choose", "Your consent (you control it in Settings → Privacy)"],
      ["Verifying providers, preventing fraud and abuse, securing accounts", "Our legitimate interest in a safe service"],
      ["Keeping payment and tax records", "Legal obligation"],
      ["Usage analytics and improving the product", "Your consent (analytics cookies)"],
      ["Service emails and notifications you asked for", "Performing our contract; you can turn optional ones off"],
      ["Marketing emails", <>Your consent. <Ph>[OWNER TO SUPPLY: confirm whether marketing emails will be sent]</Ph></>],
    ]} />
  </>)},
  { num: "05", title: "Who we share it with", content: (<>
    <P>We don&apos;t sell personal data. We share it only with:</P>
    <UL>
      <LI label="Providers you work with">The gym, trainer or dietitian you book or subscribe with, and their authorised staff, see what they need to serve you, and the progress you choose to share.</LI>
      <LI label="Paystack">Processes payments and payouts.</LI>
      <LI label="Service providers who run Binectics for us">Microsoft Azure (hosting and databases), Netlify and Vercel (website hosting), Cloudinary (photos you upload), Sentry (error monitoring), Google Firebase and Expo (push notifications), <Ph>[OWNER TO SUPPLY: email delivery provider]</Ph> (email), and PostHog (product analytics, EU hosting), only if you accept analytics. They act on our instructions under contract.</LI>
      <LI label="Authorities">When the law requires it, and only what it requires.</LI>
      <LI label="A buyer of the business">If Binectics is sold or merged, under this policy.</LI>
    </UL>
  </>)},
  { num: "06", title: "Gyms, trainers and dietitians", content: (<>
    <P>Providers on Binectics are independent businesses. When a provider keeps records about you in Binectics for their own business (for example member records, session notes or a health questionnaire), they decide how to use them and are responsible for that use; Binectics processes those records for them. Ask the provider directly about their records, or contact us and we will pass your request on.</P>
  </>)},
  HEALTH_DATA_SECTION,
  { num: "08", title: "Where it is stored", content: (<>
    <P>Binectics runs on Microsoft Azure in <Ph>[OWNER TO SUPPLY: production hosting region(s)]</Ph>, and some of our service providers are outside Nigeria, so your data may be transferred out of Nigeria. We do this only on a basis the Nigeria Data Protection Act allows (sections 41 to 43), such as adequate protection in the destination or appropriate contractual safeguards: <Ph>[OWNER TO SUPPLY: transfer mechanism confirmed by counsel]</Ph>. Data is encrypted in transit and at rest.</P>
  </>)},
  { num: "09", title: "How long we keep it", content: (<>
    <Table head={["Data", "Retention"]} rows={[
      ["Account and profile", "Until you delete your account. Deletion runs straight away; any part that fails is retried and completed within 30 days"],
      ["Health, fitness, fasting and faith records", "Until you delete them or your account"],
      ["Connected health app data", "See section 07"],
      ["Payment and invoice records", <><Ph>[OWNER TO SUPPLY: retention period required by Nigerian tax law]</Ph></>],
      ["Messages", <><Ph>[OWNER TO SUPPLY: message retention period]</Ph></>],
      ["Provider verification documents", <><Ph>[OWNER TO SUPPLY: verification document retention period]</Ph></>],
      ["Backups", <><Ph>[OWNER TO SUPPLY: backup retention period]</Ph></>],
    ]} />
    <P>A provider&apos;s own business records of sessions they gave you may be kept by them after you leave, under their own obligations.</P>
  </>)},
  { num: "10", title: "Your rights", content: (<>
    <P>Under the Nigeria Data Protection Act 2023 you can:</P>
    <UL>
      <LI label="Access">Ask what we hold about you and get a copy.</LI>
      <LI label="Correct">Fix anything wrong, in Settings or by emailing us.</LI>
      <LI label="Delete">Delete your account from Settings, or ask us to erase data we no longer need.</LI>
      <LI label="Restrict or object">Ask us to pause or stop processing based on our legitimate interests.</LI>
      <LI label="Portability">Get your data in a machine&#8209;readable format.</LI>
      <LI label="Withdraw consent">At any time, for anything based on consent, including analytics cookies and sensitive data.</LI>
      <LI label="Automated decisions">Not be subject to a decision based solely on automated processing that significantly affects you. Binectics makes no such decisions.</LI>
      <LI label="Complain">To the Nigeria Data Protection Commission (ndpc.gov.ng). Please contact us first so we can try to help.</LI>
    </UL>
    <P>Email <Email>privacy@binectics.com</Email>. We reply within <Ph>[OWNER TO SUPPLY: response time, within the legal limit counsel confirms]</Ph>, and may need to confirm your identity first.</P>
  </>)},
  { num: "11", title: "Children", content: (<>
    <P>Binectics is not for children. You must be at least <Ph>[OWNER TO SUPPLY: minimum age]</Ph> to create an account. Under Nigerian law a child is anyone under 18, and a child&apos;s data needs a parent or guardian&apos;s consent; if you think a child has given us data without it, email <Email>privacy@binectics.com</Email> and we will delete it.</P>
  </>)},
  { num: "12", title: "Security and breaches", content: (<>
    <P>We use encryption in transit and at rest, hashed passwords, access controls and monitoring. No system is perfectly secure. If a breach is likely to put your rights at risk, we will notify the Nigeria Data Protection Commission within 72 hours of becoming aware of it, and tell you without undue delay where the risk is high.</P>
  </>)},
  { num: "13", title: "Changes and contact", content: (<>
    <P>We will tell you by email or in the app before a material change takes effect. Questions or requests: <Email>privacy@binectics.com</Email>.</P>
  </>)},
];

/* ── Terms ── */

const TERMS: Section[] = [
  { num: "00", title: "Plain‑English summary", content: (
    <Summary>Binectics is software that gyms, trainers and dietitians use to run their business, and that members use to find them, pay them and follow their plans. <strong>Providers run their own businesses</strong> and set their own prices and policies; providers pay Binectics for their plan; Binectics takes no cut of member payments. Use it lawfully and honestly. Binectics is not medical advice.</Summary>
  )},
  { num: "01", title: "Who these terms are with", content: (<>
    <P>These terms are an agreement between you and <Ph>[OWNER TO SUPPLY: registered company name]</Ph>, RC <Ph>[OWNER TO SUPPLY: RC number]</Ph>, of <Ph>[OWNER TO SUPPLY: registered address]</Ph> (&ldquo;Binectics&rdquo;). By creating an account you accept them and our privacy policy.</P>
  </>)},
  { num: "02", title: "Who can use Binectics", content: (<>
    <P>You must be at least <Ph>[OWNER TO SUPPLY: minimum age]</Ph>. Providers must be legally able to offer their services where they work and hold any qualifications they claim. One person, one account; keep your password safe and tell us straight away if you think someone else has used your account.</P>
  </>)},
  { num: "03", title: "Providers and members", content: (<>
    <UL>
      <LI label="Providers are independent">Gyms, trainers and dietitians are not Binectics employees or agents. They are responsible for their services, advice, facilities, prices, cancellation policy and their own legal and tax obligations, including toward the members whose data they keep.</LI>
      <LI label="Verification">A verified badge means our team reviewed the documents the provider sent. It is not a guarantee of their services.</LI>
      <LI label="Members">Agree to follow a provider&apos;s rules and policies, and to give them accurate health information when they ask for it.</LI>
    </UL>
  </>)},
  { num: "04", title: "Provider subscriptions", content: (<>
    <UL>
      <LI label="Plans">Providers can use a free plan or subscribe to a paid plan priced per seat. Current plans and prices are on the pricing page: <Ph>[OWNER TO SUPPLY: plan prices and any trial length]</Ph>.</LI>
      <LI label="Billing">Paid plans are billed in advance through Paystack for the period you choose. If you turn on automatic renewal with a card, it renews at the end of each period until you turn it off.</LI>
      <LI label="Price changes">We give notice before a price change applies to your next renewal: <Ph>[OWNER TO SUPPLY: notice period]</Ph>.</LI>
      <LI label="Cancelling">Move to the free plan at any time. Your paid features continue to the end of the period already paid; your listing stays live and members keep subscriptions they already have until they expire.</LI>
      <LI label="Refunds of plan fees">Plan fees are not refundable except where the law requires or <Ph>[OWNER TO SUPPLY: plan-fee refund policy]</Ph>.</LI>
    </UL>
  </>)},
  { num: "05", title: "Member payments and refunds", content: (<>
    <UL>
      <LI label="Who you pay">When you buy a membership, session, program or plan, you pay the provider at the provider&apos;s price, through Paystack. Payments go to the provider&apos;s own Paystack account where they have connected one; otherwise Binectics collects them for the provider and pays them out. Binectics takes no fee from member payments.</LI>
      <LI label="Cancellations">Each provider sets their own cancellation and refund policy, shown before you pay. Binectics never charges a late&#8209;cancellation fee itself.</LI>
      <LI label="Refunds">Ask the provider first. If you can&apos;t agree, email <Email>help@binectics.com</Email> and we will help. Approved refunds go back to the original payment method through Paystack; how long the money takes to arrive depends on your bank.</LI>
      <LI label="Failed or duplicate payments">Contact <Email>help@binectics.com</Email> with the payment reference.</LI>
    </UL>
  </>)},
  { num: "06", title: "Health and fasting", content: (<>
    <P>Binectics does not provide medical, nutritional or religious advice. Programs, meal plans and fasting tools are for general fitness and tracking. Fasting is not suitable for everyone: talk to a doctor before fasting or starting a new training or diet plan, especially if you have a health condition, are pregnant or breastfeeding, or take medication. Stop and seek help if you feel unwell. Dawn and sunset times in faith plans are calculated estimates; follow your own religious authority.</P>
  </>)},
  { num: "07", title: "Acceptable use", content: (<>
    <P>Don&apos;t use Binectics to:</P>
    <UL>
      <li>Give false information, fake credentials, fake reviews or fake clients.</li>
      <li>Harass, threaten or discriminate against anyone, or send sexual content.</li>
      <li>Upload anything you don&apos;t have the right to share, or anything unlawful.</li>
      <li>Collect other people&apos;s data without a lawful basis, or use it for anything they didn&apos;t agree to.</li>
      <li>Scrape, reverse engineer, overload or try to break into the service, or automate bookings.</li>
      <li>Take payments for Binectics bookings outside the platform to avoid its records.</li>
    </UL>
    <P>We may remove content and suspend or close accounts that break these rules, and will tell you why unless the law or safety prevents it.</P>
  </>)},
  { num: "08", title: "Your content", content: (<>
    <P>You keep ownership of what you upload. You let Binectics store, display and process it only to run the service for you and the people you share it with. The Binectics software, brand and design belong to us.</P>
  </>)},
  { num: "09", title: "Ending your account", content: (<>
    <P>You can delete your account from Settings at any time. Payments already made follow the provider&apos;s refund policy. We may suspend or close an account that breaks these terms or the law.</P>
  </>)},
  { num: "10", title: "Liability", content: (<>
    <P>Binectics provides the platform; the training, nutrition and facilities are provided by the provider. To the extent the law allows, we are not liable for a provider&apos;s services or for indirect losses, and our total liability to you is limited to <Ph>[OWNER TO SUPPLY: liability cap, confirmed by counsel]</Ph>. Nothing here limits liability that cannot be limited by law.</P>
  </>)},
  { num: "11", title: "Disputes and governing law", content: (<>
    <P>If something goes wrong, email <Email>help@binectics.com</Email> first. These terms are governed by the laws of the Federal Republic of Nigeria, and disputes go to <Ph>[OWNER TO SUPPLY: courts or arbitration venue, confirmed by counsel]</Ph>.</P>
  </>)},
  { num: "12", title: "Changes", content: (<>
    <P>We will tell you before a material change takes effect. Continuing to use Binectics after that means you accept the new terms.</P>
  </>)},
];

/* ── Cookies ── */

const COOKIES: Section[] = [
  { num: "00", title: "Plain‑English summary", content: (
    <Summary>We use a few <strong>essential cookies</strong> to keep you signed in and route you to the right pages; they can&apos;t be switched off. <strong>Analytics</strong> runs only if you accept it, and is off until you do. We use no advertising or marketing cookies.</Summary>
  )},
  { num: "01", title: "Essential cookies", content: (<>
    <Table head={["Cookie", "What it does"]} rows={[
      ["access_token, refresh_token", "Keep you signed in. Set by our server, unreadable by scripts"],
      ["user_role, onboarding_complete, must_change_password", "Send you to the right dashboard and setup step"],
      ["binectics-region, binectics-region-override", "Your country, for showing prices; the override is the one you choose"],
    ]} />
    <P>Your cookie choice itself is saved in your browser&apos;s local storage so we don&apos;t ask again.</P>
  </>)},
  { num: "02", title: "Analytics", content: (<>
    <P>If you accept analytics, PostHog (hosted in the EU) counts page views and sign&#8209;up button clicks on the public website so we can see what works. It never receives your health, fasting, faith or payment details. If you reject analytics, it is not loaded at all.</P>
  </>)},
  { num: "03", title: "Marketing", content: <P>We use no marketing or advertising cookies.</P> },
  { num: "04", title: "Changing your mind", content: (<>
    <P>Use the cookie button at the bottom of any page to change your choice at any time. Rejecting is as easy as accepting. You can also clear cookies in your browser; if you block essential cookies, you won&apos;t be able to sign in.</P>
  </>)},
];

export const DOCS: Record<DocType, { label: string; version: string; sections: Section[] }> = {
  privacy: { label: "Privacy policy", version: "Draft · 21 Nov 2026", sections: PRIVACY },
  terms: { label: "Terms of service", version: "Draft · 21 Nov 2026", sections: TERMS },
  cookies: { label: "Cookie policy", version: "Draft · 21 Nov 2026", sections: COOKIES },
};

export const sectionId = (s: Section) => s.id ?? `s-${s.num}`;
