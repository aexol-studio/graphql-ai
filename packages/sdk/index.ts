import { crossApiFetch } from './crossApiFetch.js';
import { fetchOptions, Thunder } from './zeus';

export const SDK = (...fetchOptions: fetchOptions) => Thunder(crossApiFetch(fetchOptions));
