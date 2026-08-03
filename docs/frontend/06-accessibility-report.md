# Accessibility report

Signal Foundry uses semantic headers, navigation, main content, labelled forms, explicit button text, visible focus, status text in addition to color, and a skip link. Upload supports both drag-and-drop and a standard labelled file input. Machine choices use keyboard-focusable listbox options; sensor toggles expose `aria-pressed`. Validation errors use an inline alert and prediction completion uses a focusable `aria-live` region. RULHorizon and MachineSignalChart provide complete textual summaries.

The system-status drawer traps Tab navigation, closes with Escape, and focuses its close control on open. Reduced-motion CSS collapses all animation duration and disables repeated effects. Automated component and browser journeys cover the core keyboard-accessible controls. WCAG AA contrast was reviewed against the locked token palette; important text uses primary/secondary colors rather than the tertiary token.

Known limitation: chart values are summarized rather than exposed as a full screen-reader data table; exact hovered values remain pointer-oriented while sensor selection is keyboard accessible.
