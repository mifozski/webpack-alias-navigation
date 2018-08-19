import cp = require('child_process');

export function killProcess(p: cp.ChildProcess) {
	if (p) {
		try {
			p.kill();
		} catch (e) {
			console.log('Error killing process: ' + e);
			if (e && e.message && e.stack) {
				let matches = e.stack.match(/(src.go[a-z,A-Z]+\.js)/g);
				if (matches) {
					console.log('errorKillingProcess', { message: e.message, stack: matches });
				}
			}

		}
	}
}