# EventPulse Scripts

This directory contains utility scripts for the EventPulse application.

## AI Documentation Updater

The `update-ai-docs.ts` script helps maintain the documentation used by the AI Assistant. This documentation is stored in a markdown file and is injected into the AI's system prompt, allowing it to provide accurate and up-to-date information about EventPulse features.

### Usage

Run the script using npm:

```bash
npm run update-ai-docs
```

Or directly with tsx:

```bash
npx tsx scripts/update-ai-docs.ts
```

### Features

The script provides an interactive interface with the following options:

1. **View current documentation** - See what's already documented
2. **Add new features to existing sections** - Easily extend documentation as you add features
3. **Update existing sections** - Modify documentation when features change
4. **Add new sections** - Create entirely new categories of documentation

### How It Works

The script manages the markdown file at `src/data/eventpulse-features.md`. When the AI Assistant is used, this documentation is loaded and injected into the system prompt, giving the AI access to the most up-to-date information about EventPulse.

### Best Practices

- Keep documentation concise but comprehensive
- Update the documentation whenever you add or change features
- Organize information logically by feature area
- Include common workflows and troubleshooting tips
- Use consistent formatting for similar types of information
