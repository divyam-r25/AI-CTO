import type { ModeGuide, PlanningMode } from "@/lib/types";
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
  honestyMode: "standard" | "brutal";
}): SkillRuntimeContext {
  const normalized = normalize(params.prd);
  const modeGuide = buildModeGuide(params.mode);

  return {
    prd: params.prd,
    normalized,
    mode: params.mode,
    honestyMode: params.honestyMode,
    productName: deriveProductName(params.prd),
    flags: extractFlags(normalized),
    modeGuide,
  };
}
