#!/usr/bin/env node
// Session-start hook for Gemini CLI Superpowers extension
// Injects Superpowers context at session start

const fs = require('fs');
const path = require('path');

try {
    // Read stdin (Gemini CLI passes event data)
    const input = JSON.parse(fs.readFileSync(0, 'utf-8') || '{}');
    
    // Read the Superpowers context block from GEMINI.md
    const geminiMdPath = path.join(__dirname, '..', 'GEMINI.md');
    let geminiContent = '';
    if (fs.existsSync(geminiMdPath)) {
        geminiContent = fs.readFileSync(geminiMdPath, 'utf-8');
        // Extract the context block between markers
        const startMarker = '<!-- SUPERPOWERS-CONTEXT-START -->';
        const endMarker = '<!-- SUPERPOWERS-CONTEXT-END -->';
        const startIdx = geminiContent.indexOf(startMarker);
        const endIdx = geminiContent.indexOf(endMarker);
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            geminiContent = geminiContent.substring(startIdx + startMarker.length, endIdx).trim();
        }
    }
    
    // Construct additional context message
    const additionalContext = `🔋 **Superpowers Activated**\n\nYou have Superpowers skills installed. ${geminiContent ? '\n\n' + geminiContent : 'Use /skills list to see available skills.'}\n\n**Remember**: Gemini CLI treats skill context as advisory. For reliable skill activation, explicitly mention skill names (e.g., "use brainstorming skill").`;
    
    // Output JSON for Gemini CLI hook system
    console.log(JSON.stringify({
        additionalContext,
        // Include the raw context block for possible injection
        superpowersContext: geminiContent
    }));
    
} catch (error) {
    console.error(`[Superpowers session-start hook error] ${error.message}`);
    // Output empty result to continue normally
    console.log(JSON.stringify({}));
}