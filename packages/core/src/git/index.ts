/**
 * Git operations module
 * @module git
 */

export * from './types';
export { Repository } from './repository';
export {
  getGlobalConfig,
  setGlobalConfig,
  getLocalConfig,
  setLocalConfig,
  unsetLocalConfig,
} from './config';
export type { GitUserConfig } from './config';
