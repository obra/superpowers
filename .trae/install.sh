#!/bin/bash

set -euo pipefail

MODE="global"

while [ $# -gt 0 ]; do
  case "$1" in
    --project)
      MODE="project"
      shift
      ;;
    --global)
      MODE="global"
      shift
      ;;
    *)
      echo "Usage: $0 [--global|--project]" 1>&2
      exit 2
      ;;
  esac
done

if [ "${MODE}" = "project" ]; then
  TRAE_DIR="$(pwd)/.trae"
else
  TRAE_DIR="${HOME}/.trae"
fi

SKILLS_DIR="${TRAE_DIR}/skills"
REPO_SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../skills" && pwd)"

if [ ! -d "${REPO_SKILLS_DIR}" ]; then
  echo "Error: skills directory not found at ${REPO_SKILLS_DIR}" 1>&2
  exit 1
fi

mkdir -p "${TRAE_DIR}"

if [ -L "${SKILLS_DIR}" ]; then
  rm "${SKILLS_DIR}"
fi

if [ -e "${SKILLS_DIR}" ] && [ ! -d "${SKILLS_DIR}" ]; then
  echo "Error: ${SKILLS_DIR} exists but is not a directory." 1>&2
  echo "Please remove it and try again:" 1>&2
  echo "  rm ${SKILLS_DIR}" 1>&2
  exit 1
fi

mkdir -p "${SKILLS_DIR}"

echo "Linking skills from ${REPO_SKILLS_DIR} to ${SKILLS_DIR}..."

for skill_path in "${REPO_SKILLS_DIR}"/*; do
  if [ -d "${skill_path}" ]; then
    skill_name="$(basename "${skill_path}")"
    target_path="${SKILLS_DIR}/${skill_name}"

    if [ -e "${target_path}" ] || [ -L "${target_path}" ]; then
      if [ -L "${target_path}" ]; then
        rm "${target_path}"
      else
        echo "Warning: ${target_path} exists and is not a symlink. Skipping."
        continue
      fi
    fi

    ln -s "${skill_path}" "${target_path}"
    echo "  - Linked ${skill_name}"
  fi
done

echo "Done."
