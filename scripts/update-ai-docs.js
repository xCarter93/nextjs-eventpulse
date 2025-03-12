#!/usr/bin/env node

/**
 * This script helps update the EventPulse features documentation
 * Run with: node scripts/update-ai-docs.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const DOCS_PATH = path.join(process.cwd(), "src/data/eventpulse-features.md");

// Create readline interface for user input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

/**
 * Main function to run the script
 */
async function main() {
	console.log("\n🤖 EventPulse AI Documentation Updater 🤖\n");

	// Check if the documentation file exists
	if (!fs.existsSync(DOCS_PATH)) {
		console.log("❌ Documentation file not found. Creating a new one...");
		createEmptyDocFile();
	}

	// Read the current documentation
	const currentDocs = fs.readFileSync(DOCS_PATH, "utf-8");

	// Show menu
	const choice = await showMenu();

	switch (choice) {
		case "1":
			// View current documentation
			console.log("\n📄 CURRENT DOCUMENTATION:\n");
			console.log(currentDocs);
			break;

		case "2":
			// Add a new feature
			await addNewFeature(currentDocs);
			break;

		case "3":
			// Update existing section
			await updateSection(currentDocs);
			break;

		case "4":
			// Add a new section
			await addNewSection(currentDocs);
			break;

		case "5":
			console.log("\n👋 Exiting...");
			break;

		default:
			console.log("\n❌ Invalid choice");
	}

	rl.close();
}

/**
 * Show the main menu and get user choice
 */
function showMenu() {
	return new Promise((resolve) => {
		console.log("What would you like to do?");
		console.log("1. View current documentation");
		console.log("2. Add a new feature to existing section");
		console.log("3. Update an existing section");
		console.log("4. Add a new section");
		console.log("5. Exit");

		rl.question("\nEnter your choice (1-5): ", (answer) => {
			resolve(answer.trim());
		});
	});
}

/**
 * Create an empty documentation file with basic structure
 */
function createEmptyDocFile() {
	const template = `# EventPulse Features Documentation

## Core Features

### 1. Dashboard Features
- Example feature 1
- Example feature 2

## Navigation Paths
- **Dashboard**: Access via the dashboard icon or \`/dashboard\`

## Common Workflows

### Example Workflow
1. Step 1
2. Step 2

## Best Practices

### Example Best Practices
- Best practice 1
- Best practice 2
`;

	fs.writeFileSync(DOCS_PATH, template);
	console.log("✅ Created new documentation file with template structure");
}

/**
 * Add a new feature to an existing section
 */
async function addNewFeature(currentDocs) {
	// Get the section headers
	const sectionHeaders = currentDocs.match(/### [^\n]+/g) || [];

	if (sectionHeaders.length === 0) {
		console.log("❌ No sections found in the documentation");
		return;
	}

	console.log("\nAvailable sections:");
	sectionHeaders.forEach((header, index) => {
		console.log(`${index + 1}. ${header.replace("### ", "")}`);
	});

	const sectionIndex = await askQuestion("\nSelect section number: ");
	const selectedSection = sectionHeaders[parseInt(sectionIndex) - 1];

	if (!selectedSection) {
		console.log("❌ Invalid section number");
		return;
	}

	const newFeature = await askQuestion("Enter new feature: ");

	// Find the section and add the feature
	const sectionRegex = new RegExp(`${selectedSection}[\\s\\S]*?(?=###|$)`, "g");
	const sectionContent = currentDocs.match(sectionRegex)[0];

	const updatedSectionContent = sectionContent.trim() + `\n- ${newFeature}\n`;
	const updatedDocs = currentDocs.replace(sectionRegex, updatedSectionContent);

	fs.writeFileSync(DOCS_PATH, updatedDocs);
	console.log(
		`✅ Added "${newFeature}" to ${selectedSection.replace("### ", "")}`
	);
}

/**
 * Update an existing section
 */
async function updateSection(currentDocs) {
	// Get the section headers
	const sectionHeaders = currentDocs.match(/### [^\n]+/g) || [];

	if (sectionHeaders.length === 0) {
		console.log("❌ No sections found in the documentation");
		return;
	}

	console.log("\nAvailable sections:");
	sectionHeaders.forEach((header, index) => {
		console.log(`${index + 1}. ${header.replace("### ", "")}`);
	});

	const sectionIndex = await askQuestion("\nSelect section number: ");
	const selectedSection = sectionHeaders[parseInt(sectionIndex) - 1];

	if (!selectedSection) {
		console.log("❌ Invalid section number");
		return;
	}

	// Find the section content
	const sectionRegex = new RegExp(`${selectedSection}[\\s\\S]*?(?=###|$)`, "g");
	const sectionContent = currentDocs.match(sectionRegex)[0];

	console.log("\nCurrent section content:");
	console.log(sectionContent);

	console.log(
		'\nEnter new content for this section (end with a line containing only "END"):'
	);
	let newContent = selectedSection + "\n";

	// Collect multiline input
	const lines = await collectMultilineInput();
	newContent += lines.join("\n") + "\n\n";

	const updatedDocs = currentDocs.replace(sectionRegex, newContent);

	fs.writeFileSync(DOCS_PATH, updatedDocs);
	console.log(`✅ Updated ${selectedSection.replace("### ", "")}`);
}

/**
 * Add a new section to the documentation
 */
async function addNewSection(currentDocs) {
	const sectionName = await askQuestion("Enter new section name: ");
	const sectionHeader = `### ${sectionName}`;

	console.log(
		'\nEnter content for this section (end with a line containing only "END"):'
	);

	// Collect multiline input
	const lines = await collectMultilineInput();
	const sectionContent = lines.join("\n");

	// Add the new section to the end of the document
	const updatedDocs =
		currentDocs.trim() + `\n\n${sectionHeader}\n${sectionContent}\n`;

	fs.writeFileSync(DOCS_PATH, updatedDocs);
	console.log(`✅ Added new section "${sectionName}"`);
}

/**
 * Collect multiline input until "END" is entered
 */
async function collectMultilineInput() {
	return new Promise((resolve) => {
		const lines = [];

		const onLine = (line) => {
			if (line.trim() === "END") {
				rl.removeListener("line", onLine);
				resolve(lines);
			} else {
				lines.push(line);
			}
		};

		rl.on("line", onLine);
	});
}

/**
 * Ask a question and get the answer
 */
function askQuestion(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
}

// Run the script
main().catch(console.error);
