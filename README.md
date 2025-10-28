# Serenity Custom Pools - API Management

## Project Overview
This folder contains all documentation, logs, and resources for managing the Serenity Custom Pools webapp via Claude Code's API access.

**Website**: https://serenitycustompools.com
**Created**: 2025-10-28

## Folder Structure

```
serenity-pools-api/
├── README.md           # This file - project overview
├── configs/            # API configuration and credentials
│   └── api-key.txt    # Secure API key storage
├── docs/               # API documentation
│   ├── endpoints.md   # Available API endpoints
│   ├── meta-endpoints.md  # Meta-endpoint system docs
│   └── automations.md # Existing automations inventory
├── logs/               # Action logs and change history
│   └── changelog.md   # All changes made via API
├── scripts/            # Reusable API scripts
└── backups/            # Configuration backups
```

## How This Works

### Memory Persistence
Claude Code doesn't retain memory between sessions, so this folder serves as:
- **External memory** - I can read these files to understand what was done
- **Audit trail** - Complete history of all changes
- **Documentation hub** - API specs and guides
- **Recovery system** - Backups of critical configs

### Workflow
1. User provides API key (stored in `configs/api-key.txt`)
2. I read API documentation from `docs/` folder
3. Before making changes, I check `logs/changelog.md`
4. After each action, I log it to changelog
5. In future sessions, I read these files to "remember" everything

## Security Notes
- API key has full admin access to serenitycustompools.com
- Keep this folder private and secure
- Consider encrypting sensitive files
- Never commit to public git repositories

## Quick Start (Future Sessions)
When starting a new Claude Code session:
1. Say: "Read the Serenity Pools API docs and changelog"
2. I'll scan this folder and understand the current state
3. Continue working seamlessly

## Contact
Owner: Adam Mach
API Builder: Replit.com coding agent
