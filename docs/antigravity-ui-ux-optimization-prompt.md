# Antigravity Prompt: DHRUVAA UI/UX Refinement

You are refining the existing DHRUVAA frontend in `frontend/`. Improve the UI and UX so the interface feels less clustered, easier to scan, and more deliberately organized while preserving the current overall layout, visual identity, and every existing behavior.

## Non-negotiable constraints

- Do not change the overall application layout, page hierarchy, routes, navigation model, sidebar width, header height, or primary dashboard composition.
- Do not change functionality. Preserve all existing state transitions, event handlers, form behavior, modals, filters, sorting, charts, telemetry updates, live stream controls, authentication behavior, API calls, WebSocket behavior, and URL/query behavior.
- Do not rename, remove, or change the meaning of user-facing controls, navigation items, status labels, metrics, alerts, or data fields.
- Do not change backend code, schemas, configuration, data contracts, mock data, services, or dependencies.
- Do not replace the existing component architecture with a new design system or rewrite working components unnecessarily.
- Do not introduce a new theme, light mode, marketing layout, oversized hero area, card-within-card composition, or decorative illustrations.
- Keep the existing dark aerospace command-console / tactical HUD visual language, including its cyan, amber, red, and green status semantics.
- Keep desktop and mobile responsive behavior intact. Do not hide important content or controls to make spacing appear better.
- Prefer existing Tailwind utilities, CSS tokens, Lucide icons, and established component patterns already present in the project.

## Desired improvements

Make the interface calmer and easier to scan without making it sparse or changing its information architecture:

- Establish clearer visual grouping inside existing panels using consistent padding, section gaps, alignment, and divider treatment.
- Reduce accidental crowding between headings, labels, values, charts, controls, and status indicators.
- Improve hierarchy with restrained differences in text size, weight, contrast, casing, and tracking. Keep telemetry and technical metadata monospace.
- Align related controls and values to a consistent grid. Prevent labels, badges, buttons, and numeric values from colliding or wrapping awkwardly.
- Normalize repeated panel, table, metric, tab, button, badge, and empty/loading state treatments where the current code already uses the same pattern.
- Give dense dashboard areas slightly more breathing room while retaining the current amount of information and the existing layout proportions.
- Improve focus, hover, active, disabled, and selected states for clarity and keyboard usability without changing what actions do.
- Preserve the aerospace grid, restrained glow, squared HUD borders, compact controls, and existing status colors. Use glow sparingly so important signals remain prominent.
- Keep the fixed 80px sidebar and 64px command header stable. Ensure page content has reliable offsets and does not sit underneath either element.
- Check narrow desktop and mobile widths for overflow, clipped text, overlapping controls, and unusable horizontal scrolling.
- Add or improve tooltips and accessible names only where they clarify existing icon-only controls; do not add new actions.

## Working method

1. Inspect the current implementation before editing. Identify the shared shell, global styles, repeated panel patterns, and the most visibly crowded screens.
2. Make the smallest visual-only changes first, favoring shared styles or repeated component patterns over scattered one-off overrides.
3. Keep all data flow and interaction code unchanged unless a purely presentational wrapper is required. Do not alter business logic while moving or styling markup.
4. Review every changed screen at desktop and mobile widths. Confirm that existing routes and controls remain present and usable.
5. Run the frontend validation commands after the changes:

   ```text
   cd frontend
   npm run lint
   npm run build
   ```

6. Report the files changed, the visual improvements made, and any validation result. Call out anything that could not be verified instead of claiming it was verified.

## Acceptance criteria

The work is complete only when:

- The app still uses the same overall layout, theme, routes, and interaction model.
- Existing controls still perform the same actions and live data still follows the same path.
- Panels and dashboard sections have clearer spacing and hierarchy without losing information.
- No visible overlap, clipped text, accidental overflow, or broken responsive state is introduced.
- The dark DHRUVAA aerospace/HUD identity remains immediately recognizable.
- `npm run lint` and `npm run build` pass from `frontend/`, or any pre-existing failure is clearly identified in the final report.