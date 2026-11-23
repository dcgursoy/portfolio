# Deniz Gursoy: portfolio site

This repository is what Vercel deploys. It is a small Next.js 14 project with two parts:

- `public/` holds the site itself: plain HTML, CSS, JavaScript and media. The front page is
  `public/index.html`, served at `/`. Every other file is served at its own path, for example
  `/list.html` and `/projects/can-ecu-sim.html`.
- `app/api/ask/route.ts` is the "Ask me anything" assistant the pages call at `POST /api/ask`.
  Its logic is in `lib/ask/`.

## Generated files: do not edit

`public/` and `lib/ask/generated.ts` are written by an export script. The script, the page
templates and the project data are kept with the site's source, outside this repository. A change
made by hand to either one is overwritten by the next export.

To change the site, edit the source and run the export from the source folder:

    python tools/export_site.py --target <path to this repository>

The script builds and checks the site, empties `public/`, copies the public files into it, and
writes `lib/ask/generated.ts`. It stops if any file it would publish contains an API key or a
private note.

The other files in `lib/ask/` are written by hand. They are a TypeScript port of the assistant in
the source's local Python server, and `lib/ask/ported-from.json` records which version of that
server they were ported from. The export script prints a warning when the server has changed since.

## Run it locally

    npm install
    npm run dev

Then open http://localhost:3000. `npm run build` followed by `npm start` runs the production build.

## The assistant

The assistant answers questions about the site with Google's Gemini API. The API key is read from
the `GEMINI_API_KEY` environment variable, which is set in the Vercel project settings and is never
stored in a file in this repository.

Without the variable the assistant still answers: it looks the question up in the site's own text
and says that the live assistant is unavailable.

To try the live assistant locally, start the server with the variable set for that one command.
Do not put the key in a file that could be committed.

Two more variables are optional:

- `GEMINI_MODELS`: the models to try, in order, as a comma-separated list such as
  `gemini-3.5-flash-lite,gemini-3.1-flash-lite`.
- `ASK_LOG_QUESTIONS=1`: also write each question to the server log. Off by default.

The assistant limits each visitor to 8 questions a minute and 60 a day. The counts are kept in
memory, so on Vercel each running instance counts for itself. A visitor is told apart by the first address in
the `X-Forwarded-For` header, which Vercel sets itself; on another host that rule would need changing.
