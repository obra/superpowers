use std::path::PathBuf;

pub fn compiled_featureforge_path() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_featureforge"))
}
