# VoCAT-CLI

Voice-controlled GitHub Actions and CI/CD pipeline manager.

## Features

- Voice commands to trigger GitHub Actions
- Monitor workflow runs
- Deploy to environments
- Natural language pipeline control

## Installation

```bash
npm install -g vocat-cli
```

## Usage

```bash
# Trigger a workflow
vocat-ci run tests

# Deploy to environment
vocat-ci deploy staging
vocat-ci deploy production

# Check workflow status
vocat-ci status

# Cancel running workflow
vocat-ci cancel
```

## Configuration

Set up GitHub token:
```bash
export GITHUB_TOKEN=your_token
```

Or configure in `~/.vocat/config.json`:
```json
{
  "github": {
    "token": "your_token",
    "owner": "your-username",
    "repo": "your-repo"
  }
}
```

## License

MIT
