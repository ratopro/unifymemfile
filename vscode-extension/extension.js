const { window, workspace } = require("vscode");
const { execSync } = require("child_process");
const path = require("path");

function getUnifymemfilePath() {
  const config = workspace.getConfiguration("unifymemfile");
  return config.get("cliPath", "unifymemfile");
}

function getProjectRoot() {
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
    return null;
  }
  return workspace.workspaceFolders[0].uri.fsPath;
}

async function saveContext() {
  const root = getProjectRoot();
  if (!root) {
    window.showWarningMessage("No workspace folder open. Cannot save context.");
    return;
  }

  try {
    const cliPath = getUnifymemfilePath();
    const cwd = root;

    let summary = "";
    let openTasks = "";

    const summaryInput = await window.showInputBox({
      prompt: "Summary of current project state",
      placeHolder: "Brief description of what you're working on",
    });

    if (summaryInput !== undefined) {
      summary = summaryInput;
    }

    const tasksInput = await window.showInputBox({
      prompt: "Open tasks (press Enter to skip)",
      placeHolder: "What needs to be done?",
    });

    if (tasksInput !== undefined) {
      openTasks = tasksInput;
    }

    const args = ["save", "--project-root", root];
    if (summary) {
      args.push("--summary", summary);
    }
    if (openTasks) {
      args.push("--open-tasks", openTasks);
    }

    execSync(`${cliPath} ${args.join(" ")}`, {
      cwd,
      stdio: "inherit",
    });

    window.showInformationMessage("Context saved to .context.md");
  } catch (error) {
    window.showErrorMessage(`Failed to save context: ${error.message}`);
  }
}

module.exports = {
  activate(context) {
    const disposable = window.registerCommand(
      "unifymemfile.saveContext",
      saveContext
    );
    context.subscriptions.push(disposable);
  },
  deactivate() {},
};