#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the rules once at startup
const rulesPath = path.join(process.cwd(), '.vscode', 'rules.json');
let projectRules = {};

if (fs.existsSync(rulesPath)) {
  projectRules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
}

// Enhanced rule extraction functions
function getQuickPrompt() {
  return projectRules.projectRules?.quickReferencePrompt?.prompt || 
    "🚨 CRITICAL PROJECT RULES: Use Vue 3 Composition API only, Vuetify utilities for styling, extend existing components.";
}

function getVue3Rules() {
  const vue3Dev = projectRules.projectRules?.vue3Development?.rules || [];
  return vue3Dev.reduce((acc, category) => {
    acc[category.category] = category.rules;
    return acc;
  }, {});
}

function getStylingRules() {
  const vue3Rules = getVue3Rules();
  return vue3Rules["Styling and CSS Guidelines"] || [];
}

function getCompositionApiRules() {
  const vue3Rules = getVue3Rules();
  return vue3Rules["Composition API"] || [];
}

function getReusabilityRules() {
  const vue3Rules = getVue3Rules();
  return vue3Rules["Reusable Techniques"] || [];
}

function getCodeExamples() {
  return projectRules.projectRules?.codeExamples || {};
}

function validateCode(code, type = 'vue') {
  const violations = [];
  
  if (type === 'vue') {
    // Check for Options API usage
    if (code.includes('export default {') && !code.includes('<script setup>')) {
      violations.push("❌ Using Options API instead of Composition API");
    }
    
    // Check for custom CSS
    if (code.includes('<style') && (code.includes('scoped') || code.includes('module'))) {
      violations.push("❌ Using custom CSS instead of Vuetify utilities");
    }
    
    // Check for proper Vuetify classes
    const hasVuetifyClasses = /class=['"][^'"]*(?:ma-|pa-|mt-|pt-|ml-|pl-|mr-|pr-|mb-|pb-|d-|text-|primary|secondary|success|error|elevation-)/;
    if (code.includes('class=') && !hasVuetifyClasses.test(code)) {
      violations.push("⚠️ Consider using Vuetify utility classes for styling");
    }
  }
  
  return violations;
}

// MCP Protocol handler
process.stdin.on('data', (data) => {
  try {
    const lines = data.toString().trim().split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const request = JSON.parse(line);
      
      if (request.method === 'initialize') {
        const response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "project-rules",
              version: "2.0.0",
              description: "Vue 3 + Vuetify project rules and code validation"
            }
          }
        };
        console.log(JSON.stringify(response));
        
      } else if (request.method === 'tools/list') {
        const response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: [
              {
                name: "get_project_rules",
                description: "Get Vue 3 + Vuetify project development rules and guidelines",
                inputSchema: {
                  type: "object",
                  properties: {
                    section: {
                      type: "string",
                      description: "Specific section to retrieve (composition-api, styling, reusability, all)",
                      enum: ["composition-api", "styling", "reusability", "examples", "all"]
                    }
                  }
                }
              },
              {
                name: "validate_code",
                description: "Validate code against project rules and provide suggestions",
                inputSchema: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                      description: "The code to validate"
                    },
                    type: {
                      type: "string",
                      description: "Type of code (vue, css, js)",
                      enum: ["vue", "css", "js"],
                      default: "vue"
                    }
                  },
                  required: ["code"]
                }
              },
              {
                name: "get_quick_prompt",
                description: "Get the quick reference prompt for immediate use",
                inputSchema: {
                  type: "object",
                  properties: {}
                }
              }
            ]
          }
        };
        console.log(JSON.stringify(response));
        
      } else if (request.method === 'tools/call') {
        let response;
        
        switch (request.params?.name) {
          case 'get_project_rules':
            const section = request.params?.arguments?.section || 'all';
            let content = '';
            
            if (section === 'all' || section === 'composition-api') {
              content += `\n## COMPOSITION API RULES:\n${getCompositionApiRules().map(r => `• ${r}`).join('\n')}`;
            }
            
            if (section === 'all' || section === 'styling') {
              content += `\n\n## STYLING RULES (Vuetify Only):\n${getStylingRules().map(r => `• ${r}`).join('\n')}`;
            }
            
            if (section === 'all' || section === 'reusability') {
              content += `\n\n## REUSABILITY TECHNIQUES:\n${getReusabilityRules().map(r => `• ${r}`).join('\n')}`;
            }
            
            if (section === 'examples') {
              const examples = getCodeExamples();
              content += `\n\n## CODE EXAMPLES:\n`;
              Object.entries(examples).forEach(([key, example]) => {
                content += `\n### ${key}:\n${example.description}\n`;
                if (example.good) content += `✅ GOOD:\n\`\`\`\n${example.good}\n\`\`\`\n`;
                if (example.bad) content += `❌ BAD:\n\`\`\`\n${example.bad}\n\`\`\`\n`;
                if (example.code) content += `\`\`\`\n${example.code}\n\`\`\`\n`;
              });
            }
            
            response = {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                content: [{
                  type: "text",
                  text: content || "No rules found for the specified section."
                }]
              }
            };
            break;
            
          case 'validate_code':
            const code = request.params?.arguments?.code || '';
            const codeType = request.params?.arguments?.type || 'vue';
            const violations = validateCode(code, codeType);
            
            let validationResult = `## CODE VALIDATION RESULTS:\n\n`;
            
            if (violations.length === 0) {
              validationResult += `✅ **Code follows project rules!**\n\n`;
            } else {
              validationResult += `**Issues found:**\n${violations.map(v => `${v}`).join('\n')}\n\n`;
            }
            
            validationResult += `**Quick fixes:**\n`;
            validationResult += `• Use \`<script setup>\` instead of Options API\n`;
            validationResult += `• Replace custom CSS with Vuetify classes: \`ma-4\`, \`pa-2\`, \`text-h5\`, etc.\n`;
            validationResult += `• Extend existing components with props instead of creating new files\n`;
            
            response = {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                content: [{
                  type: "text",
                  text: validationResult
                }]
              }
            };
            break;
            
          case 'get_quick_prompt':
            response = {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                content: [{
                  type: "text",
                  text: getQuickPrompt()
                }]
              }
            };
            break;
            
          default:
            response = {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32601,
                message: "Method not found"
              }
            };
        }
        
        console.log(JSON.stringify(response));
      }
    }
  } catch (error) {
    const errorResponse = {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error",
        data: error.message
      }
    };
    console.log(JSON.stringify(errorResponse));
  }
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
