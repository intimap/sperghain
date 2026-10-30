# Working agreement

- Develop and test every feature on a branch. Do not merge into main or deploy production without the user's explicit approval.
- Preview-link workflow: develop/test on feature branches, open a PR and send its Netlify Deploy Preview URL for user testing. Merge approved changes into main. Local Node.js setup is optional.
- Netlify builds are active for previews. Automatic production publishing is locked, and scripts/netlify-ignore.mjs skips routine production builds. Merging is not permission to publish. Only publish or unlock production on an explicit user publishing request. Keep the existing live version until then.
- Keep hand-written source files below 500 lines; aim for 100–300. Split by responsibility, not arbitrary line counts.
- Keep each module in its own folder. Module DSP depends on contracts, never on another module or UI code. Module panel files may use shared UI controls; keep them out of the DSP registry.
- Engine and processors must run without the browser UI. Platform adapters own browser APIs.
- No logging, I/O, or avoidable allocation in the audio render loop. Musical timing uses samples, not UI timers.
- Validate patches at the boundary. Maintain stable module/port/parameter IDs and version the patch schema.
- Run npm test, npm run check, and npm run build for functional changes. Exercise affected browser interactions when available.
- Preserve an empty rack on a fresh launch. No autoplay audio or automatic demo patch.
- Document limitations honestly. MIDI, feedback, native plugins, and third-party module loading are future milestones.
