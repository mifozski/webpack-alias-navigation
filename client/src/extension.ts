/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import { WebpackDefinitionProvider } from './WebpackDefinitionProvider';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {

	let workspaceRoot = path.resolve(vscode.workspace.rootPath, 'boron');
	if (!workspaceRoot) {
		return;
	}
	const pattern = path.join(workspaceRoot, 'webpack.config.js');

	const webpackConfig = require(pattern);

	let modules: Array<string> = webpackConfig.resolve.modules;
	let pwd = path.resolve('.');
	const resolvedModules = modules.map(modulePath  => {
		const diff = path.relative(pwd, modulePath);
		return path.join(workspaceRoot, diff);
	});


	let fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
	fileWatcher.onDidChange(onWebpackConfigChanged);

	// let fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

	let provider = new WebpackDefinitionProvider();
	provider.setModules(resolvedModules);
	vscode.languages.registerDefinitionProvider({ language: 'javascript', scheme: 'file' }, provider);

	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function onWebpackConfigChanged() {

}

export function deactivate(): Thenable<void> {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
