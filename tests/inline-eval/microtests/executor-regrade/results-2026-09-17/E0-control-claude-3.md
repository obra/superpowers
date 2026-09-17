## Fix pass

- **Important** — `wordstat/cli.py:27`: no executable entry point; `python3 -m wordstat.cli <path>` exits 0 printing nothing because nothing calls `main`. The design bills this as a CLI, so the advertised deliverable is unreachable as shipped; add `if __name__ == "__main__": sys.exit(main(sys.argv[1:]))` plus a subprocess test.

## Deferred minors

- `Final: minor (deferred): CRLF input undercounts chars — universal-newline translation in open() makes "a\r\nb\r\n" report 4 chars; spec defines count_chars over text and never specifies the CLI's newline mode, so this is unspecified behavior on Python's default idiom (downgraded from the reviewer's Important).`
- `Final: minor (deferred): invalid UTF-8 raises UnicodeDecodeError past the OSError handler instead of returning 1; spec only specifies missing-file failure, so encoding-error behavior is out of contract.`
