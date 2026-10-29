/**
 * Custom Workflows — automation system for repetitive tasks.
 * Allows users to create, save, and execute custom workflows.
 */

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: number;
  updatedAt: number;
  executionCount: number;
}

export interface WorkflowStep {
  id: string;
  type: 'prompt' | 'tool' | 'delay' | 'condition';
  config: any;
  order: number;
}

export interface PromptStep {
  prompt: string;
  waitForCompletion: boolean;
}

export interface ToolStep {
  tool: string;
  arguments: Record<string, any>;
}

export interface DelayStep {
  duration: number; // milliseconds
}

export interface ConditionStep {
  condition: string;
  trueSteps: WorkflowStep[];
  falseSteps: WorkflowStep[];
}

const WORKFLOWS_KEY = 'rsb-workflows';

/* ─── Workflow Storage ─── */
export function loadWorkflows(): Workflow[] {
  try {
    const raw = localStorage.getItem(WORKFLOWS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load workflows:', e);
  }
  return [];
}

export function saveWorkflows(workflows: Workflow[]): void {
  try {
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
  } catch (e) {
    console.warn('Failed to save workflows:', e);
  }
}

export function createWorkflow(name: string, description: string): Workflow {
  const workflow: Workflow = {
    id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    steps: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    executionCount: 0,
  };
  
  const workflows = loadWorkflows();
  workflows.push(workflow);
  saveWorkflows(workflows);
  
  return workflow;
}

export function updateWorkflow(workflow: Workflow): void {
  const workflows = loadWorkflows();
  const index = workflows.findIndex(w => w.id === workflow.id);
  
  if (index !== -1) {
    workflows[index] = { ...workflow, updatedAt: Date.now() };
    saveWorkflows(workflows);
  }
}

export function deleteWorkflow(id: string): void {
  const workflows = loadWorkflows().filter(w => w.id !== id);
  saveWorkflows(workflows);
}

export function incrementExecutionCount(id: string): void {
  const workflows = loadWorkflows();
  const workflow = workflows.find(w => w.id === id);
  
  if (workflow) {
    workflow.executionCount += 1;
    saveWorkflows(workflows);
  }
}

export function addStep(workflowId: string, step: Omit<WorkflowStep, 'id'>): WorkflowStep {
  const workflows = loadWorkflows();
  const workflow = workflows.find(w => w.id === workflowId);
  
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }
  
  const newStep: WorkflowStep = {
    ...step,
    id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  
  workflow.steps.push(newStep);
  workflow.steps.sort((a, b) => a.order - b.order);
  workflow.updatedAt = Date.now();
  
  saveWorkflows(workflows);
  
  return newStep;
}

export function removeStep(workflowId: string, stepId: string): void {
  const workflows = loadWorkflows();
  const workflow = workflows.find(w => w.id === workflowId);
  
  if (workflow) {
    workflow.steps = workflow.steps.filter(s => s.id !== stepId);
    workflow.updatedAt = Date.now();
    saveWorkflows(workflows);
  }
}

export function reorderSteps(workflowId: string, stepIds: string[]): void {
  const workflows = loadWorkflows();
  const workflow = workflows.find(w => w.id === workflowId);
  
  if (workflow) {
    workflow.steps = stepIds.map((id, index) => {
      const step = workflow.steps.find(s => s.id === id);
      return step ? { ...step, order: index } : null;
    }).filter((s): s is WorkflowStep => s !== null);
    
    workflow.updatedAt = Date.now();
    saveWorkflows(workflows);
  }
}

/* ─── Workflow Execution ─── */
export interface WorkflowExecutionContext {
  variables: Record<string, any>;
  results: Map<string, any>;
  abortSignal?: AbortSignal;
}

export async function executeWorkflow(
  workflow: Workflow,
  context: WorkflowExecutionContext,
  onStepStart?: (step: WorkflowStep) => void,
  onStepComplete?: (step: WorkflowStep, result: any) => void,
  onStepError?: (step: WorkflowStep, error: Error) => void
): Promise<void> {
  for (const step of workflow.steps) {
    if (context.abortSignal?.aborted) {
      throw new Error('Workflow execution aborted');
    }
    
    try {
      onStepStart?.(step);
      
      let result: any;
      
      switch (step.type) {
        case 'prompt':
          result = await executePromptStep(step.config as PromptStep, context);
          break;
        case 'tool':
          result = await executeToolStep(step.config as ToolStep, context);
          break;
        case 'delay':
          result = await executeDelayStep(step.config as DelayStep, context);
          break;
        case 'condition':
          result = await executeConditionStep(step.config as ConditionStep, context, onStepStart, onStepComplete, onStepError);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
      
      context.results.set(step.id, result);
      onStepComplete?.(step, result);
      
    } catch (error) {
      onStepError?.(step, error as Error);
      throw error;
    }
  }
  
  incrementExecutionCount(workflow.id);
}

async function executePromptStep(
  config: PromptStep,
  context: WorkflowExecutionContext
): Promise<string> {
  // Replace variables in prompt
  let prompt = config.prompt;
  for (const [key, value] of Object.entries(context.variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  
  // In real implementation, this would call the agent
  // For now, just return the prompt
  return prompt;
}

async function executeToolStep(
  config: ToolStep,
  context: WorkflowExecutionContext
): Promise<any> {
  // Replace variables in arguments
  const args = { ...config.arguments };
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string') {
      for (const [varKey, varValue] of Object.entries(context.variables)) {
        args[key] = value.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(varValue));
      }
    }
  }
  
  // In real implementation, this would execute the tool
  // For now, just return the arguments
  return { tool: config.tool, arguments: args };
}

async function executeDelayStep(
  config: DelayStep,
  context: WorkflowExecutionContext
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, config.duration));
}

async function executeConditionStep(
  config: ConditionStep,
  context: WorkflowExecutionContext,
  onStepStart?: (step: WorkflowStep) => void,
  onStepComplete?: (step: WorkflowStep, result: any) => void,
  onStepError?: (step: WorkflowStep, error: Error) => void
): Promise<any> {
  // Evaluate condition (simple variable check)
  let conditionResult = false;
  
  try {
    // Replace variables in condition
    let condition = config.condition;
    for (const [key, value] of Object.entries(context.variables)) {
      condition = condition.replace(new RegExp(`\\{${key}\\}`, 'g'), JSON.stringify(value));
    }
    
    // Simple evaluation (in production, use a safer method)
    conditionResult = eval(condition);
  } catch (e) {
    conditionResult = false;
  }
  
  const stepsToExecute = conditionResult ? config.trueSteps : config.falseSteps;
  
  for (const step of stepsToExecute) {
    if (context.abortSignal?.aborted) {
      throw new Error('Workflow execution aborted');
    }
    
    try {
      onStepStart?.(step);
      
      let result: any;
      
      switch (step.type) {
        case 'prompt':
          result = await executePromptStep(step.config as PromptStep, context);
          break;
        case 'tool':
          result = await executeToolStep(step.config as ToolStep, context);
          break;
        case 'delay':
          result = await executeDelayStep(step.config as DelayStep, context);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
      
      context.results.set(step.id, result);
      onStepComplete?.(step, result);
      
    } catch (error) {
      onStepError?.(step, error as Error);
      throw error;
    }
  }
  
  return conditionResult;
}

/* ─── Template Workflows ─── */
export const TEMPLATE_WORKFLOWS = [
  {
    name: 'Create Landing Page',
    description: 'Generate a complete landing page with hero, features, and CTA',
    steps: [
      {
        type: 'prompt' as const,
        config: {
          prompt: 'Create a modern landing page for {product_name}. Include a hero section, features grid, and call-to-action.',
          waitForCompletion: true,
        },
        order: 0,
      },
    ],
  },
  {
    name: 'Code Review',
    description: 'Review code for best practices and potential issues',
    steps: [
      {
        type: 'prompt' as const,
        config: {
          prompt: 'Review the code in {file_path} for best practices, performance issues, and potential bugs.',
          waitForCompletion: true,
        },
        order: 0,
      },
    ],
  },
  {
    name: 'Generate Tests',
    description: 'Generate unit tests for a component',
    steps: [
      {
        type: 'prompt' as const,
        config: {
          prompt: 'Generate comprehensive unit tests for {component_path}. Include edge cases and error scenarios.',
          waitForCompletion: true,
        },
        order: 0,
      },
    ],
  },
];
