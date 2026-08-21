/* ============================================================
   Bearings — Worksheet definitions (pure data, no I/O)

   The two guided worksheets (/sheet/preparation and
   /sheet/integration) are defined here as typed data and rendered
   by one dumb component (Worksheet.svelte). Content lives here so
   the renderer stays presentation-only and a future worksheet is
   a config change, not a component fork.

   Rules every definition must keep:
   - Nothing persisted. Like the safety Sheet, these hold the most
     sensitive writing in the app; the paper (or saved PDF) is the
     artifact, the form is only the means to it.
   - Every field optional. A worksheet with nothing filled in is a
     valid print, not an error state.
   - Voice: condition-action framing, never command. Framing text
     states what is known and what is not; it does not instruct a
     feeling. lint:phrases scans this file like any other.
   - Factual claims carry a source from the already-vetted repo
     set; claims-free framing carries none. Never invent sources.
   ============================================================ */

export type FieldDef =
  | { kind: "line"; id: string; label: string; placeholder?: string }
  | { kind: "area"; id: string; label: string; placeholder?: string; rows?: number }
  | { kind: "check"; id: string; label: string }
  | { kind: "pair"; id: string; leftLabel: string; rightLabel: string };

export interface SectionDef {
  /** Short heading, printed on the sheet. */
  heading: string;
  /** 2–4 sentences of condition-action framing. May be empty for
      pure-checklist sections, but most carry real content — these
      worksheets exist to guide thinking, not just collect words. */
  intro?: string;
  /** Optional pre-printed lines shown above the fillable fields
      (the if-then starters, the documented-phenomena list). */
  preprinted?: string[];
  fields: FieldDef[];
  /** Renders the section with the urgent border register. */
  safety?: boolean;
  /** Citations for factual claims made in the intro or preprinted
      lines. Same vetted entries the cards use; a section with no
      claim carries none. Printed as numbered footnotes. */
  sources?: { cite: string; url?: string; year?: number }[];
}

export interface WorksheetDef {
  title: string;
  kicker: string;
  lede: string;
  /** Printed footer note about scope/limits. */
  footnote: string;
  sections: SectionDef[];
}

/* Citations used in worksheet framing. Same vetted entries the
   cards and learn entries use — verbatim cite + url + year. */
const GOLLWITZER = {
  cite: "Gollwitzer, P., & Sheeran, P. (2006). Implementation Intentions and Goal Achievement: A Meta-analysis of Effects and Processes. Advances in Experimental Social Psychology.",
  url: "https://doi.org/10.1016/S0065-2601(06)38002-1",
  year: 2006,
};
const ROBINSON = {
  cite: "Robinson, O. C. et al. (2024). Coming back together: coping and support strategies after extended difficulties. Frontiers in Psychology.",
  url: "https://doi.org/10.3389/fpsyg.2024.1369715",
  year: 2024,
};
const BATHJE = {
  cite: "Bathje, G. J., Majeski, E., & Kudowor, M. (2022). Psychedelic integration: An analysis of the concept and its practice. Frontiers in Psychology.",
  url: "https://doi.org/10.3389/fpsyg.2022.824077",
  year: 2022,
};
const WATTS = {
  cite: "Watts, R., & Luoma, J. (2020). The use of the psychological flexibility model to support psychedelic assisted therapy. Journal of Contextual Behavioral Science.",
  url: "https://doi.org/10.1016/j.jcbs.2019.12.004",
  year: 2020,
};
const CARBONARO = {
  cite: "Carbonaro, T. et al. (2016). Survey study of challenging experiences after ingesting psilocybin mushrooms. Journal of Psychopharmacology.",
  url: "https://doi.org/10.1177/0269881116662634",
  year: 2016,
};
const BARRETT = {
  cite: "Barrett, F. et al. (2016). The Challenging Experience Questionnaire: Characterization of challenging experiences with psilocybin mushrooms. Journal of Psychopharmacology.",
  url: "https://doi.org/10.1177/0269881116678781",
  year: 2016,
};

/* Psychotherapy and psychonautics canon. Books are cited without
   urls, matching the resources collection convention ("books are
   cited, not linked"). Every entry is a real, verifiable work. */
const GROF = {
  cite: "Grof, S. (1980). LSD Psychotherapy: Exploring the Frontiers of the Hidden Mind. Hunter House.",
  year: 1980,
};
const HAYES = {
  cite: "Hayes, S. C., Strosahl, K. D., & Wilson, K. G. (1999). Acceptance and Commitment Therapy: An Experiential Approach to Behavior Change. Guilford Press.",
  year: 1999,
};
const GENDLIN = {
  cite: "Gendlin, E. T. (1978). Focusing. Bantam Books.",
  year: 1978,
};
const FOA_KOZAK = {
  cite: "Foa, E. B., & Kozak, M. J. (1986). Emotional processing of fear: Exposure to corrective information. Psychological Bulletin, 99(1), 20–35.",
  url: "https://doi.org/10.1037/0033-2909.99.1.20",
  year: 1986,
};
const SIEGEL = {
  cite: "Siegel, D. J. (1999). The Developing Mind: How Relationships and the Brain Interact to Shape Who We Are. Guilford Press.",
  year: 1999,
};
const SCHWARTZ = {
  cite: "Schwartz, R. C. (1995). Internal Family Systems Therapy. Guilford Press.",
  year: 1995,
};
const LEVINE = {
  cite: "Levine, P. A. (1997). Waking the Tiger: Healing Trauma. North Atlantic Books.",
  year: 1997,
};
const RICHARDS = {
  cite: "Richards, W. A. (2016). Sacred Knowledge: Psychedelics and Religious Experiences. Columbia University Press.",
  year: 2016,
};
const MITHOEFER = {
  cite: "Mithoefer, M. C. (2017). A Manual for MDMA-Assisted Psychotherapy in the Treatment of Posttraumatic Stress Disorder (rev. ed.). Multidisciplinary Association for Psychedelic Studies.",
  year: 2017,
};
const FADIMAN = {
  cite: "Fadiman, J. (2011). The Psychedelic Explorer's Guide: Safe, Therapeutic, and Sacred Journeys. Park Street Press.",
  year: 2011,
};
const JOHNSON = {
  cite: "Johnson, M., Richards, W., & Griffiths, R. (2008). Human hallucinogen research: guidelines for safety. Journal of Psychopharmacology.",
  url: "https://doi.org/10.1177/0269881108093587",
  year: 2008,
};
const GORMAN = {
  cite: "Gorman, I. et al. (2021). Psychedelic Harm Reduction and Integration: A Transtheoretical Model. Frontiers in Psychology.",
  url: "https://doi.org/10.3389/fpsyg.2021.645246",
  year: 2021,
};

export const PREPARATION_WORKSHEET: WorksheetDef = {
  title: "Preparation worksheet",
  kicker: "Print-first · nothing saved",
  lede:
    "A structured page to think through before the day — why, when, who, what, and what happens if it gets hard. Fill in what you want, print or save it as a PDF, and let the paper hold it.",
  footnote:
    "Nothing on this page is saved or sent anywhere. It exists only while this tab is open — print or save before you close it. This worksheet guides thinking; it cannot screen, approve, or clear anyone for anything.",
  sections: [
    {
      heading: "Why now — or why not",
      intro:
        "There is no required reason to be here. Play, curiosity, and a good time are complete reasons on their own — and so is deciding to wait. Naming your own reason, in your own words, makes it easier to notice later if it has changed.",
      fields: [
        {
          kind: "area",
          id: "why-pull",
          label: "What is pulling me toward this, if anything",
          placeholder: "Or leave blank — no reason is also a reason",
          rows: 2,
        },
        {
          kind: "line",
          id: "why-want",
          label: "What I want from the day (or “nothing specific”)",
          placeholder: "A feeling, a question, a good time — nothing owed",
        },
        {
          kind: "area",
          id: "why-postpone",
          label: "What would make me postpone",
          placeholder:
            "Pressure from someone, an unsafe place, acute distress, an untested substance, no free day after, something feels off",
          rows: 2,
        },
      ],
    },
    {
      heading: "Time and room to land",
      intro:
        "Time pressure tends to shape the experience, and people often notice it more in hindsight than in advance. Fewer outside pressures means fewer things pulling on you while you are less able to manage them.",
      fields: [
        {
          kind: "line",
          id: "time-day",
          label: "The day itself, free",
          placeholder: "Date / nothing scheduled that day",
        },
        {
          kind: "line",
          id: "time-after",
          label: "The day after, also free",
          placeholder: "Date / nothing scheduled the day after",
        },
        {
          kind: "line",
          id: "time-waiting",
          label: "Who is waiting on me, or expecting me somewhere",
          placeholder: "Ideally nobody — name anyone who is",
        },
        {
          kind: "line",
          id: "time-rest",
          label: "Where I can rest afterward without performing or travelling",
          placeholder: "Home, a friend's place…",
        },
      ],
    },
    {
      heading: "People",
      intro:
        "Company shapes the experience, and it is worth treating the people around you as part of the setup. If you will be alone, that is a real and common choice — and the things a present person would catch become yours to plan for instead.",
      fields: [
        {
          kind: "line",
          id: "people-present",
          label: "Who will actually be there",
          placeholder: "Names — including anyone dropping by",
        },
        {
          kind: "line",
          id: "people-sober",
          label: "Who stays sober and able to help if needed",
          placeholder: "Name — or “not applicable”",
        },
        {
          kind: "line",
          id: "people-alone",
          label: "If solo: who knows my plan, and when to expect word",
          placeholder: "Name + rough check-in time",
        },
        {
          kind: "line",
          id: "people-contact",
          label: "One person I could call at any hour, and how",
          placeholder: "Name + number",
        },
      ],
    },
    {
      heading: "What I'm taking",
      intro:
        "Substances sold as one thing are sometimes something else, or something else mixed in. That is not a reason to panic — it is a reason to check, if checking is available to you. A clean result is information, not a guarantee.",
      fields: [
        { kind: "line", id: "taking-what", label: "What", placeholder: "Substance" },
        { kind: "line", id: "taking-source", label: "From where", placeholder: "Source" },
        {
          kind: "line",
          id: "taking-tested",
          label: "Tested how",
          placeholder: "Reagent kit, strip, service, or “not tested”",
        },
        { kind: "line", id: "taking-dose", label: "Dose, written down", placeholder: "Amount" },
      ],
    },
    {
      heading: "If–then plans",
      intro:
        "Clear thinking is exactly what the state can make harder, for a while. A plan made now in the specific form “if this, then that” survives that — the decision is already made; there is only something to recognise and act on. Plans made ahead like this measurably help people follow through.",
      preprinted: [
        "If I want to leave the house → I don't.",
        "If I want to message someone → it waits until tomorrow.",
        "If I feel like I'm dying → this passes. Sit down. Call the line.",
        "If a moment feels unsafe → lights on, sit up, say out loud that I want it to slow down.",
      ],
      fields: [
        { kind: "pair", id: "ifthen-1", leftLabel: "If", rightLabel: "then" },
        { kind: "pair", id: "ifthen-2", leftLabel: "If", rightLabel: "then" },
        { kind: "pair", id: "ifthen-3", leftLabel: "If", rightLabel: "then" },
      ],
      sources: [GOLLWITZER, WATTS],
    },
    {
      heading: "Boundaries and agreements",
      intro:
        "Settled ahead of time, nobody has to negotiate anything mid-event — with a companion, or with yourself. An answer given beforehand still counts when it is harder to give one in the moment.",
      fields: [
        {
          kind: "area",
          id: "bounds-touch",
          label: "Touch, photos, conversation, privacy — what is agreed",
          placeholder: "e.g. hand-holding yes, hugs ask first, no photos, no phone calls",
          rows: 2,
        },
        {
          kind: "area",
          id: "bounds-off",
          label: "What I do not want discussed or done, whatever happens",
          placeholder: "Topics, people, music, anything else",
          rows: 2,
        },
        {
          kind: "line",
          id: "bounds-leave",
          label: "If I say I want to leave or stop, the plan is",
          placeholder: "What happens next — agreed now, not decided at 3am",
        },
      ],
    },
    {
      heading: "Body basics",
      intro:
        "In a clinical setting someone else handles the room. Without that person, these small things become yours to set up in advance — and they do real work.",
      fields: [
        { kind: "check", id: "body-water", label: "Water within reach" },
        { kind: "check", id: "body-food", label: "Food that needs no cooking" },
        { kind: "check", id: "body-blanket", label: "A blanket" },
        { kind: "check", id: "body-lights", label: "Lights I can lower rather than switch off" },
        { kind: "check", id: "body-playlist", label: "Playlist downloaded, not streamed" },
        { kind: "check", id: "body-phone", label: "Phone charged" },
        { kind: "check", id: "body-keys", label: "Keys stowed where I won't need to find them" },
        { kind: "check", id: "body-door", label: "Door sorted — locked, or unlocked for the person coming" },
      ],
    },
    {
      heading: "Safety, in short",
      intro:
        "Direct information, stated once. Pausing keeps every option open; going ahead closes some of them.",
      preprinted: [
        "Worth pausing over: pressure from someone, an unfamiliar or unsafe place, acute distress right now, unsure about a medication or mixing, nobody knows where I am, no free day after, untested substance, something feels off and I can't say why.",
        "Worth a clinician conversation first: personal or family history of psychosis, mania, or bipolar disorder; a heart condition; lithium or MAOI use (some combinations are seriously risky); changing psychiatric medication; pregnancy.",
        "Get urgent help now for: trouble breathing, unresponsive, chest pain, seizure, acting on a plan to harm self or others. You do not need to be certain it is serious to call.",
        "Still not feeling right the next day? That is a reason to call, not to wait.",
      ],
      fields: [],
      safety: true,
    },
    {
      heading: "Tomorrow",
      intro:
        "Whatever the day turns out to be, the day after is part of the plan too.",
      fields: [
        { kind: "check", id: "tomorrow-nothing", label: "Nothing scheduled" },
        { kind: "check", id: "tomorrow-food", label: "Food already in the house" },
        {
          kind: "line",
          id: "tomorrow-message",
          label: "Who I'll message tomorrow",
          placeholder: "Name",
        },
      ],
    },
  ],
};

export const INTEGRATION_WORKSHEET: WorksheetDef = {
  title: "Integration worksheet",
  kicker: "Print-first · nothing saved",
  lede:
    "A structured page for the days after — getting specifics down while they are close, naming what was hard without scoring it, and finding the one small thing that might actually stick. Fill in what you want, print or save it as a PDF.",
  footnote:
    "Nothing on this page is saved or sent anywhere. It exists only while this tab is open — print or save before you close it. Integration is not a task with a deadline, and an experience you simply had is complete on its own.",
  sections: [
    {
      heading: "While it's close",
      intro:
        "The specifics are the first thing to go — not usually the broad shape, but an image, a phrase, the exact feeling of a moment. A few lines now hold more than a reconstruction next week. Fragments count; sentences are optional.",
      fields: [
        {
          kind: "area",
          id: "close-image",
          label: "An image that stayed",
          placeholder: "Describe it plainly — no meaning required yet",
          rows: 2,
        },
        {
          kind: "area",
          id: "close-words",
          label: "A phrase or words that came, if any",
          placeholder: "Exactly as they arrived",
          rows: 2,
        },
        {
          kind: "area",
          id: "close-body",
          label: "How my body feels right now",
          placeholder: "Tired, wired, heavy, light, ordinary…",
          rows: 2,
        },
      ],
    },
    {
      heading: "What happened, plainly",
      intro:
        "Only what happened and how it felt. Leaving what it means alone for now is not avoidance — meaning tends to be more useful when it arrives on its own.",
      fields: [
        {
          kind: "area",
          id: "plain",
          label: "What happened, and how it felt",
          placeholder: "Plainly, in any order, incomplete is fine",
          rows: 6,
        },
      ],
    },
    {
      heading: "Naming what was hard, if anything",
      intro:
        "Difficult experiences are common enough to have been studied directly. If any of this matches something that happened, it has been documented before — naming it is the point, not measuring it. There is no score attached.",
      preprinted: [
        "Fear that felt disproportionate to any real danger present.",
        "A feeling of losing control, or of not being able to stop what was happening.",
        "Grief, or an encounter with loss, sometimes unrelated to anything specific.",
        "Isolation — as though no one could reach you or understand what was happening.",
        "Physical distress with no clear cause: nausea, tension, discomfort.",
        "Paranoia, or a sense that something meant you harm.",
        "Insight that felt overwhelming rather than clarifying.",
        "A changed sense of self, or not being able to locate who you normally are.",
      ],
      fields: [
        {
          kind: "area",
          id: "hard-notes",
          label: "Anything you'd add in your own words",
          placeholder: "Optional",
          rows: 3,
        },
      ],
      sources: [CARBONARO, BARRETT],
    },
    {
      heading: "The pull to act",
      intro:
        "A strong pull to change something right now — end something, start something, tell everyone — can feel completely clear. Urgency itself is not proof of rightness, and the integration literature is unusually consistent: big decisions wait. Writing it down with today's date keeps it without acting on it. If it still holds in a month, it will still be available.",
      fields: [
        {
          kind: "area",
          id: "pull-what",
          label: "The change I feel pulled toward, and why",
          placeholder: "Say it fully — this page is the place for it",
          rows: 3,
        },
        {
          kind: "line",
          id: "pull-date",
          label: "Today's date",
          placeholder: "DD/MM/YYYY",
        },
        {
          kind: "line",
          id: "pull-revisit",
          label: "Date one month from now, to reread this",
          placeholder: "DD/MM/YYYY",
        },
      ],
      sources: [BATHJE],
    },
    {
      heading: "One small thing",
      intro:
        "Sweeping resolutions tend to fade within weeks once ordinary life resumes. What holds up better is one specific, concrete change, small enough to actually do. Nobody owes the experience a transformed life.",
      fields: [
        {
          kind: "line",
          id: "small-what",
          label: "One small, concrete thing",
          placeholder: "Calling one person. Changing one habit. Saying one true thing.",
        },
        {
          kind: "line",
          id: "small-when",
          label: "When it could realistically happen",
          placeholder: "This week / Saturday morning / after X",
        },
      ],
      sources: [BATHJE],
    },
    {
      heading: "Ordinary days",
      intro:
        "In one survey of 608 people with extended difficulties, ordinary routine — sleep, regular food, work, seeing usual people — was among what helped. Returning to normal life is not avoiding the experience; for many it is how the experience finds its proper size.",
      fields: [
        { kind: "check", id: "ordinary-sleep", label: "Sleep, roughly back on schedule" },
        { kind: "check", id: "ordinary-food", label: "Regular food" },
        { kind: "check", id: "ordinary-move", label: "Some movement — a walk counts" },
        { kind: "check", id: "ordinary-outside", label: "Time outside — a park counts" },
        { kind: "check", id: "ordinary-people", label: "Seen at least one usual person" },
        { kind: "check", id: "ordinary-tasks", label: "One ordinary task done — dishes count" },
      ],
      sources: [ROBINSON],
    },
    {
      heading: "People",
      intro:
        "Talking can help — being heard without judgment was the support most often reported as helpful. It is worth separating wanting to share from someone specifically needing the information, since disclosure can carry consequences that have nothing to do with whether the experience was good.",
      fields: [
        {
          kind: "line",
          id: "people-listen",
          label: "Someone who can just listen, not advise",
          placeholder: "Name",
        },
        {
          kind: "area",
          id: "people-tell",
          label: "Who I'll tell, who I won't, and why",
          placeholder: "Work, family, legal, immigration — worth a thought before talking",
          rows: 2,
        },
        {
          kind: "area",
          id: "people-pace",
          label: "Anyone moving at a different pace than me (or me than them)",
          placeholder:
            "Two people don't have to arrive anywhere together — naming it plainly helps",
          rows: 2,
        },
      ],
    },
    {
      heading: "No lesson owed",
      intro:
        "Not every experience needs to become a lesson, a breakthrough, or a turning point. You are allowed to have simply been there, enjoyed it, and left it at that. If something surfaces later, it will still be there; if nothing does, that is not a missed opportunity.",
      fields: [
        {
          kind: "area",
          id: "no-lesson",
          label: "Anything here — or nothing, which is a complete answer",
          placeholder: "Optional. Empty is fine.",
          rows: 3,
        },
      ],
    },
    {
      heading: "When to reach out",
      intro:
        "Most difficult feelings fade over days or weeks. Sometimes they do not — and that is worth real support, not because something is permanently wrong, but because professionals can genuinely help while things finish settling.",
      preprinted: [
        "Worth talking with a qualified professional: anxiety, fear, or unreality not fading after a few weeks · sleep, work, or relationships being affected · visual disturbances that persist · using alcohol or other drugs to manage how you feel.",
        "Get urgent help now for: thoughts of harming yourself or anyone else · not feeling safe · distress that is getting worse instead of better. That is a reason to call, not to wait.",
      ],
      fields: [
        {
          kind: "line",
          id: "reach-out",
          label: "Who I would reach out to, and how",
          placeholder: "Name + number, or a service from Support & safety",
        },
      ],
      sources: [ROBINSON],
      safety: true,
    },
  ],
};

export const SESSION_FOCUS_WORKSHEET: WorksheetDef = {
  title: "Session focus worksheet",
  kicker: "Print-first · nothing saved",
  lede:
    "For a session you are coming to with something specific to address — a question, a pattern, something that has been asking for attention — and no one sitting with you. This page helps you decide in advance, in a calm state, how you want to meet it, what to do if it gets heavy, and what you will want afterward. Fill in what applies, print or save as PDF, and keep it within reach on the day.",
  footnote:
    "Nothing on this page is saved or sent anywhere. It exists only while this tab is open. A session aimed at difficult material alone asks more of its planning than a guided one does — this page is part of that planning, not a substitute for a professional where one is warranted. It cannot screen, assess, or clear anyone for anything.",
  sections: [
    {
      heading: "X, stated plainly",
      intro:
        "Naming it before the day does two things. It makes X recognisable mid-session: states where deliberation is hard are bad places to work out what you are even looking at. And it gives you something specific to return to afterward, rather than a blur. One plain sentence is enough — precision here is worth more than depth.",
      fields: [
        {
          kind: "area",
          id: "x-sentence",
          label: "X, in one plain sentence",
          placeholder: "A question, a pattern, a fear, a decision, a grief — your words",
          rows: 2,
        },
        {
          kind: "line",
          id: "x-age",
          label: "How long X has been with me",
          placeholder: "Weeks, years, since…",
        },
        {
          kind: "area",
          id: "x-tried",
          label: "What I have already tried with X — what helped, what did not",
          rows: 3,
        },
      ],
      sources: [GOLLWITZER],
    },
    {
      heading: "How X usually presents",
      intro:
        "Under ordinary conditions X has shapes: where it sits in the body, what summons it, what it makes you want to do. Gendlin called the bodily version of this the felt sense — an unclear whole that can be recognised before it can be explained. Mapping X's ordinary shapes now means that if it arrives mid-session, you are meeting something you have already seen, not something new.",
      preprinted: [
        "Where do I feel X in my body right now, if anywhere? (the felt sense)",
        "If X had a voice or a want, what would it say? (parts work)",
        "How old does X feel, roughly?",
        "What does X usually make me do — avoid, appease, brace, leave?",
      ],
      fields: [
        {
          kind: "line",
          id: "x-body",
          label: "Where I feel X in my body",
          placeholder: "Chest, throat, stomach, nowhere specific…",
        },
        {
          kind: "area",
          id: "x-summons",
          label: "What tends to summon it",
          rows: 2,
        },
        {
          kind: "area",
          id: "x-fear",
          label: "What I am afraid it might do during the session",
          placeholder: "Overwhelm me, go nowhere, turn into something else…",
          rows: 2,
        },
      ],
      sources: [GENDLIN, SCHWARTZ, LEVINE],
    },
    {
      heading: "Stance: how I want to meet it",
      intro:
        "There is more than one workable stance, and the traditions name them differently. What matters is choosing yours now: deciding in a calm state beats deciding mid-session, whatever you choose. The menu below is real options, not steps — pick one, mix two, or write your own.",
      preprinted: [
        "Allowing — make room for it instead of fighting it. The psychological-flexibility move: fighting an unpleasant state tends to intensify it; willingness loosens its grip. (Watts & Luoma 2020; Hayes et al. 1999)",
        "Turning toward — look at it directly and describe what you find. Exposure logic: the fear structure has to be activated, then given information it did not have. (Foa & Kozak 1986)",
        "Following — let the material lead rather than steering it. Grof's surrender principle: resistance to the experience's own direction is often the engine of the difficulty. (Grof 1980)",
        "Visiting and stepping back — approach in doses, retreating to an anchor between looks. Dosing your contact is legitimate technique, not cowardice.",
        "Leaving it be today — a session aimed elsewhere is a complete outcome, not a failure.",
      ],
      fields: [
        {
          kind: "area",
          id: "stance",
          label: "My stance this session, in my own words",
          rows: 3,
        },
        {
          kind: "line",
          id: "stance-question",
          label: "One question I want to hold (optional — one, not ten)",
          placeholder: "The question you would ask if you could only ask one",
        },
      ],
      sources: [WATTS, HAYES, FOA_KOZAK, GROF],
    },
    {
      heading: "Permission lines",
      intro:
        "Words written beforehand carry unusual weight mid-session, when composing kind sentences is harder. Clinical manuals use exactly this device — brief written reminders of stance and permission, read before and during. Write the lines you will want to hear, in your own voice. An answer given beforehand still counts.",
      preprinted: [
        "If X comes up, I don't have to fix it today.",
        "I can look away and come back. It will still be there.",
        "Whatever happens, I don't owe this session a breakthrough.",
        "Feeling worse briefly is not the same as things going wrong.",
      ],
      fields: [
        { kind: "line", id: "perm-1", label: "A line for me" },
        { kind: "line", id: "perm-2", label: "Another" },
        { kind: "line", id: "perm-3", label: "Another" },
      ],
      sources: [GOLLWITZER, MITHOEFER],
    },
    {
      heading: "If it gets heavy",
      intro:
        "Distress is not the same as emergency. Fear, grief, and the sense of coming apart are common, documented, and pass — the survey data on challenging experiences describes exactly these, at high intensity, mostly without lasting harm. What actually needs help is different and shorter: chest pain, seizure, unresponsive, acting on a plan to harm yourself or someone else. Between those two sits everything else, and for that there are exits, in order. Arousal that fits back inside what Siegel called the window of tolerance usually settles on its own; the ladder below is how you help it fit.",
      preprinted: [
        "1. Lights on.",
        "2. Sit up.",
        "3. Change or stop the music.",
        "4. Say out loud: I want this to slow down.",
        "5. Move — another room, cold water on the face, feet on the floor.",
        "6. Call the person on my contact line.",
        "7. Chest pain, seizure, unresponsive, acting on a plan to harm → emergency services now. No certainty required to call.",
      ],
      fields: [
        {
          kind: "line",
          id: "heavy-music",
          label: "My music change, specifically",
          placeholder: "Playlist position, track, or silence",
        },
        {
          kind: "line",
          id: "heavy-call",
          label: "Who I can call at any hour",
          placeholder: "Name + number",
        },
      ],
      sources: [CARBONARO, BARRETT, SIEGEL, RICHARDS],
    },
    {
      heading: "Anchors",
      intro:
        "An anchor is anything steady that helps you find your way back — breath paced long on the out, an object in the room, a phrase, a position. Somatic traditions call the simplest version orienting: noticing where you are through the senses. People who sit with others do this out loud for them; alone, the anchors chosen beforehand are the ones that remain. One or two is plenty — three is a ceiling, not a floor.",
      fields: [
        { kind: "line", id: "anchor-breath", label: "Breath", placeholder: "e.g. slow, longer out than in" },
        { kind: "line", id: "anchor-object", label: "An object in the room", placeholder: "Something solid and familiar" },
        { kind: "line", id: "anchor-phrase", label: "A phrase", placeholder: "Where I am. Who I am. This passes." },
        { kind: "line", id: "anchor-place", label: "A position or place", placeholder: "Back against the bed, feet on floor…" },
      ],
      sources: [LEVINE, FADIMAN],
    },
    {
      heading: "Afterward",
      intro:
        "The first hour after the effects lift belongs to the ordinary body: water, food, warmth, rest. Emotional processing does not stop when the acute effects do — material keeps settling for hours and days, which is why big decisions wait and why a few lines written tonight hold more than memory alone. Nothing is owed to X by morning.",
      fields: [
        { kind: "check", id: "after-food", label: "Water and simple food ready" },
        { kind: "check", id: "after-clear", label: "Nothing scheduled until tomorrow at the earliest" },
        {
          kind: "line",
          id: "after-person",
          label: "Who I'll want nearby or on the phone",
          placeholder: "Name",
        },
        {
          kind: "area",
          id: "after-lines",
          label: "A few lines while it's close (or leave blank)",
          rows: 3,
        },
      ],
      sources: [ROBINSON, FOA_KOZAK],
    },
    {
      heading: "Honest limits",
      intro:
        "Some things deserve more than a solo session can hold. If X is trauma-shaped, or if sitting with it has ever left you worse for weeks rather than days, that is exactly what a qualified clinician is for — clinical guidelines treat screening and supported settings as core risk controls, not optional extras, and integration models put referral inside their basic toolkit. And whatever happens: X may not come up at all. A session with no X in it is not a failed session. Nothing is owed.",
      preprinted: [
        "Worth a clinician conversation first: trauma X is shaped around · a history of being left worse for weeks by sitting with it · anything on the pause list of the safety page.",
        "Get urgent help now for: chest pain, seizure, unresponsive, thoughts of harming yourself or anyone else. You do not need to be certain it is serious to call.",
      ],
      fields: [
        {
          kind: "line",
          id: "limits-support",
          label: "If I need real support afterward, my first call is",
          placeholder: "Name, clinician, or a service from Support & safety",
        },
      ],
      sources: [JOHNSON, GORMAN],
      safety: true,
    },
  ],
};
