import { createElement, FunctionComponentElement, SVGProps } from 'react';
import {
  TypeScript,
  JavaScript,
  Python,
  RustDark,
  RustLight,
  Go,
  Java,
  C,
  CPlusPlus,
  CSharp,
  Swift,
  Kotlin,
  Dart,
  Ruby,
  PHP,
  Lua,
  R,
  Scala,
  Elixir,
  HTML5,
  CSS3,
  Sass,
  JSON,
  Bash,
  PowerShell,
  React,
  VueJs,
  SvelteJS,
  Angular,
  Docker,
  PostgreSQL,
  GraphQL,
} from 'developer-icons';
import { FileIcon, FileMd, FileCss } from '@phosphor-icons/react';

// Match the DeveloperIconProps from developer-icons
interface DeveloperIconProps extends Partial<SVGProps<SVGElement>> {
  size?: number;
}

type DeveloperIcon = (
  props: DeveloperIconProps
) => FunctionComponentElement<DeveloperIconProps>;

type IconMapping = {
  light: DeveloperIcon;
  dark: DeveloperIcon;
};

function icon(component: DeveloperIcon): IconMapping {
  return { light: component, dark: component };
}

function iconWithVariants(
  lightIcon: DeveloperIcon,
  darkIcon: DeveloperIcon
): IconMapping {
  return { light: lightIcon, dark: darkIcon };
}

// Wrapper for FileMd from phosphor
const FileMdWrapper: DeveloperIcon = ({ size, ...props }) => {
  return createElement(FileMd, {
    size,
    ...(props as object),
  }) as unknown as FunctionComponentElement<DeveloperIconProps>;
};

// Wrapper for FileCss from phosphor
const FileCssWrapper: DeveloperIcon = ({ size, ...props }) => {
  return createElement(FileCss, {
    size,
    ...(props as object),
  }) as unknown as FunctionComponentElement<DeveloperIconProps>;
};

const extToIcon: Record<string, IconMapping> = {
  // TypeScript/JavaScript
  ts: icon(TypeScript),
  tsx: icon(TypeScript),
  js: icon(JavaScript),
  mjs: icon(JavaScript),
  cjs: icon(JavaScript),
  jsx: icon(React),

  // Web
  html: icon(HTML5),
  htm: icon(HTML5),
  css: icon(FileCssWrapper),
  scss: icon(Sass),
  sass: icon(Sass),
  less: icon(CSS3),

  // Frameworks
  vue: icon(VueJs),
  svelte: icon(SvelteJS),

  // Languages
  py: icon(Python),
  rs: iconWithVariants(RustDark, RustLight),
  go: icon(Go),
  java: icon(Java),
  c: icon(C),
  h: icon(C),
  cpp: icon(CPlusPlus),
  cc: icon(CPlusPlus),
  cxx: icon(CPlusPlus),
  hpp: icon(CPlusPlus),
  cs: icon(CSharp),
  swift: icon(Swift),
  kt: icon(Kotlin),
  dart: icon(Dart),
  rb: icon(Ruby),
  php: icon(PHP),
  lua: icon(Lua),
  r: icon(R),
  scala: icon(Scala),
  ex: icon(Elixir),
  exs: icon(Elixir),

  // Data/Config
  json: icon(JSON),
  md: icon(FileMdWrapper),
  // No YAML icon in developer-icons, use JSON as fallback
  yaml: icon(JSON),
  yml: icon(JSON),

  // Shell
  sh: icon(Bash),
  bash: icon(Bash),
  zsh: icon(Bash),
  ps1: icon(PowerShell),

  // Databases
  sql: icon(PostgreSQL),
  psql: icon(PostgreSQL),

  // Special files
  graphql: icon(GraphQL),
  gql: icon(GraphQL),
};

// Special filename mappings (for files without extensions)
const filenameToIcon: Record<string, IconMapping> = {
  dockerfile: icon(Docker),
  'docker-compose.yml': icon(Docker),
  'docker-compose.yaml': icon(Docker),
  '.angular.json': icon(Angular),
};

// Wrapper component to adapt phosphor FileIcon to same interface
const FileIconWrapper: DeveloperIcon = ({ size, ...props }) => {
  return createElement(FileIcon, {
    size,
    ...(props as object),
  }) as unknown as FunctionComponentElement<DeveloperIconProps>;
};

export function getFileIcon(
  filename: string,
  theme: 'light' | 'dark'
): DeveloperIcon {
  const lowerFilename = filename.toLowerCase();

  // Check special filenames first
  const basename = lowerFilename.split('/').pop() || '';
  const filenameMapping = filenameToIcon[basename];
  if (filenameMapping) {
    return filenameMapping[theme];
  }

  // Then check extension
  const ext = basename.split('.').pop() || '';
  const extMapping = extToIcon[ext];
  if (extMapping) {
    return extMapping[theme];
  }

  return FileIconWrapper;
}
