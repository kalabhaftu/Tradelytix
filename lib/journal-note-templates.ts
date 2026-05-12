type TemplateSection = {
  title: string
  prompts: Array<{
    label: string
    placeholder: string
  }>
}

export type BuiltInJournalTemplate = {
  id: string
  name: string
  description: string
  sections: TemplateSection[]
  content: {
    root: {
      children: any[]
      direction: string
      format: string
      indent: number
      type: string
      version: number
    }
  }
}

function textNode(text: string, format = 0) {
  return {
    detail: 0,
    format,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  }
}

function paragraphNode(children: any[]) {
  return {
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  }
}

function headingNode(text: string) {
  return {
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "heading",
    tag: "h3",
    version: 1,
  }
}

function buildTemplateContent(sections: TemplateSection[]) {
  const children: any[] = []

  for (const section of sections) {
    children.push(headingNode(section.title))
    for (const prompt of section.prompts) {
      // Bold label followed by placeholder hint text (styled muted so users know to replace it)
      children.push(paragraphNode([
        textNode(`${prompt.label}: `, 1),
        {
          detail: 0,
          format: 0,
          mode: "normal",
          style: "color: #9ca3af;",
          text: prompt.placeholder,
          type: "text",
          version: 1,
        },
      ]))
    }
    children.push(paragraphNode([textNode("")]))
  }

  if (children.length === 0) {
    children.push(paragraphNode([textNode("")]))
  }

  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  }
}

const BUILT_IN_TEMPLATE_SECTIONS: Omit<BuiltInJournalTemplate, "content">[] = [
  {
    id: "standard-review",
    name: "Standard Review",
    description: "Clean post-trade review with thesis, execution, and improvements.",
    sections: [
      {
        title: "Trade Thesis",
        prompts: [
          { label: "Setup Context", placeholder: "What did the market structure suggest before entry?" },
          { label: "Why This Trade", placeholder: "Why did this setup deserve risk?" },
        ],
      },
      {
        title: "Execution",
        prompts: [
          { label: "Entry Trigger", placeholder: "What exact trigger confirmed entry?" },
          { label: "Stop Loss Logic", placeholder: "Why was the stop placed there?" },
          { label: "Target Plan", placeholder: "What was the exit objective before entry?" },
        ],
      },
      {
        title: "Review",
        prompts: [
          { label: "What Went Well", placeholder: "Identify one process win." },
          { label: "What To Improve", placeholder: "Name one concrete correction for next trade." },
        ],
      },
    ],
  },
  {
    id: "technical-recap",
    name: "Technical Recap",
    description: "Top-down recap combining technical breakdown and recap flow.",
    sections: [
      {
        title: "Top-Down Context",
        prompts: [
          { label: "HTF Bias", placeholder: "Monthly / weekly / daily directional context." },
          { label: "4H Profile", placeholder: "What did the 4H structure or profile show?" },
          { label: "Active Price Phase", placeholder: "Expansion, pullback, accumulation, distribution, etc." },
          { label: "ERL / IRL Sequence", placeholder: "Which liquidity sequence was active?" },
        ],
      },
      {
        title: "Execution Detail",
        prompts: [
          { label: "Key Levels", placeholder: "Which levels mattered most before entry?" },
          { label: "Candle Close Confirmation", placeholder: "What close validated the setup?" },
          { label: "Entry Model / Framework", placeholder: "e.g., MSS + FVG, Turtle Soup, etc." },
          { label: "Risk Management Plan", placeholder: "RR and position sizing logic." },
          { label: "Correlation Check", placeholder: "DXY, ES/NQ, or related instruments at entry time." },
        ],
      },
      {
        title: "Post-Trade Reflection",
        prompts: [
          { label: "Execution Deviation", placeholder: "Any deviation from the original plan?" },
          { label: "Process Lesson", placeholder: "What will you repeat or avoid next time?" },
        ],
      },
    ],
  },
  {
    id: "mental-check-in",
    name: "Mental Check-in",
    description: "Decision quality and emotional control before, during, and after trade.",
    sections: [
      {
        title: "Before Entry",
        prompts: [
          { label: "Emotional State", placeholder: "Calm, anxious, impatient, overconfident, etc." },
          { label: "Focus Level (1-10)", placeholder: "Rate concentration and clarity." },
          { label: "Discipline Readiness", placeholder: "Did you wait for your criteria?" },
        ],
      },
      {
        title: "During Trade",
        prompts: [
          { label: "Emotional Shift", placeholder: "Did emotions change after entry?" },
          { label: "Impulse Control", placeholder: "Any urge to break rules?" },
        ],
      },
      {
        title: "After Trade",
        prompts: [
          { label: "Mindset Debrief", placeholder: "What mental pattern helped or hurt this trade?" },
          { label: "Next Session Intention", placeholder: "What mindset standard will you hold next?" },
        ],
      },
    ],
  },
]

export const BUILT_IN_JOURNAL_TEMPLATES: BuiltInJournalTemplate[] = BUILT_IN_TEMPLATE_SECTIONS.map((template) => ({
  ...template,
  content: buildTemplateContent(template.sections),
}))
