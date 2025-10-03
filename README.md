# eslint-plugin-entered-modules

ESLint plugin to enforce modular architecture with explicit entry point files.

## _Entered Modules_

_Entered Modules_ is a concept used in some of our internal projects to describe special conventions on how the codebase should be separated into multiple modules and what `import`/`export` statements are permitted. For a comprehensive explanation, see the [original file](./docs/copied/modular-architecture.md) copied from one of the internal projects.

An exemplary real snippet from the file `src/reader/Reader.tsx` (`@/reader` module)—there are no `index` files used:

```typescript
import { Box, Grid } from '@/ui/entry.core'
import { HEIGHT_IN_PIXELS as BOTTOM_BAR_HEIGHT_IN_PIXELS, ReaderBottomBar } from './ReaderBottomBar'
import { ReaderCssVariables } from './ReaderCssVariables'
import { ReaderTopBar, HEIGHT_IN_PIXELS as TOP_BAR_HEIGHT_IN_PIXELS } from './ReaderTopBar'
import { Canvas as ReaderCanvas } from './canvas/entry'
import { Preferences as ReaderPreferences, useViewStore } from './preferences/entry'
import { useWakeLock } from './wake-lock.hook'
```

> [!NOTE]
> This is used together with `@trivago/prettier-plugin-sort-imports` for better development experience.

## Installation

```bash
npm install --save-dev eslint-plugin-entered-modules
```

## Usage

### ESLint Flat Config (recommended)

```js
import enteredModules from 'eslint-plugin-entered-modules';

export default [
  {
    plugins: {
      'entered-modules': enteredModules,
    },
    rules: {
      'entered-modules/no-invalid-entry-imports': 'error',
    },
  },
];
```

Or use the recommended configuration:

```js
import enteredModules from 'eslint-plugin-entered-modules';

export default [
  {
    plugins: {
      'entered-modules': enteredModules,
    },
    rules: {
      ...enteredModules.configs.recommended.rules,
    },
  },
];
```

## Rules

### `no-invalid-entry-imports`

Enforces strict import rules for modular architecture with entry point files.

#### Rule Details

This rule enforces that all imports follow a modular architecture pattern where modules expose their APIs through explicit entry point files. The rule ensures:

1. **Top-level imports** (`@/module-name/...`) can only traverse exactly 1 directory segment and must reference entry files matching the pattern `entry.<OPTIONAL-SEGMENTS>.ts[x]`.
2. **Parent imports** (`../...`) can only traverse exactly 1 directory segment and must reference children entry files matching the pattern `entry..<OPTIONAL-SEGMENTS>.children.ts[x]`.
3. **Subdirectory imports** (`./subdir/...`) can only traverse exactly 1 directory segment and must reference entry files matching the pattern `entry.<OPTIONAL-SEGMENTS>.ts[x]`.
4. **Sibling imports** (`./file.ts`) can reference any file at the same nesting level.

#### Entry Point File Naming

Entry point files must follow these patterns:

- **Normal entry points**: `entry.ts`, `entry.core.ts`, `entry.cs.ts`, etc.
  - Pattern: `entry.<OPTIONAL-SEGMENTS>.ts[x]` where segments match `[0-9A-Za-z-]+`.
- **Children entry points** (internal APIs for child modules): `entry..children.ts`, `entry..utils.children.ts`, etc.
  - Pattern: `entry..<OPTIONAL-SEGMENTS>.children.ts[x]`.

#### Examples

**✅ Valid imports:**

```ts
// Top-level imports (1 directory segment, entry file)
import { foo } from '@/utils/entry';
import { bar } from '@/ui/entry.core';

// Parent imports (children entry files only)
import { baz } from '../entry..children';
import { qux } from '../entry..canvas.children';

// Subdirectory imports (1 segment, entry file)
import { component } from './components/entry';

// Sibling imports (any file)
import { helper } from './helper';
import { config } from './entry';
```

**❌ Invalid imports:**

```ts
// Top-level imports with too many directory segments
import { foo } from '@/utils/helpers/entry'; // ❌ Error: must have exactly 1 directory segment

// Top-level imports to non-entry files
import { bar } from '@/ui/Button'; // ❌ Error: must reference entry.<SEGMENTS>.ts[x] file

// Top-level imports to children entries
import { baz } from '@/utils/entry..children'; // ❌ Error: children entries are for internal use only

// Parent imports to normal entry files
import { qux } from '../entry'; // ❌ Error: must reference entry..<SEGMENTS>.children.ts[x] file

// Parent imports with too many segments
import { quux } from '../../entry..children'; // ❌ Error: can only traverse 1 directory segment

// Subdirectory imports with too many segments
import { corge } from './utils/helpers/entry'; // ❌ Error: can only traverse 1 directory segment

// Subdirectory imports to children entries
import { grault } from './utils/entry..children'; // ❌ Error: cannot reference children entries
```

## Architecture

This plugin enforces a modular architecture pattern where:

- Modules expose their APIs through explicit `entry` files (not `index` files).
- Deep imports across module boundaries are forbidden.
- Children modules can access parent internal APIs through special `entry..children` files.
- All imports can only traverse exactly 1 directory segment (except sibling file imports).

For more details on the modular architecture pattern, see the [architecture documentation](https://github.com/vidinity/eslint-plugin-entered-modules/blob/main/docs/modular-architecture.md).

## License

MIT
