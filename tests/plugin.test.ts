import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..');

describe('Plugin Structure', () => {
  describe('plugin.json', () => {
    const pluginJsonPath = join(ROOT, '.claude-plugin', 'plugin.json');

    it('exists at .claude-plugin/plugin.json', () => {
      expect(existsSync(pluginJsonPath)).toBe(true);
    });

    it('is valid JSON', () => {
      const content = readFileSync(pluginJsonPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('has required fields', () => {
      const plugin = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));
      expect(plugin.name).toBe('sf-browser-control');
      expect(plugin.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(plugin.description).toBeDefined();
    });

    it('references valid paths', () => {
      const plugin = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));

      if (plugin.commands) {
        const commandsPath = join(ROOT, plugin.commands.replace('./', ''));
        expect(existsSync(commandsPath)).toBe(true);
      }

      if (plugin.skills) {
        const skillsPath = join(ROOT, plugin.skills.replace('./', ''));
        expect(existsSync(skillsPath)).toBe(true);
      }

      if (plugin.mcpServers) {
        const mcpPath = join(ROOT, plugin.mcpServers.replace('./', ''));
        expect(existsSync(mcpPath)).toBe(true);
      }
    });
  });

  describe('.mcp.json', () => {
    const mcpJsonPath = join(ROOT, '.mcp.json');

    it('exists', () => {
      expect(existsSync(mcpJsonPath)).toBe(true);
    });

    it('is valid JSON', () => {
      const content = readFileSync(mcpJsonPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('has mcpServers defined', () => {
      const mcp = JSON.parse(readFileSync(mcpJsonPath, 'utf-8'));
      expect(mcp.mcpServers).toBeDefined();
      expect(mcp.mcpServers['sf-browser-control']).toBeDefined();
    });

    it('uses CLAUDE_PLUGIN_ROOT for paths', () => {
      const content = readFileSync(mcpJsonPath, 'utf-8');
      expect(content).toContain('${CLAUDE_PLUGIN_ROOT}');
    });
  });

  describe('Commands', () => {
    const commandsDir = join(ROOT, 'commands');

    it('commands directory exists', () => {
      expect(existsSync(commandsDir)).toBe(true);
    });

    const commands = ['start-session.md', 'create-record.md', 'setup-navigation.md'];

    commands.forEach(cmd => {
      it(`${cmd} exists and has frontmatter`, () => {
        const cmdPath = join(commandsDir, cmd);
        expect(existsSync(cmdPath)).toBe(true);

        const content = readFileSync(cmdPath, 'utf-8');
        expect(content).toMatch(/^---\n/);
        expect(content).toMatch(/description:/);
      });
    });
  });

  describe('Skills', () => {
    const skillPath = join(ROOT, 'skills', 'sf-automation', 'SKILL.md');

    it('SKILL.md exists', () => {
      expect(existsSync(skillPath)).toBe(true);
    });

    it('has required frontmatter', () => {
      const content = readFileSync(skillPath, 'utf-8');
      expect(content).toMatch(/^---\n/);
      expect(content).toMatch(/name:/);
      expect(content).toMatch(/description:/);
    });
  });

  describe('Directory structure', () => {
    it('no components inside .claude-plugin/', () => {
      // Components should be at root, not inside .claude-plugin/
      expect(existsSync(join(ROOT, '.claude-plugin', 'commands'))).toBe(false);
      expect(existsSync(join(ROOT, '.claude-plugin', 'skills'))).toBe(false);
      expect(existsSync(join(ROOT, '.claude-plugin', 'agents'))).toBe(false);
    });
  });
});
