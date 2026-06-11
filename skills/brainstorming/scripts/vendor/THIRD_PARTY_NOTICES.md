# Third-Party Notices

## Alpine.js

- Package: `alpinejs`
- Version: `3.15.12`
- Source: `https://registry.npmjs.org/alpinejs/-/alpinejs-3.15.12.tgz`
- Vendored file: `package/dist/cdn.min.js`
- Local path: `skills/brainstorming/scripts/vendor/alpine.js`
- SHA256: `57b37d7cae9a27d965fdae4adcc844245dfdc407e655aee85dcfff3a08036a3f`

Refresh command:

```bash
cd "$(git rev-parse --show-toplevel)"
tmpdir="$(mktemp -d)"
curl -fsSL https://registry.npmjs.org/alpinejs/-/alpinejs-3.15.12.tgz -o "$tmpdir/alpinejs-3.15.12.tgz"
tar -xzf "$tmpdir/alpinejs-3.15.12.tgz" -C "$tmpdir" package/dist/cdn.min.js
cp "$tmpdir/package/dist/cdn.min.js" skills/brainstorming/scripts/vendor/alpine.js
shasum -a 256 skills/brainstorming/scripts/vendor/alpine.js
rm -rf "$tmpdir"
```

License:

```text
MIT License

Copyright © 2019-2025 Caleb Porzio and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
