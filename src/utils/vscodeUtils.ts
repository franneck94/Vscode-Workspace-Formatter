import * as vscode from 'vscode';

import { EXTENSION_NAME } from '../extension';

export function disposeItem(disposableItem: vscode.Disposable | undefined) {
  disposableItem?.dispose();
}

export function getExtensionSetting(name: string, defaultValue: any) {
  const settingName: string = `${EXTENSION_NAME}.${name}`;

  const settingsValue = vscode.workspace.getConfiguration().get(settingName);

  if (settingsValue === undefined) {
    return defaultValue;
  }

  return settingsValue;
}

export function getGlobalSetting(name: string, defaultValue: any) {
  const settingName: string = name;

  const settingsValue = vscode.workspace.getConfiguration().get(settingName);

  if (settingsValue === undefined) {
    return defaultValue;
  }

  return settingsValue;
}
