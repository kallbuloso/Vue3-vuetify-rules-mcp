# Project Rules Integration Guide

## Overview
This guide explains how to use your `rules.json` file as extension prompts for AI agents in VS Code.

## Method 1: Quick Copy-Paste (Immediate Use)

**Copy this prompt to start any AI conversation:**

```
# IMPORTANT
follow rules.json for coding practices setup by me.

🚨 CRITICAL PROJECT RULES for Vue 3 + Vuetify:

1. ❌ NO PURE CSS - Only Vuetify utility classes
2. ✅ Use <script setup> - Never Options API
3. ✅ Extend existing components - Don't create new files
4. ✅ Use Vuetify spacing: ma-4, pa-2, mt-3
5. ✅ Use Vuetify colors: primary, secondary, success
6. ✅ Use Vuetify typography: text-h1, text-body-1
7. ✅ Use Vuetify layout: d-flex, justify-center, align-center
8. ✅ Use props + slots for component variations

ALWAYS follow these rules strictly!
```

## Method 2: Context Attachment (MCP Extensions)

### For GitHub Copilot with MCP:
1. Open GitHub Copilot Chat
2. Click the 📎 (paperclip) icon
3. Select `.vscode/rules.json`
4. Your rules are now in context for the entire conversation

### For other MCP-enabled extensions:
- **Claude for VS Code**: Auto-includes context files listed in settings
- **Codeium**: Can reference workspace files
- **Custom MCP clients**: Read from `aiAssistant.contextFiles` setting

### Usage Examples:
```
"Apply my styling guidelines to this component"
"Refactor this using my composition API rules"
"Check this code against my project standards"
```

## Method 3: VS Code Settings Integration

### What's Configured:
- **System Prompt**: Automatic rules injection for GitHub Copilot
- **Welcome Message**: Sets expectations when chat opens
- **Context Files**: Auto-includes rules.json
- **Custom Shortcuts**: Quick commands for specific rule categories
- **File Associations**: Better AI understanding of project structure

### How to Use:
1. **Automatic**: Every GitHub Copilot conversation starts with your rules
2. **Manual Commands**:
   - Type `/rules` → Apply all project rules
   - Type `/style` → Convert CSS to Vuetify utilities
   - Type `/extend` → Suggest component extensions instead of new files

### GitHub Copilot Integration:
```json
{
  "github.copilot.chat.systemPrompt": "Your rules here...",
  "github.copilot.chat.welcomeMessage": "Ready to help with Vue 3 + Vuetify...",
  "aiAssistant.contextFiles": [".vscode/rules.json"]
}
```

## Method 4: Custom MCP Tool

### Available Tools:
1. **`get_project_rules`** - Retrieve specific rule sections
2. **`validate_code`** - Check code against project standards
3. **`get_quick_prompt`** - Get the quick reference prompt

### Usage Examples:

#### Get Specific Rules:
```javascript
// Get only styling rules
get_project_rules({ section: "styling" })

// Get composition API rules
get_project_rules({ section: "composition-api" })

// Get code examples
get_project_rules({ section: "examples" })
```

#### Validate Code:
```javascript
// Validate Vue component
validate_code({ 
  code: `<template>...</template>`, 
  type: "vue" 
})
```

#### Quick Prompt:
```javascript
// Get ready-to-use prompt
get_quick_prompt()
```

### MCP Server Features:
- **Rule Parsing**: Extracts specific sections from rules.json
- **Code Validation**: Checks for common violations
- **Smart Suggestions**: Provides quick fixes
- **Example Code**: Shows good vs. bad patterns

## Practical Workflow

### Starting a New Feature:
1. **Begin with prompt**: Use Method 1 quick prompt
2. **Attach context**: Include rules.json file (Method 2)
3. **Validate as you go**: Use MCP tools to check code (Method 4)

### Refactoring Existing Code:
1. **Load context**: Rules are auto-applied via settings (Method 3)
2. **Ask for validation**: "Check this against my project rules"
3. **Get specific guidance**: "Apply my styling rules to convert this CSS"

### Code Review:
1. **Use validation tool**: Check code against all rules
2. **Get suggestions**: Ask for specific improvements
3. **Apply patterns**: Reference code examples from rules

## Troubleshooting

### MCP Server Issues:
- **"Server exited before responding"**: Restart VS Code after MCP changes
- **Tool not found**: Check mcp.json syntax and server path
- **Rules not loading**: Verify rules.json path and syntax

### Settings Not Working:
- **Copilot not following rules**: Check systemPrompt setting
- **Context not included**: Verify contextFiles array
- **Shortcuts not working**: Ensure proper JSON formatting

### Best Practices:
- **Keep rules updated**: Modify rules.json as project evolves
- **Test configurations**: Restart VS Code after changes
- **Use specific requests**: Reference exact rule sections for better results
- **Combine methods**: Use multiple approaches for comprehensive coverage

## Quick Commands Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `/rules` | Apply all project rules | "Refactor this component /rules" |
| `/style` | Convert to Vuetify utilities | "Fix this CSS /style" |
| `/extend` | Suggest component extension | "Make this reusable /extend" |
| `/validate` | Check against standards | "Review this code /validate" |

## File Structure
```
.vscode/
├── mcp.json                    # MCP server configuration
├── settings.json               # VS Code settings with AI integration
├── rules.json                  # Your project rules
└── project-rules-server.js     # Custom MCP tool
```

This setup ensures your Vue 3 + Vuetify development guidelines are consistently applied across all AI interactions in VS Code.

use the rules.json for your rule references: