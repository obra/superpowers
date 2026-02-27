declare module 'virtual:executor-schemas' {
  import type { RJSFSchema } from '@rjsf/utils';
  import type { BaseCodingAgent } from '@/shared/types';

  const schemas: Record<BaseCodingAgent, RJSFSchema>;
  export { schemas };
  export default schemas;
}
