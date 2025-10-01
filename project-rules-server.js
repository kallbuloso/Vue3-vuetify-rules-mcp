#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rulesPath = path.join(process.cwd(), '.vscode', 'rules.json');
let projectRules = {};

try {
  if (fs.existsSync(rulesPath)) {
    projectRules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  }
} catch (error) {
  console.error(JSON.stringify({
    jsonrpc: '2.0',
    id: null,
    error: {
      code: -32001,
      message: 'Failed to read rules.json',
      data: error.message
    }
  }));
}

const ruleSections = projectRules.projectRules || {};

const sectionMap = {
  general: 'generalConventions',
  backend: 'backendLaravel',
  frontend: 'inertiaVue',
  styling: 'vuetifyStyling',
  'data-display': 'dataDisplayPatterns',
  'file-creation': 'fileCreationGuidelines',
  workflows: 'workflows'
};

function getSectionRules(sectionKey) {
  const section = ruleSections[sectionKey];
  if (!section) {
    return [];
  }
  return Array.isArray(section.rules) ? section.rules : [];
}

function getQuickPrompt() {
  return ruleSections.quickPrompt?.prompt ??
    'Follow project rules: tenant-aware Laravel services, Vue 3 <script setup>, Vuetify utilities only, extend existing components.';
}

function buildRulesContent(section) {
  if (section === 'all') {
    return Object.entries(sectionMap)
      .map(([key, value]) => {
        const rules = getSectionRules(value);
        if (!rules.length) return '';
        return `\n## ${ruleSections[value]?.title || key.toUpperCase()}\n${rules.map(r => `- ${r}`).join('\n')}`;
      })
      .filter(Boolean)
      .join('\n');
  }

  const mappedKey = sectionMap[section];
  if (!mappedKey) {
    return '';
  }
  const sectionMeta = ruleSections[mappedKey];
  const rules = getSectionRules(mappedKey);
  if (!rules.length) {
    return '';
  }
  return `\n## ${sectionMeta?.title || section.toUpperCase()}\n${rules.map(r => `- ${r}`).join('\n')}`;
}

function validateCode(code, type = 'vue') {
  const violations = [];

  if (type === 'vue') {
    if (code.includes('export default {') && !code.includes('<script setup')) {
      violations.push('Avoid Options API. Use <script setup> with Composition API.');
    }

    if (code.includes('<style') && !code.includes('lang="scss"') && !code.includes("lang='scss'")) {
      violations.push('Move styling to Vuetify utilities instead of custom CSS.');
    }

    const vuetifyClassPattern = /class=["']([^"']*)(ma-|pa-|mt-|pt-|ml-|pl-|mr-|pr-|mb-|pb-|d-|text-|primary|secondary|success|error|elevation-)/;
    if (code.includes('class=') && !vuetifyClassPattern.test(code)) {
      violations.push('Use Vuetify utility classes for spacing, layout, colors, and elevation.');
    }
  }

  return violations;
}

function jsonResponse(payload) {
  console.log(JSON.stringify(payload));
}

process.stdin.on('data', (data) => {
  try {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      const request = JSON.parse(line);

      if (request.method === 'initialize') {
        jsonResponse({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'project-rules',
              version: '3.0.0',
              description: 'Project rules and validation for Laravel + Inertia + Vue'
            }
          }
        });
        continue;
      }

      if (request.method === 'tools/list') {
        jsonResponse({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: [
              {
                name: 'get_project_rules',
                description: 'Retrieve project rule sections',
                inputSchema: {
                  type: 'object',
                  properties: {
                    section: {
                      type: 'string',
                      description: 'Section key (general, backend, frontend, styling, data-display, file-creation, workflows, all)',
                      enum: [...Object.keys(sectionMap), 'all']
                    }
                  }
                }
              },
              {
                name: 'validate_code',
                description: 'Validate code against key project rules',
                inputSchema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', description: 'Code snippet to validate' },
                    type: { type: 'string', description: 'Code type', enum: ['vue', 'js', 'ts'], default: 'vue' }
                  },
                  required: ['code']
                }
              },
              {
                name: 'get_quick_prompt',
                description: 'Return the quick prompt text for chats',
                inputSchema: { type: 'object', properties: {} }
              }
            ]
          }
        });
        continue;
      }

      if (request.method === 'tools/call') {
        const toolName = request.params?.name;
        let responseContent = '';

        if (toolName === 'get_project_rules') {
          const section = request.params?.arguments?.section || 'all';
          responseContent = buildRulesContent(section) || 'No rules found for the requested section.';
        } else if (toolName === 'validate_code') {
          const code = request.params?.arguments?.code || '';
          const codeType = request.params?.arguments?.type || 'vue';
          const violations = validateCode(code, codeType);

          if (violations.length === 0) {
            responseContent = 'Code follows the main project rules.';
          } else {
            responseContent = ['Issues detected:'].concat(violations.map(v => `- ${v}`)).join('\n');
          }

          responseContent += '\n\nQuick fixes:\n- Use <script setup> and Composition API\n- Replace custom CSS with Vuetify utility classes\n- Extend existing components via props/slots instead of duplicating files';
        } else if (toolName === 'get_quick_prompt') {
          responseContent = getQuickPrompt();
        } else {
          jsonResponse({
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32601, message: 'Method not found' }
          });
          continue;
        }

        jsonResponse({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: responseContent
              }
            ]
          }
        });
      }
    }
  } catch (error) {
    jsonResponse({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error',
        data: error.message
      }
    });
  }
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
