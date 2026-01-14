import { sessionTools } from './session.tools.js';
import { navigationTools } from './navigation.tools.js';
import { interactionTools } from './interaction.tools.js';
import { recordTools } from './record.tools.js';
import { setupTools } from './setup.tools.js';
import { captureTools } from './capture.tools.js';

// Export all tool definitions
export const allTools = [
  ...sessionTools,
  ...navigationTools,
  ...interactionTools,
  ...recordTools,
  ...setupTools,
  ...captureTools,
];

// Export individual tool groups
export {
  sessionTools,
  navigationTools,
  interactionTools,
  recordTools,
  setupTools,
  captureTools,
};

// Tool count for reference
export const toolCount = allTools.length;
