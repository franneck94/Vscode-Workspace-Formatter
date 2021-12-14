# VSCode Workspace Formatter

🔧 Format all your files in a workspace with one click. 🔧

You can define include and exclude patterns to manage which files and directories should be formatted.  
Besides that, you can also select only certain directories to format with the context menu.

## Example

![ExampleGif](./media/Example.gif?raw=true)

## How to use: Format the whole workspace

1. Open the command palette (F1)
2. Run the command: *Workspace Formatter: Run*
3. All files will be formatted w.r.t the include/exclude patterns

## How to use: Only format selected directories

1. Select any folder in the context menu, by right-clicking
2. Run the context-menu command: *Format Directory*
3. All files will be formatted w.r.t the include/exclude patterns

## Extension Features

For including/excluding glob patterns are used.  
For more information about glob patterns see [here](https://en.wikipedia.org/wiki/Glob_(Workspacegramming)#Syntax).

### Include Folders for Selection

You can add glob patterns to include folder and file names.  
Per default, there is no include filter.

For example, if you only want to format typescript files in your workspace, you could add the following glob pattern:

```json
Workspace_Formatter.includePattern: ["*.ts"]
```

### Exclude Folders for Selection

You can add glob patterns to exclude folder and file names.
Per default, all folders and files starting with a *.* are excluded, also all directories that are called *build*.

For example, if you want to skip formatting for javascript files in your workspace, you could add the following glob pattern:

```json
Workspace_Formatter.excludePattern: ["*.js"]
```

### Extension Settings

- ⚙️ Glob pattern to include from the folder selection (defaults to ["\*"])
- ⚙️ Glob pattern to exclude from the folder selection (defaults to ["\*\*\/build", "\*\*/.\*", "\*\*/.vscode"])
- ⚙️ Whether to open the currently formatted file (defaults to false)
- ⚙️ Whether to save the currently formatted file (defaults to true)
- ⚙️ Whether to close the currently formatted file. Only used, if *showFormatting* is active (defaults to true)

## Release Notes

Refer to the [CHANGELOG](CHANGELOG.md).

## License

Copyright (C) 2021 Jan Schaffranek.  
Licensed under the [MIT License](LICENSE).
