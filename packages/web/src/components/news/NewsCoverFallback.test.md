# NewsCoverFallback Component Tests

## Test Cases

### 1. Component renders "MM" text
- **Test:** Component displays "MM" in the center
- **Verification:** Visual inspection in browser or Playwright E2E test
- **Expected:** "MM" text visible with proper font styling

### 2. Theme-aware styling (dark mode)
- **Test:** Component uses dark theme colors in dark mode
- **Classes:** bg-neutral-800, text-neutral-400, border-neutral-700/50
- **Verification:** Browser DevTools or Playwright screenshot comparison
- **Expected:** Dark background with light gray text

### 3. Theme-aware styling (light mode)
- **Test:** Component uses light theme colors in light mode
- **Classes:** [.light_&]:bg-neutral-200, [.light_&]:text-neutral-600, [.light_&]:border-neutral-300
- **Verification:** Browser DevTools with light theme enabled
- **Expected:** Light background with dark gray text

### 4. Aspect ratio maintenance (16:9)
- **Test:** Component maintains 16:9 aspect ratio
- **Class:** aspect-video
- **Verification:** Measure element dimensions in browser
- **Expected:** width / height ratio ≈ 1.778 (16/9)

### 5. Border styling
- **Test:** Component has subtle border matching card styling
- **Classes:** border border-neutral-700/50
- **Verification:** Visual inspection
- **Expected:** Visible border with neutral color

### 6. Accessibility attributes
- **Test:** Component has proper ARIA role and label
- **Attributes:** role="img", aria-label="Default cover image"
- **Verification:** Check DOM attributes in DevTools
- **Expected:** Accessible for screen readers

## Manual Testing Checklist

- [ ] Renders correctly in dark theme
- [ ] Renders correctly in light theme
- [ ] Maintains 16:9 aspect ratio
- [ ] "MM" text is centered
- [ ] Border is visible and styled correctly
- [ ] Font styling (font-heading, font-bold, text-4xl) applied
- [ ] Accessible with screen readers
- [ ] Responsive on mobile, tablet, desktop

## Automated Testing

These test cases will be fully automated in Task Group 6 using Playwright E2E tests.
