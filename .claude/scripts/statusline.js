#!/usr/bin/env node

// Status line: Model | Context % | Context used/available | Lines +/- | Block time
const input = JSON.parse(require('fs').readFileSync(0, 'utf-8'));

const modelName = input.model?.display_name || input.modelName || 'Unknown';
const tokenPercent = input.tokenUsagePercent || 0;
const tokensUsed = input.tokensUsed || 0;
const tokensAvailable = input.tokensAvailable || 200000;
const linesAdded = input.cost?.total_lines_added || 0;
const linesRemoved = input.cost?.total_lines_removed || 0;
const blockTimeLeft = input.blockTimeLeft || '';

// Color codes
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const blue = '\x1b[34m';
const gray = '\x1b[90m';
const reset = '\x1b[0m';

// Choose color based on token usage
let tokenColor = green;
if (tokenPercent > 70) tokenColor = red;
else if (tokenPercent > 40) tokenColor = yellow;

// Format numbers with commas
const formatNum = (num) => num.toLocaleString();

// Build status line
let status = `🤖 ${modelName}`;
status += ` | ${tokenColor}${tokenPercent}%${reset}`;
status += ` | ${gray}${formatNum(tokensUsed)} / ${formatNum(tokensAvailable)}${reset}`;

if (linesAdded > 0 || linesRemoved > 0) {
  status += ` | ${green}+${linesAdded}${reset} ${red}-${linesRemoved}${reset}`;
}

if (blockTimeLeft) {
  status += ` | ⏱ ${blockTimeLeft}`;
}

console.log(status);
