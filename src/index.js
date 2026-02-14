#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');

class VoCATCLI {
  constructor() {
    this.config = this.loadConfig();
    this.token = this.config.github?.token || process.env.GITHUB_TOKEN;
    this.owner = this.config.github?.owner || '';
    this.repo = this.config.github?.repo || '';
  }

  loadConfig() {
    const configPath = path.join(process.env.HOME, '.vocat', 'config.json');
    try {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
    } catch (e) {}
    return {};
  }

  async speak(text) {
    try {
      await execPromise(`say "${text}"`);
    } catch (e) {}
  }

  async runWorkflow(workflow, ref = 'main') {
    if (!this.token) {
      console.error('❌ GitHub token not configured');
      return;
    }

    try {
      await axios.post(
        `https://api.github.com/repos/${this.owner}/${this.repo}/actions/workflows/${workflow}/dispatches`,
        { ref },
        { headers: { Authorization: `token ${this.token}` } }
      );
      console.log(`✅ Triggered workflow: ${workflow}`);
      await this.speak(`Triggered ${workflow}`);
    } catch (e) {
      console.error('❌ Error:', e.response?.data?.message || e.message);
    }
  }

  async listWorkflows() {
    if (!this.token) {
      console.error('❌ GitHub token not configured');
      return;
    }

    try {
      const { data } = await axios.get(
        `https://api.github.com/repos/${this.owner}/${this.repo}/actions/workflows`,
        { headers: { Authorization: `token ${this.token}` } }
      );
      
      console.log('📋 Available Workflows:');
      data.workflows.forEach(w => {
        console.log(`  - ${w.name} (${w.state})`);
      });
    } catch (e) {
      console.error('❌ Error:', e.message);
    }
  }

  async checkStatus() {
    if (!this.token) {
      console.error('❌ GitHub token not configured');
      return;
    }

    try {
      const { data } = await axios.get(
        `https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs?per_page=5`,
        { headers: { Authorization: `token ${this.token}` } }
      );
      
      console.log('📊 Recent Workflow Runs:');
      data.workflow_runs.forEach(r => {
        const status = r.conclusion || r.status;
        console.log(`  - ${r.name}: ${status} (${new Date(r.created_at).toLocaleString()})`);
      });
    } catch (e) {
      console.error('❌ Error:', e.message);
    }
  }

  async deploy(env) {
    const workflows = {
      staging: 'deploy-staging.yml',
      production: 'deploy-production.yml'
    };
    
    const workflow = workflows[env];
    if (workflow) {
      await this.runWorkflow(workflow);
    } else {
      console.error(`❌ Unknown environment: ${env}`);
    }
  }

  async run(args) {
    const cmd = args[0];
    
    console.log(`🎙️ VoCAT-CLI: ${cmd}`);
    await this.speak(`${cmd} command`);

    switch (cmd) {
      case 'run':
        await this.runWorkflow(args[1] || 'test');
        break;
      case 'deploy':
        await this.deploy(args[1]);
        break;
      case 'status':
        await this.checkStatus();
        break;
      case 'list':
        await this.listWorkflows();
        break;
      default:
        console.log(`
🎙️ VoCAT-CLI - GitHub Actions Manager

Usage: vocat-ci <command>

Commands:
  vocat-ci run <workflow>   Trigger a workflow
  vocat-ci deploy <env>     Deploy to environment
  vocat-ci status          Check workflow status
  vocat-ci list            List available workflows

Setup:
  export GITHUB_TOKEN=your_token
  export GITHUB_OWNER=your-username
  export GITHUB_REPO=your-repo
        `);
    }
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const cli = new VoCATCLI();
  cli.run(args).catch(console.error);
}

module.exports = { VoCATCLI };
