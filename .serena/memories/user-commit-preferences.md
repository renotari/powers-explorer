# User Commit Preferences

## DO NOT Auto-Commit

**IMPORTANT:** The user does NOT want automatic commits.

### Workflow:
1. Make code changes
2. User tests the changes
3. User explicitly requests commit at certain stages
4. Only then create git commits

### Reason:
User wants to verify functionality before committing to version control.

### Action:
- Never use `git commit` unless explicitly requested
- After making changes, inform user that changes are ready for testing
- Wait for user to request commit after they've tested
