# Finlead Health Journey

- Live demo: https://finlead-health-demo.vercel.app
- Source repository: https://github.com/jindalchirag/finlead-health-demo
- Invite developers: https://github.com/jindalchirag/finlead-health-demo/settings/access

A standalone, hardcoded competition demo based on **Finlead_Autonomous_Health_Journey.pptx**. The project is independent of the existing Finlead applications.

## Run locally

Requires Node.js 20.19+ or 22.12+ (tested with Node 24).

```sh
npm install
npm run dev
```

Open the local address shown in the terminal. The default development address is http://127.0.0.1:5173.

```sh
npm test          # 17 workflow and issuance-gate checks
npm run build    # Production files in dist/
npm run preview  # Preview the production build
```

Fonts, icons and sample records are bundled locally. The app requires no API keys, login, backend or runtime internet connection. Browser storage remembers the current case. Use **Demo scenarios** to start over.

## What is included

- Responsive customer workspace with eight stages: profile, records, recommendation, proposal, evidence, underwriting, final acceptance and issuance.
- Separate optional consent for AA banking, AA policies, Care history and ABDM records.
- Side-by-side comparison of declarations and AA-informed recommendations.
- Three fictional plans and an editable budget, with affordability and medical evidence kept separate.
- Post-submission evidence reuse, missing-report collection and wrong-member record review.
- Approval, revised terms, human referral, postponement, decline and withdrawal branches.
- An issuance gate requiring complete evidence, insurer approval, explicit customer acceptance and reconciled payment.
- Payment-preserving issuance retry, with a single simulated charge.
- Evidence register, operations view, source trail, case export and a clearly marked demo certificate.
- Presenter mode and six scenario presets.

## Three-minute walkthrough

1. **0:00–0:35 — Meet the family.** Open **Demo guide → Start a fresh walkthrough**. Aarav and Meera have a child, Anaya, a ₹3,000 monthly budget and declared employer cover of ₹5 lakh. Confirm the sample declarations and continue.
2. **0:35–1:20 — Show the AA difference.** Connect the suggested sample records and grant the listed permissions. AA policy facts show that the child is not covered by the employer floater. Confirm the facts. Compare the declared ₹10 lakh option with the AA-informed ₹20 lakh recommendation, at an illustrative ₹2,600 monthly equivalent.
3. **1:20–2:10 — Submit and reuse.** Continue with Family Plus, confirm the sample proposal and submit. Check evidence. The matched sample ABDM record can be reused. Continue and run the sample insurer decision.
4. **2:10–3:00 — Show control.** Review final terms, explicitly accept, simulate payment and issue. Open Operations to show the audit trail and gates. Download the demo certificate or case export.

For a quick resilience demonstration, start **Issuance interrupted**: the first issuance fails, the payment stays reconciled, and retry succeeds without another charge. **No connected records** demonstrates the declaration fallback and one targeted report request after submission.

## Scenario presets

| Scenario | Demonstration |
| --- | --- |
| Connected family | AA changes the cover recommendation; existing evidence is reused |
| One report missing | Request only a missing health report after submission |
| No connected records | Continue using declarations and collect required evidence later |
| Revised insurer terms | A fictional 10% premium revision needs explicit acceptance |
| Record conflict | Isolate a mismatched record and require a reviewer |
| Issuance interrupted | Preserve the payment reference and retry issuance safely |

Individual sources can also be declined, expired, unavailable or revoked before submission. In underwriting, select the additional referral, postponement or decline branches.

## What is simulated

**No live AA, ABDM, Care, banking, insurance, KYC, payment, diagnostic or policy-issuance integrations are connected.** All identities, records, products, benefits, premiums, waiting periods, medical requirements and decisions are fictional. No actual insurance coverage or financial transaction is created. No pilot performance, real testimonials or insurer approval is claimed.

AA is represented as a consent-based sharing route, not a universal database. Banking data affects budget fit only. Clinical records have a separate consent. The recommendation is intentionally deterministic: policy data corrects the member assumption, and budget checks select an affordable sample plan where one exists.

This prototype locks source changes once a proposal is submitted. Reset the demo to show a different consent configuration. Production revocation handling, retention enforcement, security, verified identity, approved insurer rules, actual quote interfaces, full policy wording and real integrations remain future work. Portability, migration and renewal are outside this demo.

## Implementation

React 19, Vite 6, Lucide icons and bundled DM Sans / Manrope fonts. `src/domain.js` contains fixtures and guarded workflow transitions. `src/App.jsx` contains screens and interactions. `src/styles.css` contains responsive presentation styles. State is stored only under `finlead-health-competition-v1` in browser localStorage.

Production hosting: run `npm run build` and serve the `dist` directory through any static HTTP host. No server secrets are required. The Vite server binds to localhost by default.

## Collaboration

The source repository is private. The owner can invite developers from **Settings → Collaborators → Add people**. Share the live demo link for viewing without repository access.

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, the branch and pull-request workflow, and the source map. GitHub Actions checks tests and the production build. `vercel.json` declares the Vite build settings.

## Deployment account

Vercel project: `personal-7454/finlead-health-demo`. The live production site is deployed and public. To deploy manually from this folder after Vercel sign-in, run `npx vercel --prod`. The Vercel GitHub App is connected to this repository. Eligible pushes to `main` trigger production deployments to the live demo URL. Collaborators should open pull requests; Vercel preview and contributor deployment permissions depend on the account plan and project settings.
