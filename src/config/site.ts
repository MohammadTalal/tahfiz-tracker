/**
 * Site-wide settings for the public/legal pages.
 * TODO before the pilot: set contactEmail and flip legalReviewed to true once
 * the Privacy Policy and Terms have been reviewed.
 */
export const SITE = {
  /** Public contact address for privacy and support requests. Empty = not set yet. */
  contactEmail: "",
  /** False shows a "draft under review" notice on the legal pages. */
  legalReviewed: false,
  /** Last update of the Privacy Policy and Terms (YYYY-MM-DD). */
  legalUpdated: "2026-10-19",
} as const;
