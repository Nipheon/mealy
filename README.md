# mealy

A meal suggestion web app. It picks meals from a list you maintain and builds a
14-day meal plan, printable from the browser.

## How it works

- The meal list is `public/meals.csv`. Required column: `name`. Optional columns:
  `calories`, `ingredients`.
- A plan needs at least 18 meals: 1 meal on each weekday, 2 on Saturday and
  Sunday, for two weeks.
- Meals in a plan are all different. Picks are random.
- Used meals are remembered in the browser (`localStorage`) and rest until every
  meal in the list has been used once. Then the rotation starts over.
  "Reset History" clears it.

Everything runs in the browser. No data leaves your device.

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000. Build with `npm run build`, type-check with
`npm run lint`.

Live: https://mealy-two.vercel.app

## AI disclosure

The first version of this app was generated in Google AI Studio (Google Gemini).
Later changes were made with AI assistance. The author reviews the results and
directs the project.
