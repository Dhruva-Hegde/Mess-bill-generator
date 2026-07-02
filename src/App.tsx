/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Version: 1.1.0 - Malnad Dark Theme Integrated
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Receipt, 
  Calculator, 
  Plus, 
  Trash2, 
  TrendingUp,
  CreditCard,
  UserCircle,
  Settings,
  Download,
  RotateCcw,
  FileText,
  Edit2,
  Check,
  X,
  Menu,
  Home,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Card } from './components/ui/Card';
import { TabButton } from './components/ui/TabButton';
import { Member, Expense, AppSettings, MemberType, ExpenseCategory } from './types';
import { DEFAULT_MEMBERS } from './constants';

// --- Safe Helpers for Sandboxed Environments ---
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage is not available in this environment:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage is not available in this environment:', e);
    }
  }
};

const generateId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    console.warn('crypto.randomUUID is not available in this environment:', e);
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getDefaultExpenses = (): Expense[] => [
  {
    id: 'default-cook-salary',
    amount: 0,
    description: 'Cook Salary',
    date: new Date().toISOString(),
    category: 'commonMess',
    isIncome: false
  },
  {
    id: 'default-cook-income',
    amount: 0,
    description: 'Cook Income',
    date: new Date().toISOString(),
    category: 'mess',
    isIncome: true
  },
  {
    id: 'default-gas',
    amount: 0,
    description: 'Gas',
    date: new Date().toISOString(),
    category: 'commonMess',
    isIncome: false
  },
  {
    id: 'default-housemaid',
    amount: 0,
    description: 'Housemaid',
    date: new Date().toISOString(),
    category: 'commonMess',
    isIncome: false
  },
  {
    id: 'default-garbage',
    amount: 0,
    description: 'Garbage',
    date: new Date().toISOString(),
    category: 'commonMess',
    isIncome: false
  },
  {
    id: 'default-current-bill',
    amount: 0,
    description: 'Current bill',
    date: new Date().toISOString(),
    category: 'common',
    isIncome: false
  },
  {
    id: 'default-water-bill',
    amount: 0,
    description: 'waterbill',
    date: new Date().toISOString(),
    category: 'common',
    isIncome: false
  },
  {
    id: 'default-paper-bill',
    amount: 0,
    description: 'paperbill',
    date: new Date().toISOString(),
    category: 'common',
    isIncome: false
  },
  {
    id: 'default-internet-bill',
    amount: 0,
    description: 'Internetbill',
    date: new Date().toISOString(),
    category: 'common',
    isIncome: false
  },
  {
    id: 'default-daily-expenses',
    amount: 0,
    description: 'Dailyexpances(secretary+milk)',
    date: new Date().toISOString(),
    category: 'mess',
    isIncome: false
  },
  {
    id: 'default-mess-expenses',
    amount: 0,
    description: 'Mess expances',
    date: new Date().toISOString(),
    category: 'mess',
    isIncome: false
  }
];

const ensureDefaultExpenses = (existing: Expense[]): Expense[] => {
  const defaults = getDefaultExpenses();
  const updated = [...existing];
  
  defaults.forEach(defaultExp => {
    const exists = updated.some(e => 
      e.category === defaultExp.category && 
      e.description.toLowerCase().trim() === defaultExp.description.toLowerCase().trim()
    );
    if (!exists) {
      updated.push({
        ...defaultExp,
        id: generateId()
      });
    }
  });
  
  return updated;
};

export default function App() {
  // --- State ---
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = safeLocalStorage.getItem('messmate_v2_members');
    let list: Member[] = saved ? JSON.parse(saved) : DEFAULT_MEMBERS;

    const hasChinmay = list.some(m => m.name.toLowerCase() === 'chinmay');
    const hasRoshan = list.some(m => m.name.toLowerCase() === 'roshan');
    const hasPrasanna = list.some(m => m.name.toLowerCase() === 'prasanna');
    const hasKarthik = list.some(m => m.name.toLowerCase() === 'karthik');

    let modified = false;
    
    // Convert any legacy 30 days stayed to 0 as the new default
    list = list.map(m => {
      if (m.daysStayed === 30) {
        modified = true;
        return { ...m, daysStayed: 0 };
      }
      return m;
    });

    if (hasChinmay || hasRoshan) {
      list = list.filter(m => m.name.toLowerCase() !== 'chinmay' && m.name.toLowerCase() !== 'roshan');
      modified = true;
    }
    if (!hasPrasanna) {
      list.push({ id: generateId(), name: 'Prasanna', type: 'job', daysStayed: 0 });
      modified = true;
    }
    if (!hasKarthik) {
      list.push({ id: generateId(), name: 'Karthik', type: 'student', daysStayed: 0 });
      modified = true;
    }

    // Always keep lists sorted in A-Z order
    const originalSortedString = JSON.stringify(list);
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    if (JSON.stringify(list) !== originalSortedString) {
      modified = true;
    }

    if (modified) {
      safeLocalStorage.setItem('messmate_v2_members', JSON.stringify(list));
    }

    return list;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = safeLocalStorage.getItem('messmate_v2_expenses');
    const existing = saved ? JSON.parse(saved) : [];
    return ensureDefaultExpenses(existing);
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = safeLocalStorage.getItem('messmate_v2_settings');
    return saved ? JSON.parse(saved) : {
      president: 'Gururaj Hegde',
      secretary: 'Roshan Bhat',
      studentRent: 1000,
      jobRent: 1500,
      month: 'January - 2026'
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'expenses' | 'settings'>('dashboard');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerEditValues, setHeaderEditValues] = useState({
    month: '',
    president: '',
    secretary: ''
  });
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = safeLocalStorage.getItem('malnad_ultra_theme_v5');
    return saved !== 'light';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      safeLocalStorage.setItem('malnad_ultra_theme_v5', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      safeLocalStorage.setItem('malnad_ultra_theme_v5', 'light');
    }
  }, [isDarkMode]);

  // --- Persistence ---
  useEffect(() => {
    safeLocalStorage.setItem('messmate_v2_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    safeLocalStorage.setItem('messmate_v2_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    safeLocalStorage.setItem('messmate_v2_settings', JSON.stringify(settings));
  }, [settings]);

  // --- Calculations ---
  const stats = useMemo(() => {
    const totalCommonMess = expenses
      .filter(e => e.category === 'commonMess')
      .reduce((sum, e) => sum + (e.isIncome ? -e.amount : e.amount), 0);
    
    const totalCommon = expenses
      .filter(e => e.category === 'common')
      .reduce((sum, e) => sum + (e.isIncome ? -e.amount : e.amount), 0);

    const totalMess = expenses
      .filter(e => e.category === 'mess')
      .reduce((sum, e) => sum + (e.isIncome ? -e.amount : e.amount), 0);

    const totalDays = members.reduce((sum, m) => sum + (m.daysStayed || 0), 0);
    const activeMembersCount = members.filter(m => (m.daysStayed || 0) > 0).length;

    const commonMessPerHead = activeMembersCount > 0 ? totalCommonMess / activeMembersCount : 0;
    const commonPerHead = activeMembersCount > 0 ? totalCommon / activeMembersCount : 0;
    const messPerDay = totalDays > 0 ? totalMess / totalDays : 0;

    const memberBills = members.map(member => {
      const isActive = (member.daysStayed || 0) > 0;
      const messBill = isActive ? (member.daysStayed || 0) * messPerDay : 0;
      const rent = isActive 
        ? (member.type === 'student' 
          ? settings.studentRent 
          : member.type === 'job' 
            ? settings.jobRent 
            : 0)
        : 0;
      
      const commonMessBill = isActive ? commonMessPerHead : 0;
      const commonBill = isActive ? commonPerHead : 0;
      
      return {
        ...member,
        commonMessBill,
        commonBill,
        messBill,
        rent,
        totalBill: commonMessBill + commonBill + messBill + rent
      };
    });

    const grandTotal = memberBills.reduce((sum, b) => sum + b.totalBill, 0);

    return {
      totalCommonMess,
      totalCommon,
      totalMess,
      totalDays,
      commonMessPerHead,
      commonPerHead,
      messPerDay,
      memberBills,
      grandTotal
    };
  }, [members, expenses, settings]);

  // --- Handlers ---
  const addMember = (name: string, type: MemberType, days: number) => {
    if (!name.trim()) return;
    const newMember: Member = { 
      id: generateId(), 
      name, 
      type, 
      daysStayed: days 
    };
    const updated = [...members, newMember].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    setMembers(updated);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    const updated = members.map(m => m.id === id ? { ...m, ...updates } : m).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    setMembers(updated);
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const addExpense = (amount: number, description: string, category: ExpenseCategory, isIncome: boolean = false) => {
    if (amount <= 0 || !description.trim()) return;
    const newExpense: Expense = {
      id: generateId(),
      amount,
      description,
      date: new Date().toISOString(),
      category,
      isIncome
    };
    setExpenses([newExpense, ...expenses]);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const clearAllExpenses = () => {
    const confirmClear = typeof window !== 'undefined' && typeof window.confirm === 'function' 
      ? window.confirm('Are you sure you want to clear all expenses? This will reset all default items to ₹0 and delete any custom items.')
      : true;

    if (confirmClear) {
      setExpenses(getDefaultExpenses());
      safeLocalStorage.setItem('messmate_v2_expenses', JSON.stringify(getDefaultExpenses()));
    }
  };

  const resetData = () => {
    const defaultSettings = {
      president: 'Gururaj Hegde',
      secretary: 'Roshan Bhat',
      studentRent: 1000,
      jobRent: 1500,
      month: 'January - 2026'
    };
    
    setMembers(DEFAULT_MEMBERS);
    setExpenses(getDefaultExpenses());
    setSettings(defaultSettings);
    
    safeLocalStorage.setItem('messmate_v2_members', JSON.stringify(DEFAULT_MEMBERS));
    safeLocalStorage.setItem('messmate_v2_expenses', JSON.stringify(getDefaultExpenses()));
    safeLocalStorage.setItem('messmate_v2_settings', JSON.stringify(defaultSettings));
    
    // Force a reload to ensure everything is clean
    window.location.reload();
  };

  const exportData = () => {
    const data = { members, expenses, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messmate_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(22);
    doc.text('MALNAD MANE', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Bill Statement: ${settings.month}`, pageWidth / 2, 30, { align: 'center' });

    // Summary Info
    doc.setFontSize(10);
    doc.text(`President: ${settings.president}`, 14, 45);
    doc.text(`Secretary: ${settings.secretary}`, pageWidth - 14, 45, { align: 'right' });
    
    doc.line(14, 48, pageWidth - 14, 48);

    // Stats
    doc.setFontSize(12);
    doc.text('Expense Summary', 14, 58);
    doc.setFontSize(10);
    doc.text(`Total Common Mess: Rs. ${stats.totalCommonMess.toLocaleString()}`, 14, 65);
    doc.text(`Total Common Exp: Rs. ${stats.totalCommon.toLocaleString()}`, 14, 70);
    doc.text(`Total Mess Bill: Rs. ${stats.totalMess.toLocaleString()}`, 14, 75);
    doc.text(`Mess Rate per Day: Rs. ${stats.messPerDay.toFixed(2)}`, 14, 80);

    // Table
    const tableData = stats.memberBills.map(bill => [
      bill.name,
      bill.daysStayed,
      bill.commonMessBill.toFixed(0),
      bill.commonBill.toFixed(0),
      bill.messBill.toFixed(0),
      (bill.commonMessBill + bill.commonBill + bill.messBill).toFixed(0),
      bill.rent.toFixed(0),
      bill.totalBill.toFixed(0)
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Name', 'Days', 'C.Mess', 'Common', 'Mess', 'M.Total', 'Rent', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      foot: [[
        'Grand Total',
        stats.totalDays,
        stats.totalCommonMess.toLocaleString(),
        stats.totalCommon.toLocaleString(),
        stats.totalMess.toLocaleString(),
        (stats.totalCommonMess + stats.totalCommon + stats.totalMess).toLocaleString(),
        stats.memberBills.reduce((s, b) => s + b.rent, 0).toLocaleString(),
        stats.grandTotal.toLocaleString()
      ]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // Detailed Expense List
    const finalYBill = (doc as any).lastAutoTable.finalY || 150;
    doc.addPage();
    doc.setFontSize(18);
    doc.text('DETAILED EXPENSE LIST', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Month: ${settings.month}`, pageWidth / 2, 28, { align: 'center' });

    // Common Mess Expenses Table
    doc.setFontSize(14);
    doc.text('1. Common Mess Expenses', 14, 40);
    const commonMessData = expenses
      .filter(e => e.category === 'commonMess')
      .map(e => [
        e.isIncome ? `[INCOME] ${e.description}` : e.description, 
        new Date(e.date).toLocaleDateString(), 
        `${e.isIncome ? '-' : ''}Rs. ${e.amount.toLocaleString()}`
      ]);
    
    autoTable(doc, {
      startY: 45,
      head: [['Description', 'Date', 'Amount']],
      body: commonMessData.length > 0 ? commonMessData : [['No items', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [60, 60, 60] },
      foot: [['Total Common Mess', '', `Rs. ${stats.totalCommonMess.toLocaleString()}`]],
      footStyles: { fontStyle: 'bold', fillColor: [245, 245, 245] }
    });

    // Common Expenses Table
    const finalYCommonMess = (doc as any).lastAutoTable.finalY || 60;
    doc.setFontSize(14);
    doc.text('2. Common Expenses', 14, finalYCommonMess + 15);
    const commonData = expenses
      .filter(e => e.category === 'common')
      .map(e => [
        e.isIncome ? `[INCOME] ${e.description}` : e.description, 
        new Date(e.date).toLocaleDateString(), 
        `${e.isIncome ? '-' : ''}Rs. ${e.amount.toLocaleString()}`
      ]);

    autoTable(doc, {
      startY: finalYCommonMess + 20,
      head: [['Description', 'Date', 'Amount']],
      body: commonData.length > 0 ? commonData : [['No items', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [60, 60, 60] },
      foot: [['Total Common Exp', '', `Rs. ${stats.totalCommon.toLocaleString()}`]],
      footStyles: { fontStyle: 'bold', fillColor: [245, 245, 245] }
    });

    // Mess Expenses Table
    const finalYCommon = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(14);
    doc.text('3. Mess Expenses', 14, finalYCommon + 15);
    const messData = expenses
      .filter(e => e.category === 'mess')
      .map(e => [
        e.isIncome ? `[INCOME] ${e.description}` : e.description, 
        new Date(e.date).toLocaleDateString(), 
        `${e.isIncome ? '-' : ''}Rs. ${e.amount.toLocaleString()}`
      ]);

    autoTable(doc, {
      startY: finalYCommon + 20,
      head: [['Description', 'Date', 'Amount']],
      body: messData.length > 0 ? messData : [['No items', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [60, 60, 60] },
      foot: [['Total Mess Bill', '', `Rs. ${stats.totalMess.toLocaleString()}`]],
      footStyles: { fontStyle: 'bold', fillColor: [245, 245, 245] }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    doc.setFontSize(10);
    doc.text('Generated by Malnad Mane App', pageWidth / 2, finalY + 20, { align: 'center' });

    doc.save(`Malnad_Mane_Bill_${settings.month.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-primary font-sans selection:bg-brand-accent selection:text-white transition-colors duration-300 relative overflow-x-hidden">
      {/* Decorative Background Graphics */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="malnad-pattern absolute inset-0" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-brand-accent/3 rounded-full blur-3xl" />
        
        {/* Abstract Leaf Shape */}
        <svg className="absolute bottom-0 right-0 w-[40vw] opacity-[0.03] text-brand-accent" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 0C100 0 100 100 0 100C0 100 100 100 100 200C100 200 100 100 200 100C200 100 100 100 100 0Z" />
        </svg>
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-card-bg rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-brand-accent/10 border border-black/5 dark:border-white/5">
              <img 
                src="/Malnad.png" 
                alt="Malnad Mane Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if Malnad.png is not found
                  e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2652/2652218.png";
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold tracking-tight text-brand-accent leading-none">Malnad Mane</h1>
              <p className="text-[9px] text-gray-400 uppercase tracking-[0.15em] font-bold mt-1">Mess Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1">
              <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Calculator} label="Bill" />
              <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={Users} label="Members" />
              <TabButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={Receipt} label="Expenses" />
              <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Settings" />
            </nav>
            
            <div className="hidden md:block h-6 w-px bg-black/10 dark:bg-white/10" />

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 bg-card-bg hover:bg-black/5 dark:hover:bg-white/5 text-brand-accent hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-sm cursor-pointer"
              title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-brand-accent" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-50 glass rounded-3xl p-2 flex justify-around items-center shadow-2xl border border-white/20">
        {[
          { id: 'dashboard', icon: Calculator, label: 'Bill' },
          { id: 'members', icon: Users, label: 'Members' },
          { id: 'expenses', icon: Receipt, label: 'Expenses' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
              activeTab === tab.id 
                ? 'bg-brand-accent text-white scale-110 shadow-lg' 
                : 'text-gray-400'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card-bg p-8 rounded-[2rem] card-shadow border border-black/5 dark:border-white/5 gap-6">
                {isEditingHeader ? (
                  <div className="flex flex-col gap-4 bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-black/5 dark:border-white/5 w-full md:max-w-xl">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Month / Year</label>
                      <input
                        type="text"
                        value={headerEditValues.month}
                        onChange={(e) => setHeaderEditValues({ ...headerEditValues, month: e.target.value })}
                        className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-black/10 dark:border-white/10 bg-card-bg dark:bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-brand-primary"
                        placeholder="e.g. January - 2026"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">President Name</label>
                        <input
                          type="text"
                          value={headerEditValues.president}
                          onChange={(e) => setHeaderEditValues({ ...headerEditValues, president: e.target.value })}
                          className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-black/10 dark:border-white/10 bg-card-bg dark:bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-brand-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secretary Name</label>
                        <input
                          type="text"
                          value={headerEditValues.secretary}
                          onChange={(e) => setHeaderEditValues({ ...headerEditValues, secretary: e.target.value })}
                          className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-black/10 dark:border-white/10 bg-card-bg dark:bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all text-brand-primary"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => setIsEditingHeader(false)}
                        className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-black/5 dark:bg-white/5 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setSettings({
                            ...settings,
                            month: headerEditValues.month,
                            president: headerEditValues.president,
                            secretary: headerEditValues.secretary
                          });
                          setIsEditingHeader(false);
                        }}
                        className="px-4 py-2 text-xs font-bold bg-brand-accent text-white rounded-xl hover:bg-brand-accent/90 transition-all flex items-center gap-1.5 shadow-md shadow-brand-accent/10"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 group relative">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-serif font-bold text-brand-primary">{settings.month}</h2>
                      <button
                        onClick={() => {
                          setHeaderEditValues({
                            month: settings.month,
                            president: settings.president,
                            secretary: settings.secretary
                          });
                          setIsEditingHeader(true);
                        }}
                        className="opacity-60 group-hover:opacity-100 hover:scale-105 active:scale-95 p-2 text-brand-accent hover:bg-brand-accent/10 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="Edit details directly"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-xs font-bold hidden sm:inline">Edit Info</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-6 mt-2 text-sm text-gray-500">
                      <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-accent"></span><span className="font-semibold text-brand-primary">President:</span> {settings.president}</p>
                      <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-accent/40"></span><span className="font-semibold text-brand-primary">Secretary:</span> {settings.secretary}</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-3 bg-brand-accent text-white hover:bg-brand-accent/90 rounded-2xl transition-all text-sm font-bold shadow-lg shadow-brand-accent/20">
                    <FileText className="w-4 h-4" /> Download PDF
                  </button>
                  <button onClick={exportData} className="flex items-center gap-2 px-6 py-3 bg-card-bg dark:bg-brand-accent/10 border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-brand-accent/20 rounded-2xl transition-all text-sm font-bold">
                    <Download className="w-4 h-4" /> Export
                  </button>
                  <button onClick={resetData} className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 rounded-2xl transition-all text-sm font-bold">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card title="Common Mess" icon={CreditCard}>
                  <p className="text-3xl font-bold tracking-tight">₹{stats.totalCommonMess.toLocaleString()}</p>
                  <p className="text-xs text-brand-accent font-bold mt-2 bg-brand-accent/5 inline-block px-2 py-1 rounded-lg">₹{stats.commonMessPerHead.toFixed(2)} / Head</p>
                </Card>
                <Card title="Common Exp" icon={TrendingUp}>
                  <p className="text-3xl font-bold tracking-tight">₹{stats.totalCommon.toLocaleString()}</p>
                  <p className="text-xs text-brand-accent font-bold mt-2 bg-brand-accent/5 inline-block px-2 py-1 rounded-lg">₹{stats.commonPerHead.toFixed(2)} / Head</p>
                </Card>
                <Card title="Mess Total" icon={Receipt}>
                  <p className="text-3xl font-bold tracking-tight">₹{stats.totalMess.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 font-bold mt-2">₹{stats.messPerDay.toFixed(2)} / day</p>
                </Card>
                <Card title="✦ Grand Total" icon={TrendingUp} className="bg-brand-accent text-white dark:bg-brand-accent dark:text-brand-bg" iconClassName="text-white dark:text-brand-bg" iconBgClassName="bg-white/10 dark:bg-brand-bg/10">
                  <p className="text-3xl font-bold tracking-tight">₹{stats.grandTotal.toLocaleString()}</p>
                  <p className="text-xs text-white/70 font-bold mt-2">Total combined monthly bill amount</p>
                </Card>
              </div>

              {/* Detailed Bill Table */}
              <Card title="Final Bill Statement" icon={Calculator} headerAction={
                <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white hover:bg-brand-accent/90 rounded-xl transition-all text-xs font-bold shadow-lg shadow-brand-accent/20">
                  <FileText className="w-3.5 h-3.5" /> Download PDF
                </button>
              }>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="border-b border-black/5">
                        <th className="pb-6 font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em]">Name</th>
                        <th className="pb-6 font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em]">Days</th>
                        <th className="pb-6 font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em]">C.Mess</th>
                        <th className="pb-6 font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em]">Common</th>
                        <th className="pb-6 font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em]">Mess Bill</th>
                        <th className="pb-6 font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em]">M.Total</th>
                        <th className="pb-6 font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em]">Rent</th>
                        <th className="pb-6 font-bold text-[10px] text-gray-400 uppercase tracking-[0.2em] text-right">Total Bill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {stats.memberBills.map((bill) => (
                        <tr key={bill.id} className="group hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10 transition-colors">
                          <td className="py-6">
                            <p className="font-bold text-brand-primary">{bill.name}</p>
                            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">{bill.type}</span>
                          </td>
                          <td className="py-6 font-semibold text-gray-600">{bill.daysStayed}</td>
                          <td className="py-6 text-gray-500 font-medium">₹{bill.commonMessBill.toFixed(0)}</td>
                          <td className="py-6 text-gray-500 font-medium">₹{bill.commonBill.toFixed(0)}</td>
                          <td className="py-6 text-gray-500 font-medium">₹{bill.messBill.toFixed(0)}</td>
                          <td className="py-6 font-bold text-brand-accent">₹{(bill.commonMessBill + bill.commonBill + bill.messBill).toFixed(0)}</td>
                          <td className="py-6 text-gray-500 font-medium">₹{bill.rent.toFixed(0)}</td>
                          <td className="py-6 font-black text-right text-xl text-brand-primary">₹{bill.totalBill.toFixed(0)}</td>
                        </tr>
                      ))}
                      {members.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-400 italic">No members added yet. Go to Members tab to start.</td>
                        </tr>
                      )}
                    </tbody>
                    {members.length > 0 && (
                       <tfoot>
                         <tr className="border-t-2 border-brand-accent font-bold">
                           <td className="py-4">Grand Total</td>
                           <td className="py-4">{stats.totalDays}</td>
                           <td className="py-4">₹{stats.totalCommonMess.toLocaleString()}</td>
                           <td className="py-4">₹{stats.totalCommon.toLocaleString()}</td>
                           <td className="py-4">₹{stats.totalMess.toLocaleString()}</td>
                           <td className="py-4">₹{(stats.totalCommonMess + stats.totalCommon + stats.totalMess).toLocaleString()}</td>
                           <td className="py-4">₹{stats.memberBills.reduce((s, b) => s + b.rent, 0).toLocaleString()}</td>
                           <td className="py-4 text-right text-xl">₹{stats.grandTotal.toLocaleString()}</td>
                         </tr>
                       </tfoot>
                    )}
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div 
              key="members"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <Card title="Add New Member" icon={Users}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                  const type = (form.elements.namedItem('type') as HTMLSelectElement).value as MemberType;
                  const days = parseInt((form.elements.namedItem('days') as HTMLInputElement).value);
                  addMember(name, type, days);
                  form.reset();
                }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input name="name" type="text" placeholder="Name" required className="px-6 py-4 rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                  <select name="type" className="px-6 py-4 rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all">
                    <option value="student">Student</option>
                    <option value="job">Job Holder</option>
                    <option value="none">None</option>
                  </select>
                  <input name="days" type="number" placeholder="Days Stayed" defaultValue="0" min="0" required className="px-6 py-4 rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                  <button className="bg-brand-accent text-white rounded-2xl font-bold hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20">
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
                </form>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {members.map((member) => (
                  <Card key={member.id} title={editingMember?.id === member.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input 
                        autoFocus
                        className="flex-1 text-lg font-bold bg-black/5 px-2 py-1 rounded outline-none min-w-0"
                        value={editingMember.name}
                        onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { updateMember(member.id, { name: editingMember.name }); setEditingMember(null); }} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingMember(null)} className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : member.name} icon={UserCircle} headerAction={
                    <div className="flex gap-1">
                      {!editingMember && (
                        <button onClick={() => setEditingMember(member)} className="p-2 text-gray-400 hover:text-black transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => removeMember(member.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  }>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Type</span>
                        <select 
                          value={member.type} 
                          onChange={(e) => updateMember(member.id, { type: e.target.value as MemberType })}
                          className="text-sm font-bold bg-black/5 px-3 py-1 rounded-lg outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="job">Job Holder</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Days Stayed</span>
                        <input 
                          type="number" 
                          value={member.daysStayed} 
                          onChange={(e) => updateMember(member.id, { daysStayed: parseInt(e.target.value) || 0 })}
                          className="w-20 text-right font-bold bg-black/5 px-3 py-1 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div 
              key="expenses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card-bg p-8 rounded-[2rem] card-shadow border border-black/5 dark:border-white/5 gap-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-brand-primary">Expense Management</h2>
                  <p className="text-sm text-gray-500">Manage all common and mess expenses for {settings.month}</p>
                </div>
                <button 
                  onClick={clearAllExpenses}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 rounded-2xl transition-all text-sm font-bold"
                >
                  <Trash2 className="w-4 h-4" /> Clear All Expenses
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Common Mess Expenses */}
                <div className="space-y-6">
                  <Card title="Common Mess Expenses" icon={CreditCard}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value);
                      const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
                      addExpense(amount, desc, 'commonMess', false);
                      form.reset();
                    }} className="space-y-3">
                      <input name="desc" list="common-mess-items" type="text" placeholder="Item (e.g. Cook Salary)" required className="w-full px-5 py-3 text-sm rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                      <datalist id="common-mess-items">
                        <option value="Cook Salary" />
                        <option value="Gas" />
                        <option value="House Maid" />
                        <option value="Garbage is comming" />
                      </datalist>
                      <input name="amount" type="number" step="0.01" placeholder="Amount (₹)" required className="w-full px-5 py-3 text-sm rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                      
                      <button className="w-full bg-brand-accent text-white py-3 rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20">
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </form>

                    <div className="mt-6 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {expenses.filter(e => e.category === 'commonMess').map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 rounded-xl group gap-4">
                          {editingExpense?.id === expense.id ? (
                            <div className="flex-1 flex gap-2 items-center min-w-0">
                              <input 
                                autoFocus
                                className="flex-1 text-sm font-bold bg-brand-bg px-2 py-1 rounded border border-black/10 dark:border-white/10 outline-none min-w-0"
                                value={editingExpense.description}
                                onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                              />
                              <input 
                                type="number"
                                className="w-20 text-sm font-bold bg-brand-bg px-2 py-1 rounded border border-black/10 dark:border-white/10 outline-none shrink-0"
                                value={editingExpense.amount === 0 ? '' : editingExpense.amount}
                                placeholder="0"
                                onChange={(e) => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value) || 0})}
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => { updateExpense(expense.id, editingExpense); setEditingExpense(null); }} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingExpense(null)} className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate text-brand-primary">
                                  {expense.description}
                                </p>
                                <p className="text-[10px] text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center bg-brand-bg/60 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-brand-accent/20 transition-all w-24 shrink-0 px-2 py-1.5 gap-1">
                                  <span className="text-xs font-bold text-gray-400 select-none shrink-0">₹</span>
                                  <input 
                                    type="number"
                                    className="w-full text-sm font-bold bg-transparent border-0 outline-none p-0 focus:ring-0 text-brand-primary"
                                    value={expense.amount === 0 ? '' : expense.amount}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      updateExpense(expense.id, { amount: val });
                                    }}
                                  />
                                </div>
                                <div className="flex gap-1 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                                  <button onClick={() => setEditingExpense(expense)} className="p-1 text-gray-400 hover:text-brand-accent" title="Edit Item Name">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => removeExpense(expense.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete Item">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {expenses.filter(e => e.category === 'commonMess').length === 0 && <p className="text-center text-gray-400 text-xs py-4 italic">No items</p>}
                    </div>
                  </Card>
                </div>

                {/* Common Expenses */}
                <div className="space-y-6">
                  <Card title="Common Expenses" icon={TrendingUp}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value);
                      const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
                      addExpense(amount, desc, 'common', false);
                      form.reset();
                    }} className="space-y-3">
                      <input name="desc" list="common-items" type="text" placeholder="Item (e.g. Currnt)" required className="w-full px-5 py-3 text-sm rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                      <datalist id="common-items">
                        <option value="Currnt" />
                        <option value="Water" />
                        <option value="Paper" />
                        <option value="Internet" />
                      </datalist>
                      <input name="amount" type="number" step="0.01" placeholder="Amount (₹)" required className="w-full px-5 py-3 text-sm rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                      
                      <button className="w-full bg-brand-accent text-white py-3 rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20">
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </form>

                    <div className="mt-6 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {expenses.filter(e => e.category === 'common').map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 rounded-xl group gap-4">
                          {editingExpense?.id === expense.id ? (
                            <div className="flex-1 flex gap-2 items-center min-w-0">
                              <input 
                                autoFocus
                                className="flex-1 text-sm font-bold bg-brand-bg px-2 py-1 rounded border border-black/10 dark:border-white/10 outline-none min-w-0"
                                value={editingExpense.description}
                                onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                              />
                              <input 
                                type="number"
                                className="w-20 text-sm font-bold bg-brand-bg px-2 py-1 rounded border border-black/10 dark:border-white/10 outline-none shrink-0"
                                value={editingExpense.amount === 0 ? '' : editingExpense.amount}
                                placeholder="0"
                                onChange={(e) => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value) || 0})}
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => { updateExpense(expense.id, editingExpense); setEditingExpense(null); }} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingExpense(null)} className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate text-brand-primary">
                                  {expense.description}
                                </p>
                                <p className="text-[10px] text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center bg-brand-bg/60 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-brand-accent/20 transition-all w-24 shrink-0 px-2 py-1.5 gap-1">
                                  <span className="text-xs font-bold text-gray-400 select-none shrink-0">₹</span>
                                  <input 
                                    type="number"
                                    className="w-full text-sm font-bold bg-transparent border-0 outline-none p-0 focus:ring-0 text-brand-primary"
                                    value={expense.amount === 0 ? '' : expense.amount}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      updateExpense(expense.id, { amount: val });
                                    }}
                                  />
                                </div>
                                <div className="flex gap-1 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                                  <button onClick={() => setEditingExpense(expense)} className="p-1 text-gray-400 hover:text-brand-accent" title="Edit Item Name">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => removeExpense(expense.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete Item">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {expenses.filter(e => e.category === 'common').length === 0 && <p className="text-center text-gray-400 text-xs py-4 italic">No items</p>}
                    </div>
                  </Card>
                </div>

                {/* Mess Expenses */}
                <div className="space-y-6">
                  <Card title="Mess Expenses" icon={Receipt}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value);
                      const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
                      const isIncome = (form.elements.namedItem('isIncome') as HTMLInputElement).checked;
                      addExpense(amount, desc, 'mess', isIncome);
                      form.reset();
                    }} className="space-y-3">
                      <input name="desc" list="mess-items" type="text" placeholder="Item (e.g. Daily Expanse)" required className="w-full px-5 py-3 text-sm rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                      <datalist id="mess-items">
                        <option value="Daily Expanse (Milk + Secretary Amount)" />
                        <option value="Mess Expanse" />
                        <option value="Cook Income" />
                      </datalist>
                      <input name="amount" type="number" step="0.01" placeholder="Amount (₹)" required className="w-full px-5 py-3 text-sm rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all" />
                      <div className="flex items-center gap-3 px-2">
                        <input type="checkbox" name="isIncome" id="isIncome" className="w-5 h-5 accent-brand-accent rounded-lg" />
                        <label htmlFor="isIncome" className="text-xs font-bold text-gray-500 uppercase tracking-wider">This is Income</label>
                      </div>
                      <button className="w-full bg-brand-accent text-white py-3 rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20">
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </form>

                    <div className="mt-6 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {expenses.filter(e => e.category === 'mess').map((expense) => (
                        <div key={expense.id} className={`flex justify-between items-center p-3 rounded-xl group gap-4 ${expense.isIncome ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-black/5 dark:bg-white/5'}`}>
                          {editingExpense?.id === expense.id ? (
                            <div className="flex-1 flex gap-2 items-center min-w-0">
                              <input 
                                autoFocus
                                className="flex-1 text-sm font-bold bg-brand-bg px-2 py-1 rounded border border-black/10 dark:border-white/10 outline-none min-w-0"
                                value={editingExpense.description}
                                onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                              />
                              <input 
                                type="number"
                                className="w-20 text-sm font-bold bg-brand-bg px-2 py-1 rounded border border-black/10 dark:border-white/10 outline-none shrink-0"
                                value={editingExpense.amount === 0 ? '' : editingExpense.amount}
                                placeholder="0"
                                onChange={(e) => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value) || 0})}
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => { updateExpense(expense.id, editingExpense); setEditingExpense(null); }} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingExpense(null)} className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate text-brand-primary flex items-center gap-1.5">
                                  {expense.isIncome && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                                  {expense.isIncome && <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider shrink-0 mr-1">Income</span>}
                                  {expense.description}
                                </p>
                                <p className="text-[10px] text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center bg-brand-bg/60 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-brand-accent/20 transition-all w-24 shrink-0 px-2 py-1.5 gap-1">
                                  <span className={`text-xs font-bold ${expense.isIncome ? 'text-emerald-500' : 'text-gray-400'} select-none shrink-0`}>
                                    {expense.isIncome ? '-' : ''}₹
                                  </span>
                                  <input 
                                    type="number"
                                    className={`w-full text-sm font-bold bg-transparent border-0 outline-none p-0 focus:ring-0 ${expense.isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-primary'}`}
                                    value={expense.amount === 0 ? '' : expense.amount}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      updateExpense(expense.id, { amount: val });
                                    }}
                                  />
                                </div>
                                <div className="flex gap-1 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                                  <button onClick={() => setEditingExpense(expense)} className="p-1 text-gray-400 hover:text-brand-accent" title="Edit Item Name">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => removeExpense(expense.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete Item">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {expenses.filter(e => e.category === 'mess').length === 0 && <p className="text-center text-gray-400 text-xs py-4 italic">No items</p>}
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <Card title="Display Settings" icon={isDarkMode ? Moon : Sun}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-brand-primary">Dark Theme</h3>
                    <p className="text-sm text-gray-500">Switch between light and dark visual styles</p>
                  </div>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-14 h-8 rounded-full border-2 transition-all relative ${
                      isDarkMode ? 'bg-brand-accent border-brand-accent' : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <motion.div 
                      animate={{ x: isDarkMode ? 24 : 0 }}
                      className={`w-6 h-6 rounded-full absolute top-0.5 left-0.5 shadow-sm flex items-center justify-center ${
                        isDarkMode ? 'bg-brand-bg text-brand-accent' : 'bg-white text-gray-400'
                      }`}
                    >
                      {isDarkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                    </motion.div>
                  </button>
                </div>
              </Card>

              <Card title="App Logo" icon={Home}>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 bg-card-bg rounded-3xl overflow-hidden shadow-xl border border-black/5 dark:border-white/5">
                    <img 
                      src="/Malnad.png" 
                      alt="App Logo" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2652/2652218.png";
                      }}
                    />
                  </div>
                  <p className="text-xs text-center text-gray-500 max-w-xs">
                    To update the logo, upload your image file as <code className="bg-black/5 px-1 rounded">Malnad.png</code> to the <code className="bg-black/5 px-1 rounded">/public</code> folder.
                  </p>
                </div>
              </Card>

              <Card title="Bill Configuration" icon={Settings}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">President Name</label>
                      <input 
                        type="text" 
                        value={settings.president} 
                        onChange={(e) => setSettings({ ...settings, president: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Secretary Name</label>
                      <input 
                        type="text" 
                        value={settings.secretary} 
                        onChange={(e) => setSettings({ ...settings, secretary: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Month/Year</label>
                    <input 
                      type="text" 
                      value={settings.month} 
                      onChange={(e) => setSettings({ ...settings, month: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Student Rent (₹)</label>
                      <input 
                        type="number" 
                        value={settings.studentRent} 
                        onChange={(e) => setSettings({ ...settings, studentRent: parseInt(e.target.value) || 0 })}
                        className="w-full px-6 py-4 rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Job Holder Rent (₹)</label>
                      <input 
                        type="number" 
                        value={settings.jobRent} 
                        onChange={(e) => setSettings({ ...settings, jobRent: parseInt(e.target.value) || 0 })}
                        className="w-full px-6 py-4 rounded-2xl border border-black/5 bg-brand-bg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Danger Zone" icon={RotateCcw} className="border-red-100 dark:border-red-500/20 bg-red-50/20 dark:bg-red-500/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <p className="font-bold text-red-600 text-lg">Reset All Application Data</p>
                    <p className="text-sm text-red-400">This will permanently delete all members, expenses, and settings. This action cannot be undone.</p>
                  </div>
                  <button 
                    onClick={resetData}
                    className="w-full md:w-auto bg-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset Everything
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-16 text-center text-gray-400 text-sm">
        <p className="font-serif italic">© 2026 Malnad Mane • Professional Mess Management</p>
      </footer>
    </div>
  );
}
