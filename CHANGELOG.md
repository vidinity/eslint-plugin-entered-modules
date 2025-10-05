# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-10-05

### Changed

- Updated README documentation
- Fixed package-lock's stale content

## [0.1.0] - 2025-10-04

### Added

- Initial release of `eslint-plugin-entered-modules`
- `no-invalid-entry-imports` rule to enforce modular architecture with entry point files
- Support for four import patterns:
  - Top-level imports (`@/module-name/entry.ts`)
  - Parent imports (`../entry..children.ts`)
  - Subdirectory imports (`./subdir/entry.ts`)
  - Sibling imports (`./file.ts`)
- Enforces exactly 1 directory segment traversal for all imports (except sibling imports)
- Entry point file naming conventions:
  - Normal entry points: `entry.<OPTIONAL-SEGMENTS>.ts[x]`
  - Children entry points: `entry..<OPTIONAL-SEGMENTS>.children.ts[x]`
- Recommended ESLint configuration
- Comprehensive error messages for all violation types
- TypeScript support
- ESLint flat config support

[0.1.1]: https://github.com/vidinity/eslint-plugin-entered-modules/releases/tag/v0.1.1
[0.1.0]: https://github.com/vidinity/eslint-plugin-entered-modules/releases/tag/v0.1.0
