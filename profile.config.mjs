// ─────────────────────────────────────────────────────────────────────────────
//  profile.config.mjs: the one file to edit.
//
//  Everything personal lives here: name, title, links, projects, skills.
//  The README, the 3D hero, the project cards, the icon rows and the platform
//  diagram are all generated from it. After editing:
//
//    cd studio && npm run build     # README + icons + diagram (seconds)
//    cd studio && npm run render    # re-record the 3D hero and cards (~15 min)
//
//  See docs/GUIDE.md for the full walkthrough.
// ─────────────────────────────────────────────────────────────────────────────

export default {
  // Your GitHub username. The repo must be named exactly the same for GitHub to
  // show it on your profile, e.g. github.com/Vijayrajdev/Vijayrajdev.
  github: "Vijayrajdev",
  repo: "vijayrajdev",

  // ── Hero ───────────────────────────────────────────────────────────────────
  name: "Vijay Raj",
  title: "Senior Data Engineer",
  greeting: "Hello, I'm", // the glowing pill above your name
  // Rotating lines under the title. Wrap words in <b> to highlight them.
  taglines: [
    "Building data platforms that <b>build themselves</b>.",
    "Pipelines that <b>heal</b> before the pager rings.",
    "<b>dbt</b> · <b>BigQuery</b> · <b>Dataform</b> · <b>Terraform</b> · <b>GCP</b>",
    "Raw files in. <b>Reviewed SQL, tests and docs</b> out.",
  ],
  // Pills under the taglines. color: cyan | violet | pink | green
  chips: [
    { label: "Chennai, IN", color: "cyan" },
    { label: "@ Ingram Micro", color: "violet" },
    { label: "open to collabs", color: "green", pulse: true },
  ],
  website: "https://vijayrajck.vercel.app/",

  // ── Links ──────────────────────────────────────────────────────────────────
  // icon: "skill:<id>" from skillicons.dev, or "si:<export>[:hex]" from simple-icons.
  socials: [
    { label: "Portfolio", url: "https://vijayrajck.vercel.app/", icon: "skill:vercel" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/vijay-raj-02/", icon: "skill:linkedin" },
    { label: "Email", url: "mailto:vijayck2002@gmail.com", icon: "skill:gmail" },
    { label: "X", url: "https://x.com/Vijayrjdev", icon: "si:siX:ffffff" },
    { label: "Instagram", url: "https://www.instagram.com/vjxx_rj/", icon: "si:siInstagram:E4405F" },
    { label: "Discord", url: "https://discord.com/users/vijay_rj", icon: "skill:discord" },
  ],

  // ── About (bento grid) ─────────────────────────────────────────────────────
  // Your GitHub avatar is pulled in automatically.
  about: {
    role: "Senior Data Engineer",
    company: "Ingram Micro",
    location: "Chennai, India",
    intro: "I design and run data platforms on Google Cloud, from ingestion to the dashboards people trust.",
    focus: [
      "Data platforms that build (and heal) themselves",
      "dbt, BigQuery, Dataform and Terraform on GCP",
      "Agentic automation for the boring parts of data work",
    ],
    building: { name: "Pipewright", text: "Raw files in; reviewed SQL, tests and pipelines out." },
    askMeAbout: ["data modeling", "pipelines", "cloud warehouses", "dbt"],
    also: "Full-stack apps with React, Next.js and Node",
  },

  // ── Platform diagram ───────────────────────────────────────────────────────
  platform: {
    kicker: "The platform I build",
    heading: "From raw source to trusted insight",
    sub: "End-to-end on Google Cloud: ingestion that heals itself, a warehouse modeled in layers, and every change shipped as code.",
    // Up to 6 stages. logos use the same icon syntax as socials; [] draws a generic glyph.
    stages: [
      { title: "Sources", lines: ["REST APIs", "CSV · JSON files", "app events"], logos: [], color: "#94a3c4" },
      { title: "Ingest", lines: ["Python services", "Cloud Run · Functions", "retries, self-healing"], logos: ["skill:py", "si:siGooglecloud"], color: "#22d3ee" },
      { title: "Lake", lines: ["Cloud Storage", "raw, immutable,", "partitioned"], logos: ["si:siGooglecloudstorage"], color: "#38bdf8" },
      { title: "Warehouse", lines: ["BigQuery", "modeled layers", "staging → marts"], logos: ["si:siGooglebigquery"], color: "#818cf8" },
      { title: "Transform", lines: ["dbt · Dataform", "tests, docs,", "lineage"], logos: ["si:siDbt"], color: "#a78bfa" },
      { title: "Serve", lines: ["Looker Studio", "dashboards, apps", "and APIs"], logos: ["si:siLooker", "skill:nextjs"], color: "#f472b6" },
    ],
    foundation: [["Terraform", "skill:terraform"], ["Docker", "skill:docker"], ["GitHub Actions", "skill:githubactions"], ["Google Cloud", "skill:gcp"]],
  },

  // ── Projects ───────────────────────────────────────────────────────────────
  // Each becomes an animated 3D card. To add one, copy an entry, give it a new
  // id, and run `npm run render` (or `npm run render -- <id>` for just that card).
  //   scene: knot | shield | network | planet | cubes | chip  (the 3D object)
  //   accent: card highlight colour; langColor: the dot next to the language
  //   desc: keep it to ~110 characters so it fits on two lines
  projects: [
    {
      id: "pipewright", title: "Pipewright", repo: "Vijayrajdev/Pipewright", scene: "knot",
      kicker: "data tooling", lang: "TypeScript", langColor: "#3178c6", accent: "#22d3ee",
      desc: "Drop in your files. It infers schema, keys and relationships, then drafts the DDL, SQL, tests, docs and pipelines.",
      tags: ["next.js", "claude", "data-modeling"],
    },
    {
      id: "sentinel", title: "Sentinel-Forge", repo: "Vijayrajdev/sentinel", scene: "shield",
      kicker: "platform", lang: "Python", langColor: "#3572A5", accent: "#a78bfa",
      desc: "A fully autonomous, self-healing data ingestion and infrastructure platform.",
      tags: ["terraform", "dataform", "self-healing"],
    },
    {
      id: "nexus", title: "Nexus Engine", repo: "Vijayrajdev/nexus-autonomous-data-engine", scene: "network",
      kicker: "platform", lang: "Python", langColor: "#3572A5", accent: "#f472b6",
      desc: "End-to-end data platform marrying IaC, modern dbt transformations and agentic orchestration.",
      tags: ["dbt", "terraform", "agents"],
    },
    {
      id: "portfolio", title: "Space Portfolio", repo: "Vijayrajdev/vijayrajck-portfolio", scene: "planet",
      kicker: "web · 3d", lang: "JavaScript", langColor: "#f1e05a", accent: "#a78bfa",
      desc: "A space-themed 3D portfolio. Data platforms that build themselves, and a site that behaves like one.",
      tags: ["three.js", "r3f", "vite"],
    },
    {
      id: "mac-cleanup", title: "mac-cleanup", repo: "Vijayrajdev/mac-cleanup", scene: "cubes",
      kicker: "claude skill", lang: "HTML", langColor: "#e34c26", accent: "#4ade80",
      desc: "Approval-first Mac cleanup for Claude: risk ratings, a themed report and Trash-only removal.",
      tags: ["claude-skill", "macos", "automation"],
    },
    {
      id: "pc-deepclean", title: "pc-deepclean", repo: "Vijayrajdev/pc-deepclean", scene: "chip",
      kicker: "automation", lang: "PowerShell", langColor: "#5391fe", accent: "#22d3ee",
      desc: "Analyse-first Windows clean-up: frees disk, RAM and OneDrive space, only what you approve, with undo.",
      tags: ["windows", "reports", "undo"],
    },
  ],

  // ── Skills ─────────────────────────────────────────────────────────────────
  // [label, icon]. Up to 13 per row fits the README width.
  stacks: [
    {
      title: "Data & cloud", slug: "data",
      items: [
        ["GCP", "skill:gcp"], ["BigQuery", "si:siGooglebigquery"], ["dbt", "si:siDbt"], ["Spark", "si:siApachespark"],
        ["Looker", "si:siLooker"], ["Jupyter", "si:siJupyter"], ["AWS", "skill:aws"], ["Terraform", "skill:terraform"],
        ["Docker", "skill:docker"], ["Kubernetes", "skill:kubernetes"], ["Postgres", "skill:postgres"], ["MongoDB", "skill:mongodb"],
        ["Firebase", "skill:firebase"],
      ],
    },
    {
      title: "Languages & web", slug: "web",
      items: [
        ["Python", "skill:py"], ["TypeScript", "skill:ts"], ["JavaScript", "skill:js"], ["C++", "skill:cpp"], ["HTML", "skill:html"],
        ["CSS", "skill:css"], ["React", "skill:react"], ["Next.js", "skill:nextjs"], ["Node.js", "skill:nodejs"], ["Express", "skill:express"],
        ["three.js", "skill:threejs"], ["Tailwind", "skill:tailwind"], ["Bootstrap", "skill:bootstrap"],
      ],
    },
    {
      title: "ML & tooling", slug: "tools",
      items: [
        ["TensorFlow", "skill:tensorflow"], ["Git", "skill:git"], ["GitHub", "skill:github"], ["Actions", "skill:githubactions"],
        ["VS Code", "skill:vscode"], ["Vite", "skill:vite"], ["Vercel", "skill:vercel"], ["Markdown", "skill:md"], ["LaTeX", "skill:latex"],
      ],
    },
  ],

  // ── Sections ───────────────────────────────────────────────────────────────
  // Turn README sections on or off. Stats need the METRICS_TOKEN secret (docs/GUIDE.md).
  // Each section gets a numbered header; edit the titles and one-line subtitles here.
  headers: {
    about: ["About", "Who I am and what I work on"],
    platform: ["The platform I build", "From raw source to trusted insight, end to end on Google Cloud"],
    projects: ["Featured work", "Things I've built lately, each with its own 3D scene"],
    stack: ["Toolbox", "What I reach for every day"],
    galaxy: ["Guestbook", "Leave a star: one click and you're part of the galaxy"],
    stats: ["Activity", "Contributions, languages and the snake that eats them"],
  },
  sections: {
    about: true,
    platform: true,
    projects: true,
    stack: true,
    galaxy: true,
    stats: true,
    snake: true,
    dailyBreak: true,
    viewCounter: true,
  },
};
