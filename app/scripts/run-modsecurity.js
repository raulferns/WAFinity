#!/usr/bin/env node
/**
 * WAFinity - Local ModSecurity (OWASP CRS) Docker Runner
 * 
 * Manages the official owasp/modsecurity-crs container locally for testing WAFinity.
 * Usage:
 *   node scripts/run-modsecurity.js start
 *   node scripts/run-modsecurity.js stop
 *   node scripts/run-modsecurity.js logs
 */

const { execSync, spawn } = require('child_process');

const CONTAINER_NAME = 'wafinity-modsecurity';
const IMAGE_NAME = 'owasp/modsecurity-crs:apache';
const PORT = 8080;
const PARANOIA = 2;
const BACKEND = 'http://httpbin.org';

const action = (process.argv[2] || 'start').toLowerCase();

function isDockerAvailable() {
	try {
		execSync('docker --version', { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

function isContainerRunning() {
	try {
		const out = execSync(`docker ps -q -f name=${CONTAINER_NAME}`, { encoding: 'utf8' }).trim();
		return !!out;
	} catch {
		return false;
	}
}

function stopContainer() {
	console.log(`\x1b[36m[*] Stopping container ${CONTAINER_NAME}...\x1b[0m`);
	try {
		execSync(`docker stop ${CONTAINER_NAME}`, { stdio: 'ignore' });
		execSync(`docker rm ${CONTAINER_NAME}`, { stdio: 'ignore' });
		console.log(`\x1b[32m✔ Container stopped and removed.\x1b[0m`);
	} catch {
		// container may not exist, ignore
	}
}

function startContainer() {
	console.log(`\x1b[35m========================================================\x1b[0m`);
	console.log(`\x1b[1m   WAFinity - Local ModSecurity (OWASP CRS) Docker     \x1b[0m`);
	console.log(`\x1b[35m========================================================\x1b[0m\n`);

	if (!isDockerAvailable()) {
		console.error(`\x1b[31m✖ Docker is not installed or not running in your PATH.\x1b[0m`);
		console.error(`   Please ensure \x1b[1mDocker Desktop\x1b[0m is installed and running:`);
		console.error(`   👉 https://www.docker.com/products/docker-desktop/\n`);
		process.exit(1);
	}

	stopContainer();

	console.log(`\x1b[36m[*] Starting official ModSecurity container...\x1b[0m`);
	console.log(`   • Image     : ${IMAGE_NAME}`);
	console.log(`   • Port      : ${PORT}`);
	console.log(`   • Paranoia  : ${PARANOIA}`);
	console.log(`   • Backend   : ${BACKEND}\n`);

	try {
		const cmd = `docker run -d --name ${CONTAINER_NAME} -p ${PORT}:8080 -e PARANOIA=${PARANOIA} -e BACKEND=${BACKEND} ${IMAGE_NAME}`;
		const containerId = execSync(cmd, { encoding: 'utf8' }).trim();

		console.log(`\x1b[32m✔ ModSecurity WAF is LIVE!\x1b[0m Container ID: ${containerId.slice(0, 12)}`);
		console.log(`\n\x1b[1mTest URL in WAFinity:\x1b[0m`);
		console.log(`👉 \x1b[32mhttp://localhost:${PORT}\x1b[0m (or http://127.0.0.1:${PORT})\n`);
		console.log(`\x1b[90mManagement commands:\x1b[0m`);
		console.log(`   npm run modsec:logs    # View ModSecurity block alerts`);
		console.log(`   npm run modsec:stop    # Stop the container\n`);
	} catch (err) {
		console.error(`\x1b[31m✖ Failed to start container:\x1b[0m`, err.message);
		process.exit(1);
	}
}

function showLogs() {
	if (!isDockerAvailable()) {
		console.error(`\x1b[31m✖ Docker is not running.\x1b[0m`);
		process.exit(1);
	}

	console.log(`\x1b[36m[*] Following ModSecurity audit logs (Ctrl+C to exit)...\x1b[0m\n`);
	const child = spawn('docker', ['logs', '-f', CONTAINER_NAME], { stdio: 'inherit' });
	child.on('error', (e) => console.error(e));
}

switch (action) {
	case 'stop':
		stopContainer();
		break;
	case 'logs':
		showLogs();
		break;
	case 'start':
	default:
		startContainer();
		break;
}
