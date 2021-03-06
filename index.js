#!/usr/bin/env node
const chalk = require('chalk');
const inquirer = require('inquirer');
const replace = require('replace-in-file');

const log = console.log;

const { copyFolderRecursiveSync } = require('./utils/copy');
const { deleteFolderSync } = require('./utils/delete');
const { execPromise } = require('./utils/exec');
const { showError } = require('./utils/error');

let config = {};

const questions = [
	{
		type: 'list',
		name: 'branding',
		message: 'Which branding do you want to use?',
		choices: ['Antwerp', 'Digipolis', 'ACPaaS'],
		filter: (val) => {
			switch (val) {
				case 'ACPaaS': return {cdn: 'acpaas_branding_scss', npm: ['@a-ui/core', '@a-ui/acpaas'], version: '3.0.3', type: 'acpaas' };
				case 'Digipolis': return {cdn: 'digipolis_branding_scss', npm: ['@a-ui/core', '@a-ui/digipolis'], version: '3.0.2', type: 'digipolis' };
				default: return {cdn: 'core_branding_scss', npm: ['@a-ui/core'], version: '3.0.3', type: 'core' };
			}
		},
	},
	{
		type: 'confirm',
		name: 'flexboxgrid',
		message: 'Do you want to use the Flexbox grid?',
		default: true,
	},
]

/**
 * Welcome!
 * First run the questionnaire.
 */
log(chalk.yellow.bold(`===========================================
Welcome to the Digipolis React starter kit!
===========================================`));
inquirer.prompt(questions).then(answers => {
	config = answers;
	startInstall();
});

/**
 * Create a clean new frontend folder (delete it first should it exist).
 */
async function startInstall() {
	log(chalk.green.bold(`
Preparing...`));

	try {
		await deleteFolderSync('frontend');
		log(chalk.blue(`
Done`));
		installReact();
	} catch (e) {
		showError(e);
	}
}

/**
 * Run the create-react-app command.
 * Install NPM dependencies.
 */
async function installReact() {
	log(chalk.green.bold(`
Installing React...`));

	try {
		await execPromise('npx', ['create-react-app', 'frontend']);
		log(chalk.blue(`
Done`));
		installACPaaSUI();
	} catch (e) {
		showError(e);
	}
}

/**
 * Go into frontend folder and install ACPaaS UI related stuff:
 * - ACPaaS UI (React).
 * - Core Branding and optionally one of the other brandings.
 * - Node SASS, so you don't have to rely on CSS only.
 */
async function installACPaaSUI() {
	log(chalk.green.bold(`
Installing ACPaaS UI...`));

	try {
		await execPromise('npm', ['install', '--prefix', './frontend', '--save-dev', 'node-sass']);
		await execPromise('npm', ['install', '--prefix', './frontend', '--save', '@acpaas-ui/react-components'].concat(config.branding.npm));
		log(chalk.blue(`
Done`));
		createStarterTemplate();
	} catch (e) {
		showError(e);
	}
}

/**
 * Adjust the generated `index.html` file to include:
 * - Core Branding.
 * - Flexbox grid.
 * Merge our ready-made files with the files created by Create React App.
 */
async function createStarterTemplate() {
	log(chalk.green.bold(`
Creating starter template...`));

	let addFlexboxGrid = config.flexboxgrid ? `
    <link rel="stylesheet" href="https://cdn.antwerpen.be/core_flexboxgrid_scss/1.0.1/flexboxgrid.min.css">` : '';

	const options = {
		files: 'frontend/public/index.html',
		from: /<link rel="manifest"/g,
		to: `<link rel="stylesheet" href="https://cdn.antwerpen.be/${config.branding.cdn}/${config.branding.version}/main.min.css">${addFlexboxGrid}
    <link rel="manifest"`,
	};

	try {
		await replace(options);
		await copyFolderRecursiveSync(`${__dirname}/files/public`, 'frontend');
		await copyFolderRecursiveSync(`${__dirname}/files/src`, 'frontend');
		log(chalk.blue(`
Done`));
		finishInstall();
	} catch (e) {
		showError(e);
	}
}

/**
 * Clean up and finish installation.
 */
function finishInstall() {
	log(chalk.white.bold(`
Now run ${chalk.cyan.bold('npm start')} in your frontend directory.
`));
}
