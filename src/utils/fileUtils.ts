import * as fs from 'fs';
import * as minimatch from 'minimatch';
import * as path from 'path';
import * as vscode from 'vscode';

export function replaceBackslashes(text: string) {
  return text.replace(/\\/g, '/');
}

// Function to check if a file is ignored by .gitignore
export function isIgnoredByGitignore(filePath: string, rootDir: string): boolean {
  try {
    // Normalize paths for consistent comparison
    filePath = replaceBackslashes(filePath);
    rootDir = replaceBackslashes(rootDir);

    // Find all .gitignore files from the file path up to the root directory
    const gitignoreFiles: string[] = [];
    let currentDir = path.dirname(filePath);

    // Add root .gitignore first (if it exists)
    const rootGitignore = path.join(rootDir, '.gitignore');
    if (fs.existsSync(rootGitignore)) {
      gitignoreFiles.push(rootGitignore);
    }

    // Then add all parent directory .gitignore files
    while (currentDir.startsWith(rootDir)) {
      const gitignorePath = path.join(currentDir, '.gitignore');
      if (fs.existsSync(gitignorePath) && gitignorePath !== rootGitignore) {
        gitignoreFiles.push(gitignorePath);
      }
      // Move up one directory
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break; // Prevent infinite loop at root
      }
      currentDir = parentDir;
    }

    // Check each .gitignore file, starting from the closest one (reverse order)
    for (const gitignorePath of gitignoreFiles.reverse()) {
      try {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        const patterns = parseGitignoreContent(content);
        const gitignoreDir = path.dirname(gitignorePath);
        const relativePath = path.relative(gitignoreDir, filePath);
        const normalizedPath = replaceBackslashes(relativePath);

        console.log(`Checking if ${normalizedPath} matches patterns in ${gitignorePath}`);

        for (const pattern of patterns) {
          if (minimatch(normalizedPath, pattern, { dot: true })) {
            console.log(`File ${filePath} is ignored by pattern ${pattern} in ${gitignorePath}`);
            return true;
          }
        }
      } catch (error) {
        console.error(`Error reading .gitignore file: ${gitignorePath}`, error);
      }
    }
  } catch (error) {
    console.error(`Error checking .gitignore for ${filePath}:`, error);
  }

  return false;
}

// Parse .gitignore content into an array of patterns
function parseGitignoreContent(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')) // Remove empty lines and comments
    .map(pattern => {
      // Handle negated patterns (those starting with !)
      if (pattern.startsWith('!')) {
        // For now, we'll just skip negated patterns as they're more complex to handle
        // In a full implementation, we would need to track both included and excluded files
        return ''; // Skip this pattern
      }

      // Handle directory patterns (ending with /)
      if (pattern.endsWith('/')) {
        return pattern + '**'; // Match all files under this directory
      }

      // Handle patterns with wildcards
      if (pattern.includes('*')) {
        return pattern; // Already a glob pattern
      }

      // For simple patterns without wildcards, match both the file and any directories with that name
      if (!pattern.includes('/')) {
        return `{${pattern},${pattern}/**}`; // Match file or directory
      }

      return pattern;
    })
    .filter(pattern => pattern !== ''); // Remove any skipped patterns
}

export function getDirectoriesRecursive(
  dir: fs.PathLike,
  includePattern: string[],
  excludePattern: string[],
) {
  const directories = foldersInDir(dir, includePattern, excludePattern);

  if (directories.length === 0) return;

  directories.forEach((dir) =>
    getDirectoriesRecursive(
      dir,
      includePattern,
      excludePattern,
    )?.forEach((newDir) => directories.push(newDir)),
  );

  return directories;
}

export function readDir(dir: string | fs.PathLike) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return undefined;
  }
}

export function filesInDir(
  dir: string,
  includePattern: string[],
  excludePattern: string[],
) {
  const fileDirents = readDir(dir);

  if (!fileDirents) return [];

  let files = fileDirents
    .filter((file) => file.isFile())
    .map((file) => replaceBackslashes(file.name));

  if (files.length === 0) return [];

  if (includePattern.length > 0) {
    files = includePatternFromList(includePattern, files, false);
  }

  if (excludePattern.length > 0) {
    files = excludePatternFromList(excludePattern, files, false);
  }

  if (files.length > 0) {
    files = files.map((file: string) =>
      replaceBackslashes(path.join(dir, file)),
    );
  }

  // Filter out files that are ignored by .gitignore
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  if (workspaceRoot) {
    files = files.filter(file => !isIgnoredByGitignore(file, workspaceRoot));
  }

  return files;
}

export function includePatternFromList(
  excludeSearch: string[],
  stringList: string[],
  isFolders: boolean = true,
) {
  let result: string[] = [];

  for (const pattern of excludeSearch) {
    if (isFolders && pattern.includes('/')) {
      result.push(...stringList.filter((str) => minimatch(str, pattern)));
    } else if (!isFolders) {
      result.push(...stringList.filter((str) => minimatch(str, pattern)));
    }
  }

  if (isFolders && result.length === 0) {
    result = stringList;
  }

  return result;
}

export function excludePatternFromList(
  excludeSearch: string[],
  stringList: string[],
  isFolders: boolean = true,
) {
  for (const pattern of excludeSearch) {
    if (isFolders && pattern.includes('/')) {
      stringList = stringList.filter((str) => !minimatch(str, pattern));
    } else if (!isFolders && !pattern.includes('/')) {
      stringList = stringList.filter((str) => !minimatch(str, pattern));
    }
  }

  return stringList;
}

export function foldersInDir(
  dir: fs.PathLike,
  includePattern: string[],
  excludePattern: string[],
) {
  const fileDirents = readDir(dir);

  if (!fileDirents) return [];

  const folders = fileDirents.filter((folder) => folder.isDirectory());
  let folderNames = folders.map((folder) =>
    replaceBackslashes(path.join(dir.toString(), folder.name)),
  );

  if (folderNames.length === 0) return [];

  if (includePattern.length > 0) {
    folderNames = includePatternFromList(includePattern, folderNames, true);
  }

  if (excludePattern.length > 0) {
    folderNames = excludePatternFromList(excludePattern, folderNames, true);
  }

  // Filter out folders that are ignored by .gitignore
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  if (workspaceRoot) {
    folderNames = folderNames.filter(folder => !isIgnoredByGitignore(folder, workspaceRoot));
  }

  return folderNames;
}
