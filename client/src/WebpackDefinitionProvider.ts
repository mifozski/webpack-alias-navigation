import * as vscode from 'vscode';
import cp = require('child_process');
import { killProcess } from './utils';
import * as fs from 'fs';
import * as path from 'path';

export interface WebpackDefinitionInformation {
	file: string;
	line: number;
	column: number;
	doc: string;
	declarationlines: string[];
	name: string;
	toolUsed: string;
}

export class WebpackDefinitionProvider implements vscode.DefinitionProvider {
	private modules: Array<string>;
	private extensions: Array<string>;

	constructor() {
		this.modules = [];
		this.extensions = [
			'js',
			'mjs'
		];
	}

	public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {
		return definitionLocation(this.modules, this.extensions, document, position, token).then(definitionInfo => {
			if (definitionInfo === null || definitionInfo.file === null) {
                return null;
            }
			let definitionResource = vscode.Uri.file(definitionInfo.file);
			let pos = new vscode.Position(definitionInfo.line, definitionInfo.column);
			return new vscode.Location(definitionResource, pos);
		}, err => {
			if (err) {
				// Prompt for missing tool is located here so that the
				// prompts dont show up on hover or signature help
				// if (typeof err === 'string' && err.startsWith(missingToolMsg)) {
				// 	promptForMissingTool(err.substr(missingToolMsg.length));
				// } else {
				// 	return Promise.reject(err);
				// }
			}
			return Promise.resolve(null);
		});
	}

	setModules(modules: Array<string>) {
		this.modules = modules;
	}
}

export function definitionLocation(modules: Array<string>, extensions: Array<string>, document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<WebpackDefinitionInformation> {
	let wordRange = document.getWordRangeAtPosition(position, /'(.*?)(?=['"])/);
	// let lineText = document.lineAt(position.line).text;
	let word = wordRange ? document.getText(wordRange) : '';
	word = word.substring(1);

	let p: cp.ChildProcess;
	if (token) {
		token.onCancellationRequested(() => killProcess(p));
	}

	return resolvePath(word, modules, extensions);
	// if (!wordRange || lineText.startsWith('//') || isPositionInString(document, position) || word.match(/^\d+.?\d+$/) || goKeywords.indexOf(word) > 0) {
		// return Promise.resolve(null);
	// }
	// if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
	// 	position = position.translate(0, -1);
	// }
	// if (!goConfig) {
	// 	goConfig = vscode.workspace.getConfiguration('go', document.uri);
	// }
	// let toolForDocs = goConfig['docsTool'] || 'godoc';
	// let offset = byteOffsetAt(document, position);
	// let env = getToolsEnvVars();
	// return getGoVersion().then((ver: SemVersion) => {
	// 	// If no Go version can be parsed, it means it's a non-tagged one.
	// 	// Assume it's > Go 1.5
	// 	if (toolForDocs === 'godoc' || (ver && (ver.major < 1 || (ver.major === 1 && ver.minor < 6)))) {
	// 		return definitionLocation_godef(document, position, offset, includeDocs, env, token);
	// 	} else if (toolForDocs === 'guru') {
	// 		return definitionLocation_guru(document, position, offset, env, token);
	// 	}
	// 	return definitionLocation_gogetdoc(document, position, offset, env, true, token);
	// });
}

export function resolvePath(selectedPath: string, modules: Array<string>, extensions: Array<string>): Promise<WebpackDefinitionInformation> {
	return new Promise<WebpackDefinitionInformation>((resolve, reject) => {
		if (modules.length === 0) {
			return reject(null);
		}
		modules.forEach((module) => {

			let baseFullPath = path.join(module, selectedPath);

			const pathVariants = (path.extname(baseFullPath) !== '') ? [baseFullPath] : extensions.map(ext => {
				return `${baseFullPath}.${ext}`;
			});

			pathVariants.forEach(pathVar => {
				if (fs.existsSync(pathVar)) {

					let definitionInfo: WebpackDefinitionInformation = {
						file: pathVar,
						line: 0,
						column: 0,
						toolUsed: 'guru',
						declarationlines: ['lol4toeto'],
						doc: null,
						name: null,
					};

					return resolve(definitionInfo);
				}
			});
		});

		return reject(null);
	});
}