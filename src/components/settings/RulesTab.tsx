import React, { useEffect, useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../data/api';
import { SectionCard, EditableInput } from './shared';
import Skeleton from '../UI/Skeleton';
import type { RuleItem } from './types';

interface RulesTabProps {
  editSection: string | null;
  setEditSection: (section: string | null) => void;
}

export default function RulesTab({ editSection, setEditSection }: RulesTabProps) {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    try {
      const data = await api.getRules();
      const rulesArray: RuleItem[] = data.results || data || [];
      setRules(rulesArray.map((r) => ({ id: r.id, rule: r.rule })));
    } catch {
      setRules([]);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleRuleChange = (idx: number, value: string) => {
    setRules(rules => rules.map((r, i) => i === idx ? { ...r, rule: value } : r));
  };

  const handleAddRule = () => {
    setRules(rules => [...rules, { rule: '' }]);
  };

  const handleRemoveRule = async (idx: number) => {
    const ruleToRemove = rules[idx];
    if (ruleToRemove.id) {
      try {
        await api.deleteRule(ruleToRemove.id);
        toast.success('Qoida o\'chirildi!');
      } catch {
        toast.error('Qoidani o\'chirishda xatolik!');
        return;
      }
    }
    setRules(rules => rules.filter((_, i) => i !== idx));
  };

  const handleSaveRules = async () => {
    setSaving(true);
    try {
      for (const rule of rules) {
        if (!rule.rule.trim()) continue;
        if (rule.id) {
          await api.updateRule(rule.id, { rule: rule.rule });
        } else {
          await api.createRule({ rule: rule.rule });
        }
      }
      await fetchRules();
      toast.success('Qoidalar saqlandi!');
      setEditSection(null);
    } catch (err) {
      toast.error((err as Error)?.message || 'Xatolik yuz berdi!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      icon={<ListChecks className="w-6 h-6" />}
      title="Qonun-qoidalar"
      description="Yotoqxonada amal qilinishi shart bo'lgan asosiy qoidalar. Ro'yxatni tahrirlash va yangi qoida qo'shish mumkin."
      onEdit={() => setEditSection(editSection === 'rules' ? null : 'rules')}
    >
      {rulesLoading ? (
        <Skeleton className="h-10" count={3} />
      ) : (
        <ul className="list-disc space-y-2 text-surface-700 dark:text-surface-200">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-center gap-2">
              <EditableInput
                label=""
                value={rule.rule}
                onChange={v => handleRuleChange(i, v)}
                disabled={editSection !== 'rules'}
                placeholder="Qoida matni"
                helper={editSection === 'rules' && i === rules.length - 1 ? 'Yangi qoida qo\'shish uchun pastdagi tugmani bosing' : undefined}
                fullWidth
              />
              {editSection === 'rules' && rules.length > 1 && (
                <button
                  className="p-1 rounded hover:bg-danger-100 dark:hover:bg-danger-900/30"
                  title="O'chirish"
                  onClick={() => handleRemoveRule(i)}
                >
                  <span className="text-danger-500 font-bold">×</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editSection === 'rules' && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors duration-150 text-sm sm:text-base"
            onClick={handleAddRule}
          >
            <Plus className="w-4 h-4" /> Yangi qoida qo'shish
          </button>
          <button
            className="px-4 sm:px-6 py-2 rounded-xl bg-success-600 text-white font-semibold hover:bg-success-700 transition-colors duration-150 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleSaveRules}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saqlanmoqda...
              </>
            ) : (
              'Saqlash'
            )}
          </button>
        </div>
      )}
    </SectionCard>
  );
}
