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

// Steve Jobs is used as an example of the user.

const USER_PROFILE = `You are a job application assistant. Use the profile below to generate all outputs.

=== IDENTITY ===
Name: Steve Jobs
Target roles: Founder, CEO, Product Visionary, Technology Leader
Personal brand: Visionary Product Leader + Design Innovator + Industry Disruptor
Languages: English (native)

=== EXPERIENCE (priority order) ===

1. APPLE INC. — Co-Founder & CEO (PRIMARY)
   Location: Cupertino, CA
   - Co-founded Apple in 1976 and helped pioneer the personal computer revolution 
   - Led development and launch of groundbreaking products including Macintosh, iPod, iPhone, and iPad 
   - Transformed Apple into a global leader in consumer technology through product innovation and design excellence 
   - Simplified product portfolio and revitalized Apple’s business strategy after returning as CEO in 1997 
   - Championed intuitive user interfaces (GUI) that made computing accessible to mass consumers
   - Drove integration of hardware, software, and services ecosystems (e.g., iTunes, App Store)
   - Led iconic product marketing and storytelling ("Think Different" campaign) 
   - Oversaw design-driven product culture emphasizing simplicity, usability, and aesthetics
   - Presented product launches and strategy directly to global audiences and executive stakeholders
   - Built Apple into one of the most influential technology companies globally

2. PIXAR ANIMATION STUDIOS — Founder, Chairman & CEO
   - Acquired and scaled Pixar into a leading animation studio 
   - Produced the first fully computer-animated feature film, *Toy Story* (1995)
   - Established Pixar as a leader in digital animation and storytelling
   - Led Pixar’s acquisition by Disney, becoming its largest individual shareholder 

3. NeXT INC. — Founder & CEO
   - Founded NeXT after departing Apple in 1985 
   - Built advanced computer platforms for education and enterprise use
   - Developed software foundations that later powered Apple’s modern operating systems
   - NeXT acquisition by Apple enabled his return and Apple’s strategic turnaround 

4. ATARI — Product/Engineering Contributor
   - Worked as a video game designer early in career 
   - Developed foundational technical and product instincts in interactive systems

=== CORE SKILLS ===
Product: Product Vision, Zero-to-One Innovation, Product Strategy, User-Centric Design, Hardware-Software Integration
AI/Tech: Personal Computing, Consumer Electronics, Digital Media Ecosystems, Software Platforms
Design: Human-Centered Design, Simplicity, Industrial Design Excellence, UX Innovation
Leadership: Visionary Thinking, Executive Communication, Product Storytelling, High-Performance Culture Building
Business: Go-to-Market Strategy, Brand Building, Ecosystem Strategy, Corporate Turnarounds

=== DIFFERENTIATOR ===
Rare ability to combine product vision, design excellence, and business strategy to create category-defining products and entirely new industries.

=== POSITIONING RULES ===
- Always position as visionary product leader and founder
- Lead with Apple transformation and product innovation impact
- Every bullet emphasizes industry-changing impact, not tasks
- Highlight product launches that redefined categories (Mac, iPhone, iPad)
- Emphasize design + user experience as core differentiator
- Use bold, decisive, visionary tone

=== JOB APPLICATION SCORING ===
Score 1–10 on: Product Fit, Innovation Fit, Leadership Fit, Vision Fit, Market Impact Fit
Apply Immediately: 9–10
Strong Apply: 8–8.9
Selective Apply: 7–7.9
Low Priority: <7
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
