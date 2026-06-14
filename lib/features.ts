/**
 * Feature flags for the gym-facing experience.
 *
 * Muay Thai Pai (the Wisarut gym) runs as a single gym. The OckOck *network*
 * features — the cross-gym fighter registry (/ockock/fighters) and the
 * promoter / bout-invitation system surfaced in the trainer dashboard — are
 * OFF by default so they don't clutter or get confused with the gym's own
 * "Our Fighters" showcase at /fighters. The gym's team is showcased there;
 * this flag only governs the cross-gym network plumbing.
 *
 * Reversible with no code change: set
 *
 *   NEXT_PUBLIC_ENABLE_NETWORK_FEATURES=true
 *
 * in the environment to bring the network features back.
 */
export const NETWORK_FEATURES_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_NETWORK_FEATURES === "true"
