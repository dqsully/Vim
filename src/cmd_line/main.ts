"use strict";

import * as vscode from "vscode";
import * as parser from "./parser";
import {VimState, ModeHandler} from "../mode/modeHandler";
import { Position, PositionDiff } from './../common/motion/position';
import {attach, RPCValue} from 'promised-neovim-client';
import {spawn} from 'child_process';
import { TextEditor } from "../textEditor";
import { Configuration } from '../configuration/configuration';
import { Neovim } from "../neovim/nvimUtil";

// Shows the vim command line.
export async function showCmdLine(initialText: string, modeHandler : ModeHandler): Promise<undefined> {
  if (!vscode.window.activeTextEditor) {
    console.log("No active document.");
    return;
  }


  const options : vscode.InputBoxOptions = {
    prompt: "Vim command line",
    value: initialText,
    ignoreFocusOut: true,
    valueSelection: [initialText.length, initialText.length]
  };

  try {
    const cmdString = await vscode.window.showInputBox(options);
    await runCmdLine(cmdString!, modeHandler);
    return;
  } catch (e) {
    modeHandler.setStatusBarText(e.toString());
    return;
  }
}

export async function runCmdLine(command : string, modeHandler : ModeHandler) : Promise<undefined> {
  if (!command || command.length === 0) {
    return;
  }

  try {
    var cmd = parser.parse(command);
    if (cmd.isEmpty) {
      return;
    }
    if (cmd.command.neovimCapable) {
      await Neovim.command(modeHandler.vimState, command).then(() => {
        console.log("Substituted for neovim command");
      }).catch((err) => console.log(err));
    } else {
      await cmd.execute(modeHandler.vimState.editor, modeHandler);
    }
    return;
  } catch (e) {
    await Neovim.command(modeHandler.vimState, command).then(() => {
      console.log("SUCCESS");
    }).catch((err) => console.log(err));
    return;
  }
}
