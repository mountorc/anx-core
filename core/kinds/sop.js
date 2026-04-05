/**
 * SOP (Standard Operating Procedure) Component Converter
 * Handles workflow steps with sources, targets, and execution semantics
 */

/**
 * Convert SOP component to Markup
 * @param {Object} config - SOP configuration
 * @param {Object} data - Current step data
 * @param {string} uuidSop - SOP UUID
 * @returns {string} - Rendered markup
 */
function convertSopToMarkup(config, data = {}, uuidSop) {
  const title = config.title || 'SOP Workflow';
  const steps = config.steps || [];
  
  // Generate card key if not provided
  const cardKey = uuidSop || 'card_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  
  // Get current step info from data
  const currentStepUuid = data.currentStepUuid;
  const claimedStepUuid = data.claimedStepUuid;
  const nextStepUuid = data.nextStepUuid;
  const completedSteps = data.completedSteps || [];
  
  // Find steps by UUID
  const currentStep = steps.find(s => s.uuid === currentStepUuid);
  const claimedStep = steps.find(s => s.uuid === claimedStepUuid);
  let nextStep = steps.find(s => s.uuid === nextStepUuid);
  
  // If no next step specified, find it based on completed steps
  if (!nextStep) {
    nextStep = steps.find(s => {
      if (completedSteps.includes(s.uuid) || s.uuid === claimedStepUuid) {
        return false;
      }
      if (s.sources && s.sources.length > 0) {
        const sourcesJoin = s.sources_join || 'all';
        if (sourcesJoin === 'all') {
          return s.sources.every(src => completedSteps.includes(src));
        } else {
          return s.sources.some(src => completedSteps.includes(src));
        }
      }
      return s.start === true;
    });
  }
  
  let content = '';
  
  // Render workflow header
  content += `## ${title}\n\n`;
  
  // If we have state data, render current/claimed/next steps
  if (claimedStep || nextStep) {
    // Render current claimed step (in progress)
    if (claimedStep) {
      content += renderStep(claimedStep, 'claimed', data);
    }
    
    // Render next step (to be claimed)
    if (nextStep) {
      content += renderStep(nextStep, 'next', data);
    }
    
    // Render claim button for next step
    if (nextStep && uuidSop) {
      content += renderClaimButton(uuidSop, nextStep.uuid);
    }
  } else {
    // No state data - render all steps as overview
    content += `### Workflow Steps (${steps.length} total)\n\n`;
    steps.forEach((step, index) => {
      const stepNick = step.nick || step.uuid;
      const isStart = step.start ? ' (Start)' : '';
      const hasApproval = step.approvalRequired ? ' [Approval Required]' : '';
      content += `${index + 1}. **${stepNick}**${isStart}${hasApproval}\n`;
      if (step.action) {
        content += `   - Action: ${step.action}\n`;
      }
      if (step.sources && step.sources.length > 0) {
        content += `   - Dependencies: ${step.sources.join(', ')}\n`;
      }
    });
  }
  
  return `<x sop card_${cardKey}>\n${content}</x>`;
}

/**
 * Render a single step
 * @param {Object} step - Step configuration
 * @param {string} status - Step status (claimed, next, completed)
 * @param {Object} data - Step data
 * @returns {string} - Step markup
 */
function renderStep(step, status, data) {
  const { uuid, nick, kind, items, action, sources, condition } = step;
  
  let content = '';
  const statusLabel = status === 'claimed' ? '🔄 In Progress' : 
                      status === 'next' ? '⏳ Next Step' : '✅ Completed';
  
  content += `### ${statusLabel}: ${nick || uuid}\n\n`;
  
  // Render step details based on kind
  if (kind === 'form' && items) {
    content += renderFormItems(items, data);
  } else if (action) {
    content += `**Action:** ${action}\n\n`;
  }
  
  // Render sources if any
  if (sources && sources.length > 0) {
    content += `**Dependencies:** ${sources.join(', ')}\n\n`;
  }
  
  // Render conditions if any
  if (condition && condition.length > 0) {
    content += `**Conditions:**\n`;
    condition.forEach(cond => {
      content += `- ${cond.nick} ${cond.operator} ${cond.value} → ${cond.targets.join(', ')}\n`;
    });
    content += '\n';
  }
  
  return content;
}

/**
 * Render form items
 * @param {Array} items - Form items
 * @param {Object} data - Form data
 * @returns {string} - Form items markup
 */
function renderFormItems(items, data) {
  let content = '';
  
  items.forEach(item => {
    const { nick, kind, required } = item;
    const value = data[nick] || '';
    const requiredMark = required ? '*' : '';
    
    if (kind === 'input') {
      content += `- **${nick}${requiredMark}:** ${value}\n`;
    } else if (kind === 'textarea') {
      content += `- **${nick}${requiredMark}:**\n\`\`\`\n${value}\n\`\`\`\n`;
    } else if (kind === 'options') {
      content += `- **${nick}${requiredMark}:** ${value}\n`;
    } else if (kind === 'date') {
      content += `- **${nick}${requiredMark}:** ${value}\n`;
    }
  });
  
  return content + '\n';
}

/**
 * Render claim step button
 * @param {string} uuidSop - SOP UUID
 * @param {string} stepUuid - Step UUID to claim
 * @returns {string} - Claim button markup
 */
function renderClaimButton(uuidSop, stepUuid) {
  return `<x button card_${uuidSop}_claim_${stepUuid}>\n**[Claim Step ${stepUuid}]**\n</x>\n\n`;
}

/**
 * Get current workflow state
 * Returns claimed step, next step, and completed steps
 * @param {Object} config - SOP configuration
 * @param {Object} state - Current workflow state
 * @returns {Object} - Workflow state info
 */
function getWorkflowState(config, state = {}) {
  const steps = config.steps || [];
  const completedSteps = state.completedSteps || [];
  const claimedStepUuid = state.claimedStepUuid;
  
  // Find claimed step (in progress)
  const claimedStep = steps.find(s => s.uuid === claimedStepUuid);
  
  // Find next step to claim
  // Next step should have sources pointing to completed steps
  // and not be completed or claimed
  const nextStep = steps.find(s => {
    if (completedSteps.includes(s.uuid) || s.uuid === claimedStepUuid) {
      return false;
    }
    
    // Check if all sources are completed
    if (s.sources && s.sources.length > 0) {
      const sourcesJoin = s.sources_join || 'all';
      if (sourcesJoin === 'all') {
        return s.sources.every(src => completedSteps.includes(src));
      } else {
        return s.sources.some(src => completedSteps.includes(src));
      }
    }
    
    // No sources means it's a start step
    return s.start === true;
  });
  
  return {
    claimedStep,
    nextStep,
    completedSteps: completedSteps.map(uuid => steps.find(s => s.uuid === uuid)).filter(Boolean)
  };
}

/**
 * Claim a step
 * @param {string} uuidSop - SOP UUID
 * @param {string} stepUuid - Step UUID to claim
 * @param {Object} state - Current workflow state
 * @returns {Object} - Updated workflow state
 */
function claimStep(uuidSop, stepUuid, state = {}) {
  // Check if step is already claimed or completed
  if (state.claimedStepUuid === stepUuid) {
    return { success: false, error: 'Step already claimed' };
  }
  
  if (state.completedSteps && state.completedSteps.includes(stepUuid)) {
    return { success: false, error: 'Step already completed' };
  }
  
  // Claim the step
  return {
    success: true,
    state: {
      ...state,
      claimedStepUuid: stepUuid,
      claimedAt: new Date().toISOString()
    }
  };
}

/**
 * Complete a step
 * @param {string} uuidSop - SOP UUID
 * @param {string} stepUuid - Step UUID to complete
 * @param {Object} state - Current workflow state
 * @param {Object} output - Step output data
 * @returns {Object} - Updated workflow state
 */
function completeStep(uuidSop, stepUuid, state = {}, output = {}) {
  // Check if step is claimed
  if (state.claimedStepUuid !== stepUuid) {
    return { success: false, error: 'Step not claimed' };
  }
  
  // Move from claimed to completed
  const completedSteps = [...(state.completedSteps || []), stepUuid];
  
  return {
    success: true,
    state: {
      ...state,
      claimedStepUuid: null,
      completedSteps,
      stepOutputs: {
        ...(state.stepOutputs || {}),
        [stepUuid]: output
      }
    }
  };
}

module.exports = {
  convertSopToMarkup,
  getWorkflowState,
  claimStep,
  completeStep
};
