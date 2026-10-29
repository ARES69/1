/**
 * Workflow Editor Component — visual editor for creating and managing workflows.
 */

import { useState, useEffect } from 'react';
import { Play, Plus, Trash2, GripVertical, Save, X } from 'lucide-react';
import { 
  loadWorkflows, 
  createWorkflow, 
  updateWorkflow, 
  deleteWorkflow,
  addStep,
  removeStep,
  TEMPLATE_WORKFLOWS,
  type Workflow,
  type WorkflowStep 
} from '../lib/workflows';

export default function WorkflowEditor() {
  const [workflows, setWorkflows] = useState<Workflow[]>(loadWorkflows());
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');

  useEffect(() => {
    setWorkflows(loadWorkflows());
  }, []);

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;
    
    const workflow = createWorkflow(newWorkflowName, newWorkflowDesc);
    setWorkflows([...workflows, workflow]);
    setSelectedWorkflow(workflow);
    setIsCreating(false);
    setNewWorkflowName('');
    setNewWorkflowDesc('');
  };

  const handleDeleteWorkflow = (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow(id);
      setWorkflows(workflows.filter(w => w.id !== id));
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
      }
    }
  };

  const handleAddStep = (type: 'prompt' | 'tool' | 'delay') => {
    if (!selectedWorkflow) return;
    
    let config: any;
    switch (type) {
      case 'prompt':
        config = { prompt: '', waitForCompletion: true };
        break;
      case 'tool':
        config = { tool: '', arguments: {} };
        break;
      case 'delay':
        config = { duration: 1000 };
        break;
    }
    
    const step = addStep(selectedWorkflow.id, {
      type,
      config,
      order: selectedWorkflow.steps.length,
    });
    
    const updated = { ...selectedWorkflow, steps: [...selectedWorkflow.steps, step] };
    setSelectedWorkflow(updated);
    setWorkflows(workflows.map(w => w.id === updated.id ? updated : w));
  };

  const handleRemoveStep = (stepId: string) => {
    if (!selectedWorkflow) return;
    
    removeStep(selectedWorkflow.id, stepId);
    const updated = { ...selectedWorkflow, steps: selectedWorkflow.steps.filter(s => s.id !== stepId) };
    setSelectedWorkflow(updated);
    setWorkflows(workflows.map(w => w.id === updated.id ? updated : w));
  };

  const handleUpdateStep = (stepId: string, config: any) => {
    if (!selectedWorkflow) return;
    
    const updated = {
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.map(s => 
        s.id === stepId ? { ...s, config } : s
      ),
    };
    
    updateWorkflow(updated);
    setSelectedWorkflow(updated);
    setWorkflows(workflows.map(w => w.id === updated.id ? updated : w));
  };

  const handleLoadTemplate = (template: typeof TEMPLATE_WORKFLOWS[0]) => {
    const workflow = createWorkflow(template.name, template.description);
    template.steps.forEach((step, index) => {
      addStep(workflow.id, { ...step, order: index });
    });
    
    const updated = loadWorkflows().find(w => w.id === workflow.id);
    if (updated) {
      setWorkflows([...workflows, updated]);
      setSelectedWorkflow(updated);
    }
  };

  return (
    <div className="h-full flex bg-[var(--bg)]">
      {/* Sidebar */}
      <div className="w-80 border-r border-[var(--border)] flex flex-col">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold mb-3">Workflows</h3>
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            New Workflow
          </button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <input
              type="text"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              placeholder="Workflow name"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm mb-2 outline-none focus:ring-2 focus:ring-brand-500/50"
              autoFocus
            />
            <textarea
              value={newWorkflowDesc}
              onChange={(e) => setNewWorkflowDesc(e.target.value)}
              placeholder="Description"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm mb-2 outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateWorkflow}
                className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewWorkflowName('');
                  setNewWorkflowDesc('');
                }}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--bg-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Workflow List */}
        <div className="flex-1 overflow-y-auto p-2">
          {workflows.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <p className="text-sm">No workflows yet</p>
              <p className="text-xs mt-1">Create one or use a template</p>
            </div>
          ) : (
            <div className="space-y-1">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  onClick={() => setSelectedWorkflow(workflow)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id
                      ? 'bg-brand-500/10 border border-brand-500/30'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-medium">{workflow.name}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkflow(workflow.id);
                      }}
                      className="p-1 rounded hover:bg-red-500/10 text-red-500 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {workflow.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                    <span>{workflow.steps.length} steps</span>
                    <span>·</span>
                    <span>{workflow.executionCount} runs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="p-4 border-t border-[var(--border)]">
          <h4 className="text-sm font-semibold mb-2">Templates</h4>
          <div className="space-y-1">
            {TEMPLATE_WORKFLOWS.map((template, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadTemplate(template)}
                className="w-full text-left p-2 rounded-lg text-xs hover:bg-[var(--bg-hover)] transition-colors"
              >
                <p className="font-medium">{template.name}</p>
                <p className="text-[var(--text-muted)] line-clamp-1">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedWorkflow ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">{selectedWorkflow.name}</h2>
                <button className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2">
                  <Play size={16} />
                  Run Workflow
                </button>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{selectedWorkflow.description}</p>
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedWorkflow.steps.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)]">
                  <p className="text-lg mb-2">No steps yet</p>
                  <p className="text-sm">Add steps to build your workflow</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedWorkflow.steps.map((step, index) => (
                    <StepEditor
                      key={step.id}
                      step={step}
                      index={index}
                      onUpdate={(config) => handleUpdateStep(step.id, config)}
                      onRemove={() => handleRemoveStep(step.id)}
                    />
                  ))}
                </div>
              )}

              {/* Add Step Buttons */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => handleAddStep('prompt')}
                  className="flex-1 py-3 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-brand-500/10 hover:border-brand-500/30 transition-colors"
                >
                  + Add Prompt Step
                </button>
                <button
                  onClick={() => handleAddStep('tool')}
                  className="flex-1 py-3 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-brand-500/10 hover:border-brand-500/30 transition-colors"
                >
                  + Add Tool Step
                </button>
                <button
                  onClick={() => handleAddStep('delay')}
                  className="flex-1 py-3 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-brand-500/10 hover:border-brand-500/30 transition-colors"
                >
                  + Add Delay
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-[var(--text-muted)]">
              <p className="text-lg mb-2">Select a workflow to edit</p>
              <p className="text-sm">Or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepEditorProps {
  step: WorkflowStep;
  index: number;
  onUpdate: (config: any) => void;
  onRemove: () => void;
}

function StepEditor({ step, index, onUpdate, onRemove }: StepEditorProps) {
  const getStepIcon = () => {
    switch (step.type) {
      case 'prompt':
        return '💬';
      case 'tool':
        return '🔧';
      case 'delay':
        return '⏱️';
      case 'condition':
        return '🔀';
      default:
        return '📝';
    }
  };

  const getStepTitle = () => {
    switch (step.type) {
      case 'prompt':
        return 'Prompt Step';
      case 'tool':
        return 'Tool Step';
      case 'delay':
        return 'Delay';
      case 'condition':
        return 'Condition';
      default:
        return 'Step';
    }
  };

  return (
    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-[var(--text-muted)] cursor-move" />
          <span className="text-lg">{getStepIcon()}</span>
          <div>
            <h4 className="text-sm font-medium">{getStepTitle()}</h4>
            <p className="text-xs text-[var(--text-muted)]">Step {index + 1}</p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-red-500/10 text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {step.type === 'prompt' && (
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
            Prompt
          </label>
          <textarea
            value={step.config.prompt || ''}
            onChange={(e) => onUpdate({ ...step.config, prompt: e.target.value })}
            placeholder="Enter prompt... Use {variable} for variables"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
            rows={3}
          />
        </div>
      )}

      {step.type === 'tool' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
              Tool Name
            </label>
            <input
              type="text"
              value={step.config.tool || ''}
              onChange={(e) => onUpdate({ ...step.config, tool: e.target.value })}
              placeholder="e.g., write_file, run_code"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
              Arguments (JSON)
            </label>
            <textarea
              value={JSON.stringify(step.config.arguments || {}, null, 2)}
              onChange={(e) => {
                try {
                  const args = JSON.parse(e.target.value);
                  onUpdate({ ...step.config, arguments: args });
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              placeholder='{"key": "value"}'
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
              rows={4}
            />
          </div>
        </div>
      )}

      {step.type === 'delay' && (
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
            Duration (ms)
          </label>
          <input
            type="number"
            value={step.config.duration || 1000}
            onChange={(e) => onUpdate({ ...step.config, duration: parseInt(e.target.value) || 1000 })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
      )}
    </div>
  );
}
