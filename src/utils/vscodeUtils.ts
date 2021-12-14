import * as vscode from 'vscode';

import { EXTENSION_NAME } from '../extension';

export function disposeItem(disposableItem: vscode.Disposable | undefined) {
  disposableItem?.dispose();
}

export function setContextValue(key: string, value: any) {
  return vscode.commands.executeCommand('setContext', key, value);
}

export function getSettingsValue(name: string, defaultValue: any) {
  const settingName: string = `${EXTENSION_NAME}.${name}`;

  const settingsValue = vscode.workspace.getConfiguration().get(settingName);

  if (settingsValue === undefined) {
    return defaultValue;
  }

  return settingsValue;
}
