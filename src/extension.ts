import * as fs from 'fs';
import * as vscode from 'vscode';

import {
  filesInDir,
  getDirectoriesRecursive,
  replaceBackslashes,
} from './utils/fileUtils';
import {
  disposeItem,
  getExtensionSetting,
  getGlobalSetting,
} from './utils/vscodeUtils';

let runOnContextMenuDisposable: vscode.Disposable | undefined;
let commandRunDisposable: vscode.Disposable | undefined;
let eventConfigurationDisposable: vscode.Disposable | undefined;

const DEFAULT_GLOBAL_EXCLUDE: string[] = [];
const DEFAULT_EXCLUDE_PATTERN: string[] = [
  '**/build',
  '**/node_modules',
  '**/.*',
  '**/.vscode',
];
const DEFAULT_INCLUDE_PATTERN: string[] = ['*'];
const DEFAULT_SAVE_FORMAT: boolean = true;
const DEFAULT_CLOSE_FORMAT: boolean = false;

const globalExclude: string[] = DEFAULT_GLOBAL_EXCLUDE;
let excludePattern: string[] = DEFAULT_EXCLUDE_PATTERN;
let includePattern: string[] = DEFAULT_INCLUDE_PATTERN;
let saveAfterFormat: boolean = DEFAULT_SAVE_FORMAT;
let closeAfterSave: boolean = DEFAULT_CLOSE_FORMAT;

let workspaceFolder: string | undefined;
export const EXTENSION_NAME = 'Workspace_Formatter';

export let extensionContext: vscode.ExtensionContext | undefined;
export let extensionState: vscode.Memento | undefined;
export let extensionPath: string | undefined;

export function activate(context: vscode.ExtensionContext) {
  if (
    !vscode.workspace.workspaceFolders ||
    vscode.workspace.workspaceFolders.length === 0
  ) {
    return;
  }

  if (
    !vscode.workspace.workspaceFolders[0] ||
    !vscode.workspace.workspaceFolders[0].uri
  ) {
    return;
  }

  if (vscode.workspace.workspaceFolders.length === 1) {
    workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
  }

  extensionContext = context;
  extensionPath = context.extensionPath;
  extensionState = context.workspaceState;

  loadGlobalExcludeSettings();
  loadSettings();

  initRunStatusBar();
  initContextMenuDisposable();
  initConfigurationChangeDisposable();
}

export function deactivate() {
  disposeItem(runOnContextMenuDisposable);
  disposeItem(commandRunDisposable);
  disposeItem(eventConfigurationDisposable);
}

function loadGlobalExcludeSettings() {
  const globalExcludeObj = getGlobalSetting(
    'files.exclude',
    DEFAULT_GLOBAL_EXCLUDE,
  );

  const globalExcludeKeys = Object.keys(globalExcludeObj);

  for (const key of globalExcludeKeys) {
    if (globalExcludeObj[key] === true) {
      globalExclude.push(key);
    }
  }

  excludePattern.push(...globalExclude);
}

function loadSettings() {
  saveAfterFormat = getExtensionSetting('saveAfterFormat', DEFAULT_SAVE_FORMAT);
  closeAfterSave = getExtensionSetting('closeAfterSave', DEFAULT_CLOSE_FORMAT);
  includePattern = getExtensionSetting(
    'includePattern',
    DEFAULT_INCLUDE_PATTERN,
  );
  excludePattern = getExtensionSetting(
    'excludePattern',
    DEFAULT_EXCLUDE_PATTERN,
  );
}

function initConfigurationChangeDisposable() {
  if (eventConfigurationDisposable) return;

  eventConfigurationDisposable = vscode.workspace.onDidChangeConfiguration(
    (e: vscode.ConfigurationChangeEvent) => {
      const isChanged = e.affectsConfiguration(EXTENSION_NAME);

      if (isChanged) loadSettings();
    },
  );

  extensionContext?.subscriptions.push(eventConfigurationDisposable);
}

function initContextMenuDisposable() {
  if (runOnContextMenuDisposable) return;

  runOnContextMenuDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.runOnContextMenu`,
    async (clickedUriItem: vscode.Uri, selectedUriItems: vscode.Uri[]) => {
      const files: string[] = [];

      if (selectedUriItems.length > 0) {
        for (const selectedUriItem of selectedUriItems) {
          if (!selectedUriItem) continue;

          const selectedItem = replaceBackslashes(
            selectedUriItem.fsPath.toString(),
          );
          files.push(...(getAllFiles(selectedItem) ?? []));
        }
      } else {
        const clickedItem = replaceBackslashes(
          clickedUriItem.fsPath.toString(),
        );
        files.push(...(getAllFiles(clickedItem) ?? []));
      }

      if (!files) return;

      formatAllFiles(files);
    },
  );

  extensionContext?.subscriptions.push(runOnContextMenuDisposable);
}

function initRunStatusBar() {
  if (commandRunDisposable) return;

  const commandName = `${EXTENSION_NAME}.runOnWorkspace`;
  commandRunDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      if (!workspaceFolder) return;

      const files = getAllFiles(workspaceFolder);

      if (!files) return;

      formatAllFiles(files);
    },
  );

  extensionContext?.subscriptions.push(commandRunDisposable);
}

function getOpenedFiles(): Set<string> {
  const openedFiles = new Set<string>();
  vscode.workspace.textDocuments.forEach((document) => {
    if (!document.isClosed) {
      const filename = document.fileName.toString();
      if (fs.existsSync(filename)) {
        openedFiles.add(replaceBackslashes(filename));
      }
    }
  });
  return openedFiles;
}

function getAllFiles(startingDirectory: string) {
  let allDirectories = getDirectoriesRecursive(
    startingDirectory,
    includePattern,
    excludePattern,
  );
  allDirectories?.push(replaceBackslashes(startingDirectory));

  if (!allDirectories) {
    allDirectories = [startingDirectory];
  }

  const allFiles: string[] = [];

  allDirectories.forEach((dir) => {
    allFiles.push(...filesInDir(dir, includePattern, excludePattern));
  });

  return allFiles;
}

function formatAllFiles(files: string[]) {
  const increment = (1 / files.length) * 100;

  const progressOptions: vscode.ProgressOptions = {
    location: vscode.ProgressLocation.Notification,
    title: 'Formatting files',
    cancellable: true,
  };

  const openedFiles = getOpenedFiles();

  vscode.window.withProgress(
    progressOptions,
    async (
      progress: vscode.Progress<{
        message?: string;
        increment?: number;
      }>,
      cancellationToken: vscode.CancellationToken,
    ) => {
      for (const [i, file] of files.entries()) {
        if (file === undefined) break;
        if (cancellationToken.isCancellationRequested) break;

        try {
          progress.report({
            message: `${i + 1}/${files.length}`,
          });
          const document: vscode.TextDocument = await vscode.workspace.openTextDocument(
            file,
          );
          await vscode.window.showTextDocument(document, {
            preserveFocus: false,
            preview: true,
          });
          await vscode.commands.executeCommand(
            'editor.action.formatDocument',
            document.uri,
          );
          if (saveAfterFormat) {
            await vscode.commands.executeCommand(
              'workbench.action.files.save',
              document.uri,
            );
          }
          if (closeAfterSave) {
            const filename = replaceBackslashes(document.fileName.toString());

            // Don't close files that were already open before formatting
            if (openedFiles.has(filename)) {
              console.log(`Skipping close for already open file: ${filename}`);
              continue;
            }

            // Check if the current tab is pinned before closing it
            const isPinned = await isTabPinned(document.uri);
            if (isPinned) {
              console.log(`Skipping close for pinned file: ${filename}`);
              continue;
            }

            // Close the editor
            try {
              await vscode.commands.executeCommand(
                'workbench.action.closeActiveEditor',
                document.uri,
              );
              console.log(`Closed editor for: ${filename}`);
            } catch (closeError) {
              console.error(`Error closing editor for ${filename}:`, closeError);
            }
          }
        } catch (exception) {
          console.log(`Could not format file ${file}`);
        }
        progress.report({
          increment: increment,
        });
      }
    },
  );
}

// Function to check if a tab is pinned
async function isTabPinned(uri: vscode.Uri): Promise<boolean> {
  try {
    // Get all tab groups
    const tabGroups = vscode.window.tabGroups;

    // Check all groups for the tab with matching URI
    for (const group of tabGroups.all) {
      for (const tab of group.tabs) {
        // Type guard for tab input with URI
        const hasUri = (input: unknown): input is { uri: vscode.Uri } =>
          typeof input === 'object' && input !== null && 'uri' in input;

        // Check if this tab represents our document
        if (tab.input && hasUri(tab.input)) {
          // Compare URIs using fsPath for more reliable comparison
          const tabPath = tab.input.uri.fsPath;
          const docPath = uri.fsPath;

          if (tabPath === docPath) {
            console.log(`Tab for ${docPath} is ${tab.isPinned ? 'pinned' : 'not pinned'}`);
            return tab.isPinned || false;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking if tab is pinned:', error);
  }

  return false;
}
