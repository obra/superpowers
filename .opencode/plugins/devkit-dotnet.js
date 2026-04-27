/**
 * DevKit DotNet plugin for OpenCode.ai
 *
 * Extiende superpowers agregando:
 * - Skills de .NET/Blazor/DDD
 * - Agente orquestador
 * - Commands personalizados
 * - Scripts de testing
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DevKitDotNetPlugin = async ({ directory }) => {
  // Paths absolutos desde el plugin
  const skillsPath = path.resolve(__dirname, '../skills');
  const agentsPath = path.resolve(__dirname, '../agents');
  const commandsPath = path.resolve(__dirname, '../commands');
  const scriptsPath = path.resolve(__dirname, '../scripts');

  return {
    // Registrar paths adicionales después de que superpowers cargue
    config: async (config) => {
      // Skills path
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsPath)) {
        config.skills.paths.push(skillsPath);
      }

      // Agents path (para agentes markdown)
      config.agents = config.agents || { paths: [] };
      if (!config.agents.paths.includes(agentsPath)) {
        config.agents.paths.push(agentsPath);
      }

      // Commands path
      config.commands = config.commands || { paths: [] };
      if (!config.commands.paths.includes(commandsPath)) {
        config.commands.paths.push(commandsPath);
      }
    },

    // Hook para inicialización de sesión
    'session.created': async ({ client }) => {
      await client.app.log({
        body: {
          service: 'devkit-dotnet',
          level: 'info',
          message: 'DevKit DotNet plugin initialized',
          scripts_path: scriptsPath
        }
      });
    }
  };
};