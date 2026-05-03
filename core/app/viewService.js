const { getPageWithNodes } = require('./pageManager');
const { getNode } = require('./node');
const { generateNodeVisualization, generateVisualizationCSS } = require('../../view/index.js');

async function getPageView(uuid_page) {
  if (!uuid_page || !uuid_page.trim()) {
    throw new Error('uuid_page is required');
  }

  const existingPage = getPageWithNodes(uuid_page);
  if (!existingPage || !existingPage.nodes) {
    throw new Error('Page not found or has no nodes');
  }

  const nodesStructure = JSON.parse(JSON.stringify(existingPage.nodes));

  if (nodesStructure.config && nodesStructure.config.kind === 'form' && 
      nodesStructure.data && nodesStructure.data.value && 
      nodesStructure.nodes && nodesStructure.nodes.length > 0) {
    const formData = nodesStructure.data.value;
    nodesStructure.nodes.forEach(fieldNode => {
      const fieldNick = fieldNode.config && fieldNode.config.nick;
      if (fieldNick && formData[fieldNick] !== undefined) {
        fieldNode.data = fieldNode.data || {};
        fieldNode.data.value = formData[fieldNick];
      }
    });
  }

  function loadNodeData(node) {
    const storedNode = getNode(node.cardKey);
    if (storedNode && storedNode.data) {
      node.data = { ...storedNode.data };
    }
    if (node.nodes && node.nodes.length > 0) {
      node.nodes.forEach(childNode => loadNodeData(childNode));
    }
  }
  loadNodeData(nodesStructure);

  const html = generateNodeVisualization(nodesStructure);
  const css = generateVisualizationCSS();

  return {
    html,
    css,
    uuid_page: uuid_page
  };
}

module.exports = {
  getPageView
};
