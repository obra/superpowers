use std::path::PathBuf;

pub fn compiled_superpowers_path() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_superpowers"))
}
