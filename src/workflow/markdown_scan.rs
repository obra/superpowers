use std::fs;
use std::path::{Path, PathBuf};

pub(crate) fn markdown_files_under(root: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    visit_markdown_files(root, &mut files);
    files
}

fn visit_markdown_files(root: &Path, files: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(root) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            visit_markdown_files(&path, files);
        } else if path.extension().and_then(std::ffi::OsStr::to_str) == Some("md") {
            files.push(path);
        }
    }
}
