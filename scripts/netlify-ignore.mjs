// Netlify ignore commands use 0 to skip, 1 to continue building.
// Only test deployments build automatically. Production releases are explicit.
const previewContexts = new Set(['deploy-preview', 'branch-deploy']);
const buildPreview = previewContexts.has(process.env.CONTEXT);
console.log(buildPreview
  ? 'Building a preview for review.'
  : 'Skipping automatic production build. Publish only on explicit user request.');
process.exitCode = buildPreview ? 1 : 0;
