export type FormTag = 'input' | 'textarea' | 'select';
export type EnableOnFormTags =
  | boolean
  | readonly (FormTag | Uppercase<FormTag>)[];
