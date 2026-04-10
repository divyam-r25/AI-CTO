import type { DomainGuide, ModeGuide, PlanningMode, ProjectDomain } from "@/lib/types";
import type { SignalFlags, SkillRuntimeContext } from "@/lib/skills/contracts";

const MODEL_INTEGRATION_KEYWORDS = [
  "ai",
  "llm",
  "translator",
  "summarizer",
  "chat",
  "vision",
  "speech",
  "huggingface",
  "openai",
  "gemini",
];

const REALTIME_KEYWORDS = ["real-time", "realtime", "live", "streaming", "voice"];
const B2B_KEYWORDS = ["enterprise", "team", "workspace", "admin", "dashboard"];
const MOBILE_KEYWORDS = ["mobile", "ios", "android", "app store"];
const COMPLIANCE_KEYWORDS = ["gdpr", "hipaa", "soc2", "pci", "compliance", "security"];

export function normalize(text: string): string {
  return text.toLowerCase();
}

export function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rpn(likelihood: number, impact: number, detectability: number): number {
  return likelihood * impact * detectability;
}

export function deriveProductName(prd: string): string {
  const firstLine = prd
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) {
    return "Untitled Product";
  }

  const clean = firstLine.replace(/^#+\s*/, "");
  return clean.length > 70 ? `${clean.slice(0, 67)}...` : clean;
}

export function modeProfile(mode: PlanningMode): {
  roadmapBias: string;
  architectureBias: string;
  riskDelta: number;
  confidenceDelta: number;
  costBias: string;
} {
  switch (mode) {
    case "beginner-startup":
      return {
        roadmapBias: "Compress delivery into short validation loops.",
        architectureBias: "Prefer managed services over custom infrastructure.",
        riskDelta: 1,
        confidenceDelta: -2,
        costBias: "Minimize upfront spend and keep burn predictable.",
      };
    case "enterprise":
      return {
        roadmapBias: "Gate releases with security, governance, and reliability checks.",
        architectureBias: "Favor control, auditability, and policy enforcement.",
        riskDelta: 1,
        confidenceDelta: -5,
        costBias: "Accept higher base cost for compliance-grade guarantees.",
      };
    default:
      return {
        roadmapBias: "Balance launch speed with scale-readiness.",
        architectureBias: "Use pragmatic modular architecture with clear upgrade paths.",
        riskDelta: 0,
        confidenceDelta: 1,
        costBias: "Optimize cost per active user while protecting reliability.",
      };
  }
}

export function inferDomain(normalized: string): ProjectDomain {
  if (hasAny(normalized, ["fintech", "payments", "billing", "bank", "ledger", "kyc", "aml"])) {
    return "fintech";
  }

  if (hasAny(normalized, ["marketplace", "buyers", "sellers", "listing", "inventory", "order"])) {
    return "marketplace";
  }

  if (hasAny(normalized, ["internal tool", "ops", "workflow automation", "admin dashboard"])) {
    return "internal-tools";
  }

  if (hasAny(normalized, ["compliance", "regulated", "hipaa", "soc2", "gdpr", "audit"])) {
    return "regulated";
  }

  if (hasAny(normalized, ["saas", "subscription", "workspace", "dashboard", "b2b"])) {
    return "saas";
  }

  return "ai-tool";
}

export function buildDomainGuide(domain: ProjectDomain): DomainGuide {
  switch (domain) {
    case "fintech":
      return {
        domain,
        domainLabel: "FinTech",
        priorities: ["Risk controls first", "Auditable transaction paths", "Compliance-aware release gates"],
        guardrails: ["Never ship without audit logging", "Treat fraud and policy review as launch blockers"],
      };
    case "marketplace":
      return {
        domain,
        domainLabel: "Marketplace",
        priorities: ["Liquidity in one core loop", "Trust and safety", "Supply/demand balance"],
        guardrails: ["Measure match rate and conversion", "Avoid broadening segments too early"],
      };
    case "internal-tools":
      return {
        domain,
        domainLabel: "Internal Tools",
        priorities: ["Adoption by the operating team", "Workflow reliability", "Fast iteration"],
        guardrails: ["Optimize for time saved", "Avoid premature platform abstraction"],
      };
    case "regulated":
      return {
        domain,
        domainLabel: "Regulated / Compliance Heavy",
        priorities: ["Policy enforcement", "Auditability", "Access control and retention"],
        guardrails: ["Security review before launch", "Document every data flow"],
      };
    case "saas":
      return {
        domain,
        domainLabel: "SaaS",
        priorities: ["Activation and retention", "Subscription unit economics", "Repeatable onboarding"],
        guardrails: ["Measure time-to-value", "Keep support load low"],
      };
    default:
      return {
        domain,
        domainLabel: "AI Tool",
        priorities: ["Model quality", "Latency and cost controls", "Fallback behavior"],
        guardrails: ["Track prompt/model drift", "Route by request value"],
      };
  }
}

export function parsePrdLines(prd: string): Array<{ line: number; text: string }> {
  return prd
    .split("\n")
    .map((line, index) => ({ line: index + 1, text: line.trim() }))
    .filter((item) => item.text.length > 0);
}

export function buildModeGuide(mode: PlanningMode): ModeGuide {
  switch (mode) {
    case "beginner-startup":
      return {
        modeLabel: "Beginner Startup",
        priorities: [
          "Ship fast to validate a narrow value proposition",
          "Use defaults and managed services to reduce setup time",
          "Avoid architecture complexity before product pull is proven",
        ],
        guardrails: [
          "Set hard monthly spend caps",
          "Delay custom infrastructure until repeat usage is proven",
          "Treat differentiation as a release gate",
        ],
      };
    case "enterprise":
      return {
        modeLabel: "Enterprise",
        priorities: [
          "Reliability, governance, and compliance before growth",
          "Clear service boundaries and ownership",
          "Auditability across data and model usage paths",
        ],
        guardrails: [
          "No launch without security review and incident runbook",
          "Define and enforce retention/classification policy",
          "Track SLO and compliance drift from day one",
        ],
      };
    default:
      return {
        modeLabel: "Scalable Startup",
        priorities: [
          "Balance velocity with architecture discipline",
          "Design for near-term growth and controllable complexity",
          "Build observability and cost controls alongside features",
        ],
        guardrails: [
          "Avoid one-way vendor lock-in for critical paths",
          "Define upgrade paths before scale pressure",
          "Use weekly risk and unit-economics reviews",
        ],
      };
  }
}

export function extractFlags(normalized: string): SignalFlags {
  const hasDifferentiationSignals =
    normalized.includes("niche") ||
    normalized.includes("unique") ||
    normalized.includes("community") ||
    normalized.includes("vertical") ||
    normalized.includes("differentiation") ||
    normalized.includes("workflow");

  return {
    hasAI: hasAny(normalized, MODEL_INTEGRATION_KEYWORDS),
    hasRealtime: hasAny(normalized, REALTIME_KEYWORDS),
    isB2B: hasAny(normalized, B2B_KEYWORDS),
    isMobileHeavy: hasAny(normalized, MOBILE_KEYWORDS),
    hasCompliance: hasAny(normalized, COMPLIANCE_KEYWORDS),
    hasDifferentiationSignals,
  };
}

export function createSkillRuntimeContext(params: {
  prd: string;
  mode: PlanningMode;
  domain?: ProjectDomain;
  honestyMode: "standard" | "brutal";
}): SkillRuntimeContext {
  const normalized = normalize(params.prd);
  const modeGuide = buildModeGuide(params.mode);
  const domain = params.domain ?? inferDomain(normalized);
  const domainGuide = buildDomainGuide(domain);

  return {
    prd: params.prd,
    normalized,
    mode: params.mode,
    domain,
    honestyMode: params.honestyMode,
    productName: deriveProductName(params.prd),
    flags: extractFlags(normalized),
    modeGuide,
    domainGuide,
  };
}
