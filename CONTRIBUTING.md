# Working on Finlead together

## Get started

Once the owner invites you to the GitHub repository, accept the invitation and clone it. Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Create a branch for each change, make the change and run:

```sh
npm test
npm run build
```

Push your branch and open a pull request into `main`. Explain the visible change and how you checked it. GitHub Actions runs the workflow tests and production build on pull requests.

## Where to work

- `src/App.jsx`: customer screens, presenter guide, evidence register and operations views.
- `src/domain.js`: sample data, recommendations, workflow transitions and issuance gates.
- `src/domain.test.js`: meaningful checks for consent, evidence and guarded decisions.
- `src/styles.css`: desktop and mobile styling.
- `vercel.json`: production build settings.

## Keep the demo dependable

Use synthetic records only. Keep simulated pricing, products and insurer actions clearly labelled. Preserve the separation between budget checks and medical evidence. Changes to source assumptions must invalidate dependent recommendations. Do not request new medical evidence before submission, and do not issue until every gate is complete.

Use the six scenario presets to check the complete journey when workflow logic changes. Never commit local credentials, `.env` files or Vercel authentication data.

## Publishing

This repository is connected to Vercel project `personal-7454/finlead-health-demo`. The production branch is `main`. Eligible pushes to `main` automatically deploy to https://finlead-health-demo.vercel.app. Vercel preview availability and contributor deployment permissions depend on the connected account's plan and project settings.

The owner can invite developers from the GitHub repository's Settings → Collaborators. Accepting a GitHub invitation grants code access; a Vercel team invitation is separate and is only needed for direct access to hosting settings.
