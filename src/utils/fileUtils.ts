import * as fs from 'fs';
import * as minimatch from 'minimatch';
import * as path from 'path';

export function replaceBackslashes(text: string) {
  return text.replace(/\\/g, '/');
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

  return folderNames;
}
