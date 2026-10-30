import { definition } from '../modules/registry.js';
import { MAX_MODULES, PATCH_VERSION } from '../contracts/patch.js';
import { validateCables } from '../patching/graph.js';
export function validatePatch(value) {
  if (!value || value.version !== PATCH_VERSION) throw new Error('Unsupported patch version.');
  if (!Array.isArray(value.modules) || !Array.isArray(value.cables)) throw new Error('Invalid patch structure.');
  if (value.modules.length > MAX_MODULES || value.cables.length > MAX_MODULES * 16) throw new Error('Patch exceeds rack capacity.');
  const ids = new Set();
  const modules = value.modules.map(module => {
    if (!module || typeof module.id !== 'string' || !/^[\w-]{1,80}$/.test(module.id) || ids.has(module.id)) throw new Error('Invalid module ID.');
    ids.add(module.id);
    const spec = definition(module.type);
    if (module.version !== spec.version) throw new Error('Unsupported module version.');
    const parameters = {};
    for (const [id, param] of Object.entries(spec.parameters)) {
      const number = module.parameters?.[id];
      if (!Number.isFinite(number) || number < param.min || number > param.max) throw new Error(`Invalid ${param.label} value.`);
      parameters[id] = number;
    }
    return { id: module.id, type: spec.type, version: spec.version, parameters };
  });
  const patch = { version: PATCH_VERSION, modules, cables: value.cables.map(cable => ({
    id: cable?.id, from: { module: cable?.from?.module, port: cable?.from?.port }, to: { module: cable?.to?.module, port: cable?.to?.port }
  })) };
  validateCables(patch);
  return patch;
}
