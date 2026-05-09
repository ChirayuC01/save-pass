import { useState } from 'react';
import { toast } from 'react-toastify';
import { generatePassword } from '../utils/crypto';

const TOAST = { position: 'top-right' as const, autoClose: 1500, theme: 'dark' as const };

interface Props {
  onUse: (password: string) => void;
}

export const PasswordGenerator = ({ onUse }: Props) => {
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [generated, setGenerated] = useState('');
  const [open, setOpen] = useState(false);

  const generate = () => {
    const pw = generatePassword(length, opts);
    if (!pw) {
      toast.error('Select at least one character type', TOAST);
      return;
    }
    setGenerated(pw);
  };

  const copy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    toast('Copied!', TOAST);
  };

  const use = () => {
    if (!generated) return;
    onUse(generated);
    setOpen(false);
    toast.success('Password applied', TOAST);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); generate(); }}
        className="text-xs text-green-700 dark:text-green-400 hover:underline mt-1 ml-4"
      >
        Generate strong password
      </button>
    );
  }

  return (
    <div className="ml-1 mt-2 p-3 bg-green-50 dark:bg-slate-700 border border-green-200 dark:border-slate-600 rounded-xl text-sm">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-gray-600 dark:text-slate-300 w-16 shrink-0">Length: {length}</label>
        <input
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="flex-1 accent-green-500"
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-2">
        {(['upper', 'lower', 'numbers', 'symbols'] as const).map((key) => (
          <label key={key} className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={opts[key]}
              onChange={() => setOpts((o) => ({ ...o, [key]: !o[key] }))}
              className="accent-green-500"
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <code className="flex-1 bg-white dark:bg-slate-800 border border-green-200 dark:border-slate-600 rounded px-2 py-1 text-xs truncate font-mono text-gray-800 dark:text-slate-200">
          {generated || '—'}
        </code>
        <button type="button" onClick={generate}
          className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-slate-600 hover:bg-green-200 dark:hover:bg-slate-500 transition-colors">
          ↺
        </button>
        <button type="button" onClick={copy}
          className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-slate-600 hover:bg-green-200 dark:hover:bg-slate-500 transition-colors">
          Copy
        </button>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={use}
          className="flex-1 text-xs py-1 rounded-full bg-green-600 hover:bg-green-500 text-white transition-colors">
          Use this password
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-xs px-3 py-1 rounded-full border border-gray-300 dark:border-slate-500 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
};
