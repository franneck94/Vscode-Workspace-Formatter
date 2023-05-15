import * as vscode from 'vscode';

import { EXTENSION_NAME } from '../extension';

export function disposeItem(disposableItem: vscode.Disposable | undefined) {
  disposableItem?.dispose();
}

export function getExtensionSetting(name_: string, defaultValue: any) {
  const name: string = `${EXTENSION_NAME}.${name_}`;

  const settingsValue = vscode.workspace.getConfiguration().get(name);

  if (settingsValue === undefined) {
    return defaultValue;
  }

  return settingsValue;
}

export function getGlobalSetting(name: string, defaultValue: any) {
  const settingsValue = vscode.workspace.getConfiguration().get(name);

  if (settingsValue === undefined) {
    return defaultValue;
  }

  return settingsValue;
}
