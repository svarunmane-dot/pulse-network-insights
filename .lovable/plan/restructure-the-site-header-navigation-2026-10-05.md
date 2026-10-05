# Restructure the site header navigation

## Changes
- Keep the Pulse Speed logo and one direct **Speed Test** link in the header.
- Replace the remaining desktop links with **Test**, **Tools**, **Plan**, and **Learn** dropdowns containing the requested destinations and one-line descriptions.
- Replace the mobile link grid with a hamburger menu that shows Speed Test first, followed by the same four groups as collapsible sections.
- Remove About, Contact, emoji labels, and the standalone bookmark star from the header while leaving footer navigation unchanged.
- Adjust the header breakpoint and spacing so desktop navigation stays on one row from 1024px upward.

## Verification
- Check the header at desktop and mobile widths, including opening dropdowns and mobile sections.
- Confirm every destination remains reachable and inspect the latest preview build result.

## Technical details
- Keep navigation data centralized in the root layout so desktop and mobile menus cannot drift apart.
- Use the existing site tokens, link routing, button control, and icon library.
