import type { Rule } from 'eslint';
import type { ImportDeclaration } from 'estree';
import path from 'path';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce modular architecture import rules for entry point files',
      recommended: true,
    },
    messages: {
      invalidParentImport: 'Imports starting with ".." can only reference entry..<OPTIONAL-SEGMENTS>.children.ts[x] files',
      invalidSubdirectoryImport: 'Imports starting with "./some-directory/" can only reference entry.<OPTIONAL-SEGMENTS>.ts[x] files (not non-entry files or children-specific entry files)',
      tooManyDirectorySegments: 'Imports can only reference files one directory level deep (found multiple directory segments)',
      invalidTopLevelImport: 'Top-level imports must follow pattern @/module-name/entry.<OPTIONAL-SEGMENTS>.ts[x]',
      invalidTopLevelImportDepth: 'Top-level imports must have exactly 1 directory segment (the module name). Use @/module-name/entry.<SEGMENTS>.ts[x] format',
      invalidTopLevelImportChildren: 'Top-level imports cannot reference entry..<OPTIONAL-SEGMENTS>.children.ts[x] files (children entries are for internal use only)',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      ImportDeclaration(node: ImportDeclaration) {
        const importPath = node.source.value as string;

        // Skip non-relative imports (external packages, etc.) except for @/ imports
        if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
          return;
        }

        // Rule 1: @/ imports must follow pattern @/some-top-level-module/entry.<OPTIONAL-SEGMENTS>.ts[x]
        // Exactly 1 directory segment is allowed (the top-level module name)
        if (importPath.startsWith('@/')) {
          // Match pattern: @/module-name/file-path
          const match = importPath.match(/^@\/([^/]+)\/(.+)$/);

          if (!match) {
            // Invalid format - missing directory or file
            context.report({
              node: node.source,
              messageId: 'invalidTopLevelImport',
            });
            return;
          }

          const [, moduleName, filePath] = match;

          // Check if there are additional directory segments (slashes in filePath)
          if (filePath.includes('/')) {
            context.report({
              node: node.source,
              messageId: 'invalidTopLevelImportDepth',
            });
            return;
          }

          // Extract filename without extension
          const fileName = filePath.replace(/\.(ts|tsx|js|jsx)$/, '');

          // Must be a normal entry file: entry.<OPTIONAL-SEGMENTS>
          // Cannot be a children entry file: entry..<OPTIONAL-SEGMENTS>.children
          const isNormalEntry = /^entry(\.[0-9A-Za-z-]+)*$/.test(fileName);
          const isChildrenEntry = /^entry\.\.(([0-9A-Za-z-]+\.)*)?children$/.test(fileName);

          if (isChildrenEntry) {
            context.report({
              node: node.source,
              messageId: 'invalidTopLevelImportChildren',
            });
            return;
          }

          if (!isNormalEntry) {
            context.report({
              node: node.source,
              messageId: 'invalidTopLevelImport',
            });
          }

          return;
        }

        // Rule 2: Imports starting with ".." can only reference entry..<OPTIONAL-SEGMENTS>.children.ts[x] files
        // and must have exactly 1 directory segment
        if (importPath.startsWith('..')) {
          // Check for exactly 1 directory segment: ../filename (not ../../filename)
          const pathSegments = importPath.split('/');
          if (pathSegments.length > 2) {
            context.report({
              node: node.source,
              messageId: 'tooManyDirectorySegments',
            });
            return;
          }

          // Extract the filename from the path
          const fileName = path.basename(importPath).replace(/\.(ts|tsx|js|jsx)$/, '');

          // Must match entry..<OPTIONAL-SEGMENTS>.children pattern
          // Pattern: entry..children or entry..<segments>.children
          const isChildrenEntry = /^entry\.\.(([0-9A-Za-z-]+\.)*)?children$/.test(fileName);

          if (!isChildrenEntry) {
            context.report({
              node: node.source,
              messageId: 'invalidParentImport',
            });
          }
          return;
        }

        // For "./" imports, we need to distinguish between:
        // - Sibling files (./file.ts) - any file is allowed
        // - Subdirectory imports (./some-directory/file.ts) - only entry.<OPTIONAL-SEGMENTS>.ts[x]

        if (importPath.startsWith('./')) {
          // Count directory segments
          const pathWithoutPrefix = importPath.slice(2); // Remove "./"
          const segments = pathWithoutPrefix.split('/');

          // If there's only one segment, it's a sibling file - allow any file
          if (segments.length === 1) {
            return;
          }

          // If there are more than 2 segments, it's too deep
          if (segments.length > 2) {
            context.report({
              node: node.source,
              messageId: 'tooManyDirectorySegments',
            });
            return;
          }

          // Rule 3: For subdirectory imports (exactly 2 segments),
          // can only reference entry.<OPTIONAL-SEGMENTS>.ts[x] files
          const fileName = path.basename(importPath).replace(/\.(ts|tsx|js|jsx)$/, '');

          // Must match entry.<OPTIONAL-SEGMENTS> pattern (without .children)
          if (!/^entry(\.[0-9A-Za-z-]+)*$/.test(fileName)) {
            context.report({
              node: node.source,
              messageId: 'invalidSubdirectoryImport',
            });
            return;
          }

          // Also check it's not a children entry
          // Pattern: entry..children or entry..<segments>.children
          if (/^entry\.\.(([0-9A-Za-z-]+\.)*)?children$/.test(fileName)) {
            context.report({
              node: node.source,
              messageId: 'invalidSubdirectoryImport',
            });
          }
        }
      },
    };
  },
};

export default rule;
