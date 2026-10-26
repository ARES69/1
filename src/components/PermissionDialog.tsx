/**
 * PermissionDialog — request user approval before dangerous operations.
 */

import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldX, Check, X } from 'lucide-react';
import type { PermissionRequest } from '../lib/permission-system';

interface PermissionDialogProps {
  request: PermissionRequest;
  onApprove: (remember: boolean) => void;
  onDeny: (remember: boolean) => void;
}

export default function PermissionDialog({ request, onApprove, onDeny }: PermissionDialogProps) {
  const getIcon = () => {
    switch (request.level) {
      case 'safe':
        return <Shield size={24} className="text-emerald-500" />;
      case 'caution':
        return <ShieldAlert size={24} className="text-yellow-500" />;
      case 'dangerous':
        return <ShieldX size={24} className="text-red-500" />;
    }
  };

  const getColor = () => {
    switch (request.level) {
      case 'safe':
        return 'border-emerald-500 bg-emerald-500/10';
      case 'caution':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'dangerous':
        return 'border-red-500 bg-red-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border-2 p-6"
        style={{ backgroundColor: 'var(--card)' }}
      >
        <div className={`rounded-lg p-4 mb-4 border ${getColor()}`}>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Permission Required
            </h3>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            {request.description}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Tool: {request.tool}
          </p>
        </div>

        <div className="p-3 rounded-lg mb-4 font-mono text-xs overflow-auto max-h-32"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          {request.details}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onApprove(false)}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={16} /> Allow
          </button>
          <button
            onClick={() => onApprove(true)}
            className="flex-1 py-2.5 rounded-xl border font-medium hover:border-brand-500 transition-colors flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Check size={16} /> Always Allow
          </button>
          <button
            onClick={() => onDeny(false)}
            className="px-4 py-2.5 rounded-xl border font-medium hover:border-red-500 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <X size={16} /> Deny
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
