# Modular architecture

## Modules

In this codebase, **modules** refer to organizational units of code—not necessarily ES modules in the strict JavaScript sense, though they are technically ES modules and consist of ES modules due to their entry point files (see below for details).

The primary goal of this modular architecture is to achieve **loosely-coupled code** by controlling imports and exports more strictly:

- **Far "cross-imports" are forbidden**: Importing deeply nested code from another deeply nested location is not allowed. For example, code in `src/some/deeply/nested/feature-a/something.ts` should not directly import from `src/another/feature-b/somewhere/else/SomethingElse.ts`.
- **Module APIs should be minimal**: Each module should expose only what is necessary through its entry points. A minimal public API makes future changes easier, as internal refactoring doesn't affect external consumers.

This architecture encourages thinking carefully about what to expose and what to keep internal, leading to a more maintainable codebase as it grows.

## Package by feature

This codebase follows a **package-by-feature** approach rather than package-by-layer.

Code should be organized primarily by **feature** at the top level, with "layer" separation appearing only at the lowest levels when necessary (e.g., differentiating between a service and a repository within a feature).

In this context, a "feature" can be:

- **Business-oriented**: `book`, `reader`, `profile`
- **Technical**: `db`, `trpc`, `ui`, `utilities`

Both types of features are equally valid organizational units; what matters is that they represent cohesive, related functionality.

### Keep cohesive code together

While technical separation (service/repository/model) is acceptable at lower levels, it's often best to **keep cohesive functionality in a single file** rather than splitting it across multiple files by technical role. Split only when there's a clear benefit to separation, not as a default pattern.

## `import`s and `export`s

### Entry point files

Any module consists of one or more **entry point files** that define the module's API. An entry point file has a name satisfying either of the following regular expressions:

- Pattern 1: `^entry<OPTIONAL-SEGMENTS>\.tsx?$` where `<OPTIONAL-SEGMENTS>` matches `^(\.[0-9A-Za-z-]+)*$`. Examples:
  - `some-module/entry.ts`
  - `some-module/entry.core.ts`
- Pattern 2: `^entry\.\.<OPTIONAL-SEGMENTS>\.children\.tsx?$` where `<OPTIONAL-SEGMENTS>` matches `^(\.[0-9A-Za-z-]+)*$`. Examples:
  - `profile/entry..children.ts`
  - `profile/entry..avatar.children.ts`

> [!NOTE]
> When writing code, consider the **lack of an `export`** as the **default** state rather than its presence. Note, however, that there are different types of `export`s in terms of their granularity; `export`s in module APIs (see below) are much more essential. Because of this, `export`s in "regular" files are probably more prevalent.

Also:

> [!TIP]
> If the number of entry files is getting out of control and cannot really be reduced, that might be a sign that there's too much module splitting. Consider merging submodules with their parent or with each other—chances are they constitute one cohesive unit of code.

### Why `entry` instead of `index`

The word `entry` is used instead of `index` for several important reasons:

1. **Explicit imports**: Using `index` files allows imports without explicitly mentioning the filename (e.g., `import { foo } from '@/module'`). By using `entry`, imports must explicitly include the word `entry` in the import statement (e.g., `import { foo } from '@/module/entry'`), making the module structure more visible and intentional.
2. **Linting and architecture enforcement**: Explicit entry point references make it easier to lint and test the codebase for compliance with established architectural conventions.

**Example:**

```typescript
// Correct - explicit entry point reference
import { someIdentifier } from '@/some-module/entry'
import { ClientComponent } from '@/ui/entry.cs'
import { serverAction } from '@/actions/entry.so'

// Incorrect - implicit index imports not allowed
import { someIdentifier } from '@/some-module'
```

> [!NOTE]
> As of the time of writing, automated checks for these conventions are not implemented. One way to achieve this in the future would be through ESLint plugins. TODO: Edit this section once the checks are ready.

### Multiple entry point files

A module can have multiple entry point files for grouping purposes. These files will appear alphabetically sorted next to each other in file listings, making it easy to locate all entry points for a module at a glance.

Grouping serves three main purposes:

#### 1. Environment-specific separation

Entry points can be segmented based on execution environment, which is a technical necessity in frameworks like Next.js:

- **Isomorphic code** (default): `entry.ts` - Code that can run in both client and server environments.
- **Client-specific code**: `entry.cs.ts` - Code that must be separated for Next.js due to using mechanisms unavailable in server components (e.g., `useState`, browser APIs). Such code typically requires the `use client` directive.
- **Server-only code**: `entry.so.ts` - Code that runs exclusively on the server (e.g., server actions, Node.js-specific APIs, database queries).

This separation is required by Next.js for proper handling of server and client components.

#### 2. Bundle size optimization

For modules that export many items (such as icon libraries), splitting entry points helps reduce bundle sizes by allowing more granular imports. Instead of importing everything from a single entry point, consumers can import only what they need from specific entry files.

#### 3. Semantic grouping and visibility control

Entry points can also be semantically grouped to organize related exports and control module visibility.

##### Standard entry points

Standard entry points follow the pattern `entry.$SEGMENT.ts` for thematic grouping of related functionality:

**Example from `src/utilities/`:**

- `entry.assertions.ts` - Utilities for writing assertive code.
- `entry.strings.ts` - String manipulation utilities.

This segmentation allows consumers to import only the specific category of utilities they need, rather than pulling in the entire module.

##### Children entry points (`entry..children.ts`)

**Children entry points** use a special double-dot notation (`entry..children.ts`) and serve a critical architectural purpose: they expose internal APIs to child modules while keeping them hidden from sibling and parent modules.

**Naming convention:**

- `entry..children.ts` - Internal APIs for child modules.
- `entry..$SEGMENT.children.ts` - Scoped internal APIs (e.g., `entry..canvas.children.ts`, `entry..preferences.children.ts`).

**Why double dots (`..`)?**

The double dots are used immediately after `entry` to ensure better alphabetical sorting—children entry points sort earlier than other segmented entry files, making them easy to locate together.

**Access control pattern:**

**General rule:** All import paths can only traverse exactly **one directory segment** (except sibling file imports).

- `import` paths starting with `@/some-top-level-module/` must satisfy the pattern `@/some-top-level-module/entry.<OPTIONAL-SEGMENTS>.ts[x]`. Importing from top-level modules is permitted **everywhere**, but must use explicit entry points.
- `import` paths starting with `..` can only reference `entry..<OPTIONAL-SEGMENTS>.children.ts[x]` files (internal APIs for children).
- `import` paths starting with `./some-directory/` can only reference `entry.<OPTIONAL-SEGMENTS>.ts[x]` files.
- `import` paths starting with `./` that import from a sibling file (no directory segment) can reference any file, as these are imports within a module at the same nesting level.

> [!NOTE]
> The rule about top-level module imports is subject to change (a more strict mechanism might be needed).
