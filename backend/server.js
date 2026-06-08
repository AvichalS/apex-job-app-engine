import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import https from "https";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50kb" }));

const agent = new https.Agent({ rejectUnauthorized: false });
const client = new Groq({ apiKey: process.env.GROQ_API_KEY, httpAgent: agent });

const AVICHAL_PROFILE = `
You are a job application assistant for Avichal Sharma. Use his profile below to generate all outputs.

=== IDENTITY ===
Name: Avichal Sharma
Target roles: AI Product Manager, Technical Product Manager, Product Manager, Platform Product Manager, Product Owner, Technology Consultant, Strategy & Operations, Digital Transformation Consultant
Personal brand: Product Leader + AI Strategist + Enterprise Builder
Languages: English (native), Hindi (native), French (elementary)

=== EXPERIENCE (priority order) ===

1. MARRIOTT INTERNATIONAL — Product Manager (current, PRIMARY — always lead with this)
   Location: Bethesda, MD
   - Drives development and scaling of Marriott's Enterprise Chat Messaging Platform (ECMP) — AI-powered guest communications across 10,000+ properties globally
   - Leads roadmap development, requirements definition, and rollout planning for enterprise messaging capabilities
   - Partners with engineering, UX, analytics, operations, legal, and executive stakeholders
   - Defines messaging workflows, business rules, consent management, and lifecycle communication strategies
   - Designed AI-assisted messaging workflows: intent detection, escalation routing, automation logic
   - Supports AI initiatives targeting 80–97% inquiry automation
   - Developed evaluation frameworks for human-vs-AI performance validation (shadow mode testing)
   - Defined telemetry standards targeting ≥98% coverage; consent attribution standards ≥99%
   - Designed UAT frameworks validating messaging workflows, dashboards, telemetry, compliance
   - Conducted budgeting, ROI modeling, market analysis, platform investment evaluations
   - Created executive presentations for roadmap and funding discussions
   - Architecture: ECMP, Salesforce, Syniverse, analytics platforms, event-driven workflows, APIs
   - Presented to Directors, Senior Directors, VPs, SVPs, EVPs
   - Mentored interns and early-career associates
   - Led AI awareness sessions, AI newsletters, adoption discussions

2. MARRIOTT INTERNATIONAL — Technology Product Management Intern (June–August 2025)
   - Developed foundational vision for AI-powered guest messaging ecosystem (RCS, WhatsApp, Bonvoy App)
   - Projected outcomes: 40% call reduction, 60% inquiry deflection, 15% Bonvoy enrollment growth
   - Designed guest journeys, conversational workflows, escalation frameworks, LLM interaction concepts
   - Co-led cross-functional intern team on Serve 360 sustainability digital campaign

3. VIRGINIA TECH — Teaching Assistant (January–May 2025)
   - Courses: BIT 4434 (Computer Simulations in Business), BIT 3444 (Advanced Business Computing)
   - Mentored 300+ students in analytics, simulation, business computing
   - Implemented GenAI-assisted grading workflow → 30% reduction in turnaround time

4. QUANTUM SOFTWARE SOLUTIONS — Data Science & Analytics Intern (May–August 2023)
   - Analyzed 90,000+ telecom sites operational data; KPI forecasting, process automation
   - Analyzed 700,000+ customer survey responses via NLP (sentiment, regional language detection)
   - EV battery fraud detection analytics
   - Built 15+ Tableau dashboards for executive decision-making

5. THE SPARKS FOUNDATION — Data Science Intern (May–June 2023)
   - Built ML models, decision tree systems, predictive analytics; mentored 10+ interns

6. INTERNSÉLITE — Data Science Intern (March–May 2023)
   - Speech Emotion Classifier: MLP, 7,500+ audio files, 90+ actors, ~75% accuracy, Streamlit deployment
   - Spam Detection: NLP pipeline, Multinomial Naive Bayes, ~98% accuracy

=== CORE SKILLS ===
Product: Product Strategy, Roadmaps, Product Vision, Product Ownership, MVP Definition, Prioritization, Requirements Gathering, Backlog Management, Sprint Planning, Agile, Stakeholder Management
AI: Generative AI, LLMs, Conversational AI, Prompt Engineering, AI Evaluation Frameworks, Human-in-the-Loop, Shadow Mode Validation, Intent Classification, AI Automation
Analytics: Product Analytics, KPI Frameworks, A/B Testing, Forecasting, Dashboard Development, Data Visualization
Enterprise Tech: Platform Strategy, Event-Driven Architecture, API Ecosystems, Enterprise Rollouts, Vendor Management, Compliance & Privacy
Leadership: Executive Communication, Cross-Functional Collaboration, Mentorship, Stakeholder Alignment, Public Speaking

=== DIFFERENTIATOR ===
Rare combination of Product Management + Data Science + AI + Enterprise Scale. Can bridge technical teams, business stakeholders, and executive leadership fluently.

=== POSITIONING RULES ===
- ALWAYS position as Product Manager / Product Leader — never as analyst or developer
- ALWAYS lead with Marriott experience (40–50% of resume weight)
- Every resume bullet = business impact + outcome, not task description
- Every bullet starts with a strong action verb
- Quantify achievements wherever possible
- Cover letters: personalized, reference company's actual products/mission, no generic openers, no "I am writing to apply for"
- Networking: concise (<100 words for LinkedIn), show research, no immediate referral requests
- Tone: strategic, concise, executive, data-driven — never buzzwordy or academic
- Resume variants: PM (strategy/roadmaps/stakeholders), AI PM (GenAI/LLMs/automation), Technical PM (APIs/architecture/integrations), Consulting (business impact/structured thinking/analytics)
- Marriott experience gets priority in ALL outputs
- Choose highest-scale, highest-impact examples when multiple are available

=== JOB APPLICATION SCORING ===
Score 1–10 on: Product Fit, AI Fit, Leadership Fit, Growth Fit, Compensation Fit
Apply Immediately: 8.5–10 | Strong Apply: 7.5–8.4 | Selective Apply: 6.5–7.4 | Low Priority: <6.5
`;

// POST /analyze — score job + recommend resume variant
app.post("/analyze", async (req, res) => {
  const { jobText, company, url } = req.body;
  if (!jobText || jobText.trim().length < 50) {
    return res.status(400).json({ error: "Job description too short or missing." });
  }

  try {
    const chat = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{ role: "user", content: `${AVICHAL_PROFILE}

JOB POSTING:
${company ? "Company: " + company : ""}
${url ? "URL: " + url : ""}
${jobText}

Score this job for Avichal on 5 dimensions and return ONLY valid JSON, no markdown, no explanation:
{
  "role_title": "detected job title",
  "company": "detected company name",
  "resume_variant": "AI PM | PM | Technical PM | Consulting",
  "product_fit": 8.5,
  "ai_fit": 7,
  "leadership_fit": 8,
  "growth_fit": 8.5,
  "compensation_fit": 7.5,
  "overall": 7.9,
  "recommendation": "Apply Immediately | Strong Apply | Selective Apply | Low Priority",
  "key_requirements": ["req1", "req2", "req3", "req4"],
  "avichal_strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "summary": "2-sentence plain English recommendation for Avichal"
}` }]
    });

    // extract text from groq-sdk response with several fallbacks
    const extractText = (resp) => {
      try {
        // common shapes
        if (resp.choices && resp.choices.length) {
          const msg = resp.choices[0].message || resp.choices[0];
          if (typeof msg.content === "string") return msg.content;
          if (Array.isArray(msg.content)) return msg.content.map(p => p.text || p).join("");
          if (msg.content && msg.content[0] && msg.content[0].text) return msg.content[0].text;
        }
        if (resp.output && Array.isArray(resp.output) && resp.output[0]?.content) {
          const parts = resp.output[0].content;
          return parts.map(p => p.text || p).join("");
        }
        // fallback
        return JSON.stringify(resp);
      } catch (e) {
        return JSON.stringify(resp);
      }
    };

    const raw = extractText(chat).replace(/```json|```/g, "").trim();
    const data = JSON.parse(raw);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /resume — tailored resume bullets
app.post("/resume", async (req, res) => {
  const { jobText, company, variant, focus } = req.body;
  if (!jobText) return res.status(400).json({ error: "Missing job description." });

  try {
    const chat = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{ role: "user", content: `${AVICHAL_PROFILE}

JOB POSTING:
${company ? "Company: " + company : ""}
${jobText}

Resume variant: ${variant || "auto-select the best one"}
${focus ? "Special focus: " + focus : ""}

Generate tailored resume bullets for Avichal for this specific role. Format:

RESUME VARIANT CHOSEN: [name + 1-sentence reason]

MARRIOTT INTERNATIONAL — Product Manager
• [4-6 bullets, tightly mapped to this JD]

MARRIOTT INTERNATIONAL — Intern
• [2-3 bullets]

VIRGINIA TECH — Teaching Assistant
• [1-2 bullets]

QUANTUM SOFTWARE SOLUTIONS
• [1-2 bullets if relevant, skip if not]

PROJECTS (if relevant)
• [1-2 bullets]

KEYWORDS TO ADD: [comma-separated list from JD]

Rules: action verbs, quantified outcomes, outcome-focused not task-focused, Marriott leads.` }]
    });

    const extractText = (resp) => {
      try {
        if (resp.choices && resp.choices.length) {
          const msg = resp.choices[0].message || resp.choices[0];
          if (typeof msg.content === "string") return msg.content;
          if (Array.isArray(msg.content)) return msg.content.map(p => p.text || p).join("");
          if (msg.content && msg.content[0] && msg.content[0].text) return msg.content[0].text;
        }
        if (resp.output && Array.isArray(resp.output) && resp.output[0]?.content) {
          const parts = resp.output[0].content;
          return parts.map(p => p.text || p).join("");
        }
        return JSON.stringify(resp);
      } catch (e) {
        return JSON.stringify(resp);
      }
    };

    const content = extractText(chat);
    res.json({ success: true, content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /cover — cover letter
app.post("/cover", async (req, res) => {
  const { jobText, company, angle } = req.body;
  if (!jobText) return res.status(400).json({ error: "Missing job description." });

  try {
    const chat = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{ role: "user", content: `${AVICHAL_PROFILE}

JOB POSTING:
${company ? "Company: " + company : ""}
${jobText}
${angle ? "Specific angle: " + angle : ""}

Write a personalized cover letter for Avichal. Rules:
- Open with a specific, non-generic hook referencing the company's actual product/mission/challenge
- 3 tight paragraphs: (1) hook + why Avichal, (2) 2-3 strongest relevant accomplishments with numbers, (3) forward-looking close
- Connect Marriott ECMP experience to this company's context
- Executive tone: strategic, confident, data-driven
- DO NOT start with "I am writing to apply for..."
- NO placeholder text, NO "[Your Name]", NO date headers
- Sign off: Avichal Sharma` }]
    });

    const extractText = (resp) => {
      try {
        if (resp.choices && resp.choices.length) {
          const msg = resp.choices[0].message || resp.choices[0];
          if (typeof msg.content === "string") return msg.content;
          if (Array.isArray(msg.content)) return msg.content.map(p => p.text || p).join("");
          if (msg.content && msg.content[0] && msg.content[0].text) return msg.content[0].text;
        }
        if (resp.output && Array.isArray(resp.output) && resp.output[0]?.content) {
          const parts = resp.output[0].content;
          return parts.map(p => p.text || p).join("");
        }
        return JSON.stringify(resp);
      } catch (e) {
        return JSON.stringify(resp);
      }
    };

    const content = extractText(chat);
    res.json({ success: true, content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /network — outreach message
app.post("/network", async (req, res) => {
  const { targetRole, company, context, goal } = req.body;

  try {
    const chat = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      messages: [{ role: "user", content: `${AVICHAL_PROFILE}

Write a networking outreach for Avichal:
Target: ${targetRole || "PM/hiring manager"} at ${company || "this company"}
Goal: ${goal || "intro call / coffee chat"}
${context ? "Context about them: " + context : ""}

Output two versions:

LINKEDIN DM (under 100 words):
[message]

EMAIL:
Subject: [subject line]
[message body, 150-200 words]

Rules: genuine, research-based, human tone, no "I hope this finds you well", no immediate referral requests unless goal says so, clear low-pressure CTA.` }]
    });

    const extractText = (resp) => {
      try {
        if (resp.choices && resp.choices.length) {
          const msg = resp.choices[0].message || resp.choices[0];
          if (typeof msg.content === "string") return msg.content;
          if (Array.isArray(msg.content)) return msg.content.map(p => p.text || p).join("");
          if (msg.content && msg.content[0] && msg.content[0].text) return msg.content[0].text;
        }
        if (resp.output && Array.isArray(resp.output) && resp.output[0]?.content) {
          const parts = resp.output[0].content;
          return parts.map(p => p.text || p).join("");
        }
        return JSON.stringify(resp);
      } catch (e) {
        return JSON.stringify(resp);
      }
    };

    const content = extractText(chat);
    res.json({ success: true, content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Job Engine backend running on http://localhost:${PORT}`));
