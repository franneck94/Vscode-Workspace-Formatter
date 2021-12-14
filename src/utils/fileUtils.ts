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

  if (includePattern.length > 0) {
    files = includePatternFromList(includePattern, files);
  }

  if (excludePattern.length > 0) {
    files = excludePatternFromList(excludePattern, files);
  }

  return files;
}

export function includePatternFromList(
  excludeSearch: string[],
  stringList: string[],
) {
  for (const pattern of excludeSearch) {
    stringList = stringList.filter((str) => minimatch(str, pattern));
  }

  return stringList;
}

export function excludePatternFromList(
  excludeSearch: string[],
  stringList: string[],
) {
  for (const pattern of excludeSearch) {
    stringList = stringList.filter((str) => !minimatch(str, pattern));
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

  if (includePattern.length > 0) {
    folderNames = includePatternFromList(includePattern, folderNames);
  }

  if (excludePattern.length > 0) {
    folderNames = excludePatternFromList(excludePattern, folderNames);
  }

  return folderNames;
}
