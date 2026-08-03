# Contributing

Contributions are welcome through focused issues and pull requests.

## Development

Use Node.js 22 or a current LTS release.

```sh
npm ci
npm run check
npm run build
```

Install the generated `main.js`, `manifest.json`, and `styles.css` in a test Vault. Complete relevant items in `TESTING-CHECKLIST.md` before opening a pull request.

## Expectations

- Keep conversion local and preserve the project's privacy guarantees.
- Do not introduce external executables, subprocesses, remote conversion APIs, telemetry, or tracking.
- Add synthetic tests for behavior changes. Never commit private source documents.
- Keep RTL correction conservative and preserve logical Unicode.
- Update `THIRD_PARTY_NOTICES.md` for bundled dependencies or data.
- Discuss large new formats or dependencies in an issue first.

By contributing, you agree that your contribution is licensed under the MIT License.
