# VSCode Workspace Formatter

🔧 Format all your files in a workspace with one click. 🔧

You can also add include and exclude patterns to manage which files and directories should be formatted.

## Example

![ExampleGif](./media/Example.gif?raw=true)

## How to use: Format the whole workspace

...

## How to use: Only format selected directories

...

## Extension Features

For including/excluding glob patterns are used.  
For more information about glob patterns see [here](https://en.wikipedia.org/wiki/Glob_(Workspacegramming)#Syntax).

### Include Folders for Selection

You can add glob patterns to Include folders from the search to shorten the list.

For example with the following glob pattern:

![IncludePattern](./media/IncludePattern.png)

The folder selection would change from left to right.

![IncludePaths1](./media/IncludePaths1.png)
![IncludePaths2](./media/IncludePaths2.png)

### Exclude Folders for Selection

You can add glob patterns to exclude folders from the search to shorten the list.

For example with the following glob pattern:

![ExcludePattern](./media/excludePattern.png)

The folder selection would change from left to right.

![ExcludePaths1](./media/excludePaths1.png)
![ExcludePaths2](./media/excludePaths2.png)

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
