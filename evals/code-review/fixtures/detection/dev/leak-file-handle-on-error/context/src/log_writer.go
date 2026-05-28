// src/log_writer.go — appends a line to a log file.

package logwriter

import (
	"fmt"
	"os"
)

// AppendLine opens the log file and writes one line. On any error in the
// write, the function returns the error to the caller.
//
// REVIEW NOTE: there are no other callers of this function in the
// codebase; it is used by the per-request logger initialized in
// `cmd/server/main.go`.
func AppendLine(path string, line string) error {
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	if _, err := f.WriteString(line + "\n"); err != nil {
		return fmt.Errorf("write: %w", err) // BUG INTRODUCED IN PR: forgets f.Close() before returning
	}
	return f.Close()
}
