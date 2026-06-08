const APEX_PROFILE = {
  personal: {
    firstName: "Avichal", lastName: "Sharma", fullName: "Avichal Sharma",
    email: "avichalsharma2003@gmail.com", phone: "+1 (540) 934-8428",
    phoneRaw: "5409348428", address: "Bethesda, MD, USA", city: "Bethesda",
    state: "Maryland", stateCode: "MD", zip: "20814", country: "United States",
    dob: "10/13/2003", dobYear: "2003", dobMonth: "10", dobDay: "13",
    nationality: "Indian", gender: "Male", ethnicity: "Asian",
    veteranStatus: "No", disabilityStatus: "No"
  },
  professional: {
    linkedin: "https://www.linkedin.com/in/avichalsharma7/",
    github: "https://github.com/avichals",
    tableau: "https://public.tableau.com/app/profile/avichalsharma",
    website: "https://tinyurl.com/avichalsharmaportfolio",
    salaryMin: "120000", salaryMax: "150000", salaryMid: "135000",
    salaryRange: "$120,000 - $150,000",
    relocate: "Yes",
    workAuth: "F-1 OPT (Authorized to work until Fall 2028)",
    sponsorship: "Yes, until Fall 2028",
    previouslyWorked: "No", relatedToEmployee: "No"
  },
  education: [
    {
      degree: "Bachelor of Science",
      major: "Business Information Technology (Cybersecurity Management & Analytics)",
      school: "Virginia Tech", graduationYear: "2025", startYear: "2021",
      gpa: "4.0", gpaScale: "4.0", location: "Blacksburg, VA"
    },
    {
      degree: "Bachelor of Technology",
      major: "Computer Science (Data Science)",
      school: "NMIMS, Mumbai", graduationYear: "2024", startYear: "2021",
      gpa: "3.6", gpaScale: "4.0", location: "Mumbai, India"
    }
  ],
  references: [
    { name: "Fay Hung", title: "Director, Technology Product Management",
      company: "Marriott International", email: "fay.hung@marriott.com",
      phone: "+1 (650) 888-8734" },
    { name: "Alan Abrahams", title: "Associate Professor, Business Information Technology",
      company: "Virginia Tech", email: "abra@vt.edu",
      phone: "+1 (267) 241-6098" },
    { name: "Noah Kim", title: "Sr Manager, Technology Product Management",
      company: "Marriott International", email: "noah.kim@marriott.com",
      phone: "+1 (571) 606-0548" }
  ]
};

const FIELD_MAP = [
  [["first name"], "personal.firstName"],
  [["last name"], "personal.lastName"],
  [["full name", "your name", "applicant name", "name"], "personal.fullName"],
  [["email", "e-mail", "email address"], "personal.email"],
  [["phone", "mobile", "cell", "telephone"], "personal.phone"],
  [["city"], "personal.city"],
  [["state"], "personal.stateCode"],
  [["zip", "postal", "postcode"], "personal.zip"],
  [["country"], "personal.country"],
  [["address", "street"], "personal.address"],
  [["linkedin", "linkedin url", "linkedin profile"], "professional.linkedin"],
  [["github", "github url"], "professional.github"],
  [["tableau", "tableau url"], "professional.tableau"],
  [["website", "portfolio", "personal site"], "professional.website"],
  [["minimum salary", "salary min"], "professional.salaryMin"],
  [["maximum salary", "salary max"], "professional.salaryMax"],
  [["salary", "compensation", "desired salary", "expected salary"], "professional.salaryMid"],
  [["work authorization", "work auth", "authorized to work", "visa"], "professional.workAuth"],
  [["sponsorship", "require sponsorship", "need sponsorship"], "professional.sponsorship"],
  [["relocate", "relocation", "willing to relocate"], "professional.relocate"],
  [["date of birth", "dob", "birth date"], "personal.dob"],
  [["nationality", "citizenship"], "personal.nationality"],
  [["gender", "sex"], "personal.gender"],
  [["ethnicity", "race", "ethnic"], "personal.ethnicity"],
  [["veteran", "military", "military status"], "personal.veteranStatus"],
  [["disability", "disabled"], "personal.disabilityStatus"],
  [["previously worked", "worked here before", "former employee"], "professional.previouslyWorked"],
  [["related to", "family member", "relative"], "professional.relatedToEmployee"],
  [["university", "college", "school", "institution"], "education[0].school"],
  [["degree", "highest degree", "education level"], "education[0].degree"],
  [["major", "field of study", "concentration"], "education[0].major"],
  [["graduation year", "grad year"], "education[0].graduationYear"],
  [["gpa", "grade point"], "education[0].gpa"]
];

function resolvePath(path) {
  const parts = path.split('.');
  let value = APEX_PROFILE;
  for (const part of parts) {
    const arrayMatch = part.match(/(.+)\[(\d+)\]/);
    if (arrayMatch) {
      const key = arrayMatch[1];
      const index = Number(arrayMatch[2]);
      if (!value || !value[key] || !Array.isArray(value[key])) return undefined;
      value = value[key][index];
    } else {
      if (!value || !(part in value)) return undefined;
      value = value[part];
    }
  }
  return value;
}

function getFieldValue(label) {
  if (!label) return "";
  const normalized = label.toLowerCase();
  for (const [keywords, path] of FIELD_MAP) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        const value = resolvePath(path);
        if (value !== undefined && value !== null) return String(value);
      }
    }
  }
  return "";
}

function getLabelText(el) {
  if (!el) return "";
  const linked = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
  if (linked?.innerText?.trim()) return linked.innerText.trim();
  const aria = el.getAttribute("aria-label");
  if (aria?.trim()) return aria.trim();
  const placeholder = el.placeholder;
  if (placeholder?.trim()) return placeholder.trim();
  const name = el.name;
  if (name?.trim()) return name.replace(/[-_]+/g, " ").trim();
  const closestLabel = el.closest("label");
  if (closestLabel?.innerText?.trim()) return closestLabel.innerText.trim();
  const parentLabel = el.parentElement?.querySelector("label");
  if (parentLabel?.innerText?.trim()) return parentLabel.innerText.trim();
  const sibling = el.previousElementSibling;
  if (sibling?.tagName === "LABEL" && sibling.innerText?.trim()) return sibling.innerText.trim();
  return "";
}

function dispatchEvents(el) {
  for (const type of ["input", "change", "keyup"]) {
    const event = new Event(type, { bubbles: true });
    el.dispatchEvent(event);
  }
}

function fillInput(el, value) {
  if (!value || typeof value !== "string") return false;
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value") || Object.getOwnPropertyDescriptor(el, "value");
  try {
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
    dispatchEvents(el);
    return true;
  } catch (error) {
    return false;
  }
}

function fillSelectField(el, value) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  for (const option of Array.from(el.options || [])) {
    const optionText = (option.text || "").toLowerCase();
    const optionValue = (option.value || "").toLowerCase();
    if (optionText.includes(normalized) || optionValue.includes(normalized)) {
      el.value = option.value;
      dispatchEvents(el);
      return true;
    }
  }
  return false;
}

function highlightField(el, filled) {
  const originalBackground = el.style.backgroundColor;
  const originalBorder = el.style.borderColor;
  el.style.backgroundColor = filled ? "#f0fff4" : "#fffbeb";
  el.style.borderColor = filled ? "#22c55e" : "#f59e0b";
  setTimeout(() => {
    el.style.backgroundColor = originalBackground || "";
    el.style.borderColor = originalBorder || "";
  }, filled ? 2000 : 3000);
}

async function runAutofill(coverLetter = "", whyText = "") {
  const controls = Array.from(document.querySelectorAll(
    'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select'
  ));

  const filledFields = [];
  const skippedFields = [];
  let filled = 0;
  let skipped = 0;

  for (const el of controls) {
    if (el.disabled || el.readOnly) continue;
    const currentValue = (el.value || "").trim();
    if (currentValue.length > 0) continue;

    const label = getLabelText(el);
    const labelLower = label.toLowerCase();
    let value = "";
    let success = false;

    if (el.tagName === "SELECT") {
      value = getFieldValue(label);
      if (value) success = fillSelectField(el, value);
    } else if (el.tagName === "TEXTAREA") {
      if (labelLower.includes("cover letter")) {
        value = coverLetter;
      } else if (/(why|motivation|tell us|interest)/.test(labelLower)) {
        value = whyText;
      } else {
        value = getFieldValue(label);
      }
      if (value) success = fillInput(el, value);
    } else {
      value = getFieldValue(label);
      if (value) success = fillInput(el, value);
    }

    if (success) {
      highlightField(el, true);
      filled += 1;
      filledFields.push(label || el.name || el.placeholder || el.id || el.type || "Field");
    } else {
      highlightField(el, false);
      skipped += 1;
      skippedFields.push(label || el.name || el.placeholder || el.id || el.type || "Field");
    }
  }

  return { filled, skipped, filledFields, skippedFields };
}

const waitAndExtract = async () => {
  const maxAttempts = 20;
  const intervalMs = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const bodyText = document.body?.innerText || "";
    console.log(`Poll attempt ${attempt}, body length: ${bodyText.length}`);

    if (bodyText.length > 500) {
      const title = document.querySelector("h1")?.innerText?.trim() || document.title || "";
      const company = document.querySelector("meta[property=\"og:site_name\"]")?.getAttribute("content") || "";
      const rawBody = bodyText;
      const cleaned = rawBody.replace(/\n{3,}/g, "\n\n").trim();
      const description = cleaned.substring(0, 6000);

      window.__jobEngineData = {
        title: title.substring(0, 120),
        company: company.substring(0, 80),
        description,
        url: location.href,
        success: description.length > 300
      };

      console.log(`APEX ready — raw: ${rawBody.length}, cleaned: ${cleaned.length}`);
      return window.__jobEngineData;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  const title = document.querySelector("h1")?.innerText?.trim() || document.title || "";
  const company = document.querySelector("meta[property=\"og:site_name\"]")?.getAttribute("content") || "";
  const rawBody = document.body?.innerText || "";
  const cleaned = rawBody.replace(/\n{3,}/g, "\n\n").trim();
  const description = cleaned.substring(0, 6000);

  window.__jobEngineData = {
    title: title.substring(0, 120),
    company: company.substring(0, 80),
    description,
    url: location.href,
    success: description.length > 300
  };

  console.log(`APEX ready — raw: ${rawBody.length}, cleaned: ${cleaned.length}`);
  return window.__jobEngineData;
};

waitAndExtract();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "runAutofill") {
    runAutofill(message.coverLetter || "", message.whyText || "")
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message?.action === "getJobData") {
    const ensureData = window.__jobEngineData?.description ? Promise.resolve(window.__jobEngineData) : waitAndExtract();
    ensureData.then((data) => sendResponse(data)).catch((error) => sendResponse({ title: "", company: "", description: "", url: location.href, error: error.message }));
    return true;
  }
});
