# Quick Start Guide

## For New Claude Code Sessions

When starting a fresh conversation with Claude Code about this project, say:

```
"Read all files in ~/serenity-pools-api/ to understand the Serenity Custom Pools API project"
```

This will load:
- API key and configuration
- Available endpoints
- Change history
- Existing automations
- Previous work done

## Key Files to Read First

1. `README.md` - Project overview
2. `configs/api-key.txt` - API credentials
3. `logs/changelog.md` - What's been done
4. `docs/automations.md` - Existing automations to avoid conflicts

## When You Provide the API Key

1. Update `configs/api-key.txt` with the actual key
2. Share any API documentation (I'll save to `docs/`)
3. I'll read everything and get to work!

## Folder Location

**Path**: `/Users/adammach/serenity-pools-api/`

## Testing the API

Run the test script:
```bash
cd ~/serenity-pools-api/scripts
./test-api.sh /api/health
```

## Important Workflow

**Before any action**: Check `logs/changelog.md` and `docs/automations.md`
**After any action**: Update `logs/changelog.md` immediately
**For backups**: Copy configs to `backups/` before major changes

## Security

- This folder contains sensitive credentials
- Keep it private
- Don't share or commit to public repos
- Consider encrypting if needed
