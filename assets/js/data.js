// Single source of truth for the interactive parts of the site (graph, shell, palette).
// The static HTML cards carry the same facts for search engines and no-JS visitors.

export const PROFILE = {
  name: "John B. Roberts",
  handle: "roberjo",
  title: "AWS Solutions Architect / AI Automation",
  location: "LaGrange, Georgia, USA",
  headline: "Sr. Software Engineer · Cloud Solutions Architect · Dev Lead",
  email: "johnbroberts@gmail.com",
  github: "https://github.com/roberjo",
  linkedin: "https://linkedin.com/in/roberjo",
  certs: ["AWS Certified Solutions Architect – Professional", "AWS Certified DevOps Engineer – Professional"],
  about:
    "I build high-leverage software systems: cloud architectures on AWS, automation that removes toil, " +
    "and AI workflows that put LLMs to work inside real engineering processes. Secure, cost-aware, observable, and tested.",
};

// Category hubs for the hero graph. Colors are read from CSS at runtime.
export const HUBS = [
  { id: "ai", label: "AI", color: "--violet" },
  { id: "cloud", label: "Cloud", color: "--accent" },
  { id: "legacy", label: "Legacy", color: "--amber" },
  { id: "web", label: "Web", color: "--sky" },
];

export const PROJECTS = [
  { id: "mainframe-frontier", tags: ["legacy"], featured: true, stack: "Rust · GnuCOBOL · JCL · Docker",
    blurb: "A realistic COBOL batch shop that runs without a mainframe, wrapped in modern tooling: job visibility, EBCDIC data access, monitoring.",
    url: "https://github.com/roberjo/mainframe-frontier" },
  { id: "ticket-remediation", tags: ["ai", "cloud"], featured: true, stack: "Python · Claude · Gemini · Jira · ServiceNow",
    blurb: "ServiceNow vulnerability findings become Jira issues; an LLM reads the repo, writes the fix, and opens a GitHub PR.",
    url: "https://github.com/roberjo/ticket-remediation" },
  { id: "tool-enabler", tags: ["ai"], featured: true, stack: "Python · Claude Code · Copilot · Gemini CLI · Codex",
    blurb: "Teaches AI coding agents to use your tools: one catalog compiled into Claude Code Skills, AGENTS.md, GEMINI.md, and Copilot instructions.",
    url: "https://github.com/roberjo/tool-enabler" },
  { id: "aws-testing", tags: ["cloud"], featured: true, stack: "Terraform · Lambda · SNS/SQS · DynamoDB · Kafka · Next.js",
    blurb: "A full event-driven AWS app (~70 Terraform resources) deployed and tested on a laptop: 22 end-to-end tests, 15 documented findings.",
    url: "https://github.com/roberjo/aws-testing" },
  { id: "VINScout", tags: ["cloud", "web"], featured: true, stack: "TypeScript · Cloudflare Workers · Hono · D1 · React",
    blurb: "Used-vehicle screening: real listings every 6 hours, a mandatory history gate, then ranking on price, mileage, and NHTSA recalls.",
    url: "https://github.com/roberjo/VINScout" },
  { id: "world-radio", tags: ["web"], featured: true, stack: "TypeScript · Vite · Leaflet · HLS.js",
    blurb: "5,000+ live radio stations on a clustered world map, with a regional scanner mode and shareable lists.",
    url: "https://github.com/roberjo/world-radio", live: "https://roberjo.github.io/world-radio/" },
  { id: "AuraStream", tags: ["ai", "cloud"], stack: "Python · Lambda · Comprehend · Terraform",
    blurb: "Serverless sentiment analysis API, real-time and batch, with PII protection and caching.",
    url: "https://github.com/roberjo/AuraStream" },
  { id: "AdPilot", tags: ["ai", "web"], stack: "Next.js · Vercel AI SDK · Claude / OpenAI / Gemini",
    blurb: "Conversational AdTech agent system.", url: "https://github.com/roberjo/AdPilot" },
  { id: "intellidoc-rag-system", tags: ["ai"], stack: "FastAPI · ChromaDB · PostgreSQL",
    blurb: "Query and summarize document collections with LLMs, with source citations.",
    url: "https://github.com/roberjo/intellidoc-rag-system" },
  { id: "usps-cobol-addresses", tags: ["legacy"], stack: "GnuCOBOL · GixSQL · PostgreSQL",
    blurb: "A mainframe COBOL/DB2 batch job recreated locally, with commit/restart and golden-file CI.",
    url: "https://github.com/roberjo/usps-cobol-addresses" },
  { id: "guardrail-radar", tags: ["ai"], stack: "Python · GitHub Actions · Pages",
    blurb: "Zero-budget, source-grounded content discovery for an AI-assisted-development newsletter.",
    url: "https://github.com/roberjo/guardrail-radar" },
  { id: "aws-multi-account-organization", tags: ["cloud"], stack: "Terraform · AWS Organizations",
    blurb: "AWS Organizations with automated account provisioning and centralized security.",
    url: "https://github.com/roberjo/aws-multi-account-organization" },
  { id: "aurora-batch", tags: ["cloud"], stack: "Terraform Cloud · Aurora · Snowflake",
    blurb: "Serverless replication from Aurora PostgreSQL to Snowflake over PrivateLink.",
    url: "https://github.com/roberjo/aurora-batch" },
  { id: "role-fusion", tags: ["web"], stack: "React · TypeScript · Tailwind",
    blurb: "Role-based access control UI with granular permissions and dynamic roles.",
    url: "https://github.com/roberjo/role-fusion", live: "https://role-fusion.lovable.app/" },
  { id: "ssis-parser", tags: ["legacy"], stack: "Python · CLI",
    blurb: "Parses and analyzes SSIS packages and migrates them to Python-based ETL.",
    url: "https://github.com/roberjo/ssis-parser" },
];

export const SKILLS = {
  cloud: ["AWS Lambda", "API Gateway", "DynamoDB", "S3", "EventBridge", "Step Functions", "SNS/SQS", "ECS/EKS", "CloudFront", "Organizations", "Cloudflare Workers"],
  ai: ["Anthropic Claude", "Claude Code", "Google Gemini", "OpenAI", "GitHub Copilot", "RAG"],
  infra: ["Terraform", "CloudFormation", "AWS CDK", "Docker", "Kubernetes", "GitHub Actions", "Harness", "Jenkins"],
  languages: ["Python", "TypeScript", "Rust", "COBOL", "C#/.NET", "Bash", "React", "Next.js", "FastAPI", "Hono"],
  observability: ["CloudWatch", "X-Ray", "Prometheus", "Grafana", "ELK", "Zero Trust", "SOC 2 / ISO 27001"],
};

// From LinkedIn (linkedin.com/in/roberjo), newest first.
export const CAREER = [
  { years: "2013 – now", org: "Regions Financial Corporation", role: "Sr. Software Engineer / Solutions Architect",
    note: "Enterprise AWS architecture for a Fortune 500 bank; .NET modernization; Harness and GitHub Actions pipelines; PCI DSS and SOC 2." },
  { years: "2011 – 2013", org: "Kelsey Advertising & Design", role: "Sr. Software Engineer",
    note: "Benefits and HR platforms; PHP, MEAN stack, Backbone, Ember, Angular; Raspberry Pi kiosks and real-time KPI dashboards." },
  { years: "2010 – 2011", org: "General Dynamics Information Technology", role: "Sr. Software Engineer",
    note: "Modernized a VB.NET legacy app on .NET 4, WCF data services, and SQL Server, with automated TFS builds." },
  { years: "2008 – 2010", org: "Aflac", role: "SCM DevOps",
    note: "Serena change management: source control, automated build and deployment for production apps." },
  { years: "2001 – 2008", org: "AT&T", role: "Senior Member of Technical Staff",
    note: "C/C++ for large-scale data mining at AT&T Labs; data analysis and technical assurance; international technical systems auditor." },
  { years: "1999 – 2001", org: "Auburn University", role: "Web Developer",
    note: "Site design and web server upkeep for the Cellular and Molecular Biosciences research department." },
];

export const EDUCATION = [{ school: "Auburn University" }];

export const SECTIONS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "capabilities", label: "Capabilities" },
  { id: "architecture", label: "Architecture" },
  { id: "career", label: "Career" },
  { id: "projects", label: "Projects" },
  { id: "activity", label: "Live activity" },
  { id: "stack", label: "Stack" },
  { id: "writing", label: "Writing" },
  { id: "contact", label: "Contact" },
];
