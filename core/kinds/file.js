// File kind implementation

/**
 * Convert file kind to markup
 * @param {Object} config - The file component configuration
 * @param {string} cardKey - The card key for the component
 * @returns {string} - The generated markup
 */
function fileToMarkup(config, cardKey) {
  const { 
    title, 
    description, 
    accept = 'image/*', 
    multiple = false, 
    maxSize,
    preview = true 
  } = config;

  let markup = `<x file ${cardKey}>
<!-- ANX Component: file -->
`;

  if (title) {
    markup += `**${title}:**
`;
  }

  if (description) {
    markup += `${description}
`;
  }

  markup += `</x>
`;
  return markup;
}

/**
 * Convert file kind to node structure
 * @param {Object} config - The file component configuration
 * @param {string} cardKey - The card key for the component
 * @returns {Object} - The generated node structure
 */
function fileToNode(config, cardKey) {
  return {
    cardKey,
    config,
    type: 'file',
    nodes: []
  };
}

module.exports = {
  fileToMarkup,
  fileToNode
};
