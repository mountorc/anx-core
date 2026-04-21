function generateCardKey() {
  return 'card_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

function anxToNodes(anxContent) {
  const result = {
    cardKey: anxContent?.cardKey || generateCardKey(),
    config: {},
    data: {},
    logs: [],
    nodes: []
  };

  if (!anxContent || typeof anxContent !== 'object') {
    return result;
  }

  if (anxContent.kind) {
    result.config = { ...anxContent };
  }

  if (anxContent.value !== undefined) {
    result.data.value = anxContent.value;
  }

  if ((anxContent.kind === 'box' || anxContent.kind === 'table' || anxContent.kind === 'list') && anxContent.data) {
    result.data.data = anxContent.data;
  }

  if (anxContent.kinds && Array.isArray(anxContent.kinds)) {
    result.nodes = anxContent.kinds.map(child => {
      const childNode = {
        cardKey: child?.cardKey || generateCardKey(),
        config: { ...child },
        data: {},
        logs: [],
        nodes: []
      };

      if (child.value !== undefined) {
        childNode.data.value = child.value;
      }

      if ((child.kind === 'box' || child.kind === 'table') && child.data) {
        childNode.data.data = child.data;
      }

      if (child.kinds && Array.isArray(child.kinds)) {
        childNode.nodes = child.kinds.map(grandchild => {
          const grandchildNode = {
            cardKey: grandchild?.cardKey || generateCardKey(),
            config: { ...grandchild },
            data: {},
            logs: [],
            nodes: []
          };

          if (grandchild.value !== undefined) {
            grandchildNode.data.value = grandchild.value;
          }

          if ((grandchild.kind === 'box' || grandchild.kind === 'table') && grandchild.data) {
            grandchildNode.data.data = grandchild.data;
          }

          return grandchildNode;
        });
      }

      return childNode;
    });
  }

  return result;
}

module.exports = {
  anxToNodes,
  generateCardKey
};