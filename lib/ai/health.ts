/**
 * Provider Health Tracker
 *
 * Tracks the health of AI providers (LLM + search) and temporarily
 * deprioritizes degraded providers so the system auto-routes to
 * healthy alternatives.
 */

type ProviderType = "llm" | "search";

interface ProviderHealth {
  /** Whether the provider is currently considered healthy */
  healthy: boolean;
  /** Reason for degradation (if unhealthy) */
  reason: string;
  /** Timestamp when degraded (ms since epoch) */
  degradedAt: number;
  /** Grace period before retrying (ms) — default 5 min */
  cooldownMs: number;
}

const healthMap = new Map<string, ProviderHealth>();

/** Error patterns that indicate the provider is exhausted / unavailable */
const DEGRADATION_PATTERNS: Array<{
  pattern: RegExp | ((status: number, body: string) => boolean);
  reason: string;
}> = [
  {
    pattern: (status) => status === 402,
    reason: "Insufficient balance (402)",
  },
  {
    pattern: (status) => status === 429,
    reason: "Rate limited (429)",
  },
  {
    pattern: (status) => status === 403,
    reason: "Authorization denied (403)",
  },
  {
    pattern: (status) => status === 401,
    reason: "Invalid API key (401)",
  },
  {
    pattern: (_, body) => /insufficient.*balance|billing|quota.*exceeded|usage.*limit/i.test(body),
    reason: "Billing / quota exceeded",
  },
  {
    pattern: (_, body) => /rate.?limit|too many requests/i.test(body),
    reason: "Rate limited",
  },
];

/**
 * Check if an error response indicates the provider should be degraded.
 */
export function shouldDegradeProvider(
  status: number | undefined,
  body: string | undefined
): { degrade: boolean; reason: string } {
  if (!status && !body) return { degrade: false, reason: "" };

  for (const { pattern, reason } of DEGRADATION_PATTERNS) {
    if (typeof pattern === "function") {
      if (pattern(status ?? 0, body ?? "")) {
        return { degrade: true, reason };
      }
    } else if (pattern.test(body ?? "")) {
      return { degrade: true, reason };
    }
  }

  return { degrade: false, reason: "" };
}

/**
 * Mark a provider as degraded (temporarily skipped).
 * @param providerName - Unique provider name (e.g., "deepseek", "groq")
 * @param reason - Human-readable degradation reason
 * @param cooldownMs - How long to wait before retrying (default 5 min)
 */
export function degradeProvider(
  providerName: string,
  reason: string,
  cooldownMs: number = 5 * 60 * 1000
): void {
  const existing = healthMap.get(providerName);
  // If already degraded, don't reset the timer
  if (existing && !existing.healthy) return;

  healthMap.set(providerName, {
    healthy: false,
    reason,
    degradedAt: Date.now(),
    cooldownMs,
  });

  console.warn(
    `[Health] Provider "${providerName}" degraded: ${reason}. Cooldown: ${cooldownMs / 1000}s`
  );
}

/**
 * Restore a provider to healthy status.
 */
export function restoreProvider(providerName: string): void {
  const existing = healthMap.get(providerName);
  if (existing && !existing.healthy) {
    console.log(`[Health] Provider "${providerName}" restored.`);
  }
  healthMap.set(providerName, {
    healthy: true,
    reason: "",
    degradedAt: 0,
    cooldownMs: 0,
  });
}

/**
 * Check if a provider is currently healthy.
 * Automatically restores providers whose cooldown has expired.
 */
export function isProviderHealthy(providerName: string): boolean {
  const health = healthMap.get(providerName);
  if (!health) return true; // Never tracked = healthy by default

  if (!health.healthy) {
    // Check if cooldown has expired
    if (Date.now() - health.degradedAt > health.cooldownMs) {
      restoreProvider(providerName);
      return true;
    }
    return false;
  }

  return true;
}

/**
 * Get all currently degraded providers and their reasons.
 */
export function getDegradedProviders(): Array<{
  name: string;
  reason: string;
  remainingCooldownMs: number;
}> {
  const result: Array<{
    name: string;
    reason: string;
    remainingCooldownMs: number;
  }> = [];

  healthMap.forEach((health, name) => {
    if (!health.healthy) {
      const remaining = health.degradedAt + health.cooldownMs - Date.now();
      if (remaining > 0) {
        result.push({
          name,
          reason: health.reason,
          remainingCooldownMs: remaining,
        });
      }
    }
  });

  return result;
}

/**
 * Reset all health state (useful for testing).
 */
export function resetAllHealth(): void {
  healthMap.clear();
}