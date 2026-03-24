use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostPlatform {
    Posix,
    Windows,
}

pub fn render_path_for_host(path: &Path, host: HostPlatform) -> String {
    let rendered = path.display().to_string();
    match host {
        HostPlatform::Posix => rendered.replace('\\', "/"),
        HostPlatform::Windows => rendered.replace('/', "\\"),
    }
}
