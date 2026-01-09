import { useState, useEffect } from 'react';
import type { DailyReport, MiscEntry } from './types';
import { COMPANIES } from './config';
import { Plus, Trash2, Download, Wallet, TrendingDown, Receipt, RotateCcw, ShoppingBag } from 'lucide-react';

// Componente Auxiliar para o Input Duplo (Valor + Quantidade)
const FinancialInputRow = ({ 
  label, 
  fieldKey, 
  colorClass, 
  report, 
  setReport 
}: { 
  label: string, 
  fieldKey: keyof DailyReport['totals'], 
  colorClass: string,
  report: DailyReport,
  setReport: (r: DailyReport) => void
}) => (
  <div>
    <label className="text-xs text-slate-500 font-medium mb-1 block">{label}</label>
    <div className="flex gap-2">
      {/* Input de VALOR */}
      <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
          <input 
          type="number" 
          className={`w-full border p-2 pl-8 rounded focus:ring-2 ${colorClass} outline-none font-mono text-right`} 
          value={report.totals[fieldKey].value || ''}
          onChange={e => setReport({
              ...report, 
              totals: {
              ...report.totals, 
              [fieldKey]: { ...report.totals[fieldKey], value: Number(e.target.value) }
              }
          })}
          placeholder="0.00"
          />
      </div>
      {/* Input de QUANTIDADE */}
      <div className="relative w-20">
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold pointer-events-none">un</span>
          <input 
          type="number" 
          className={`w-full border p-2 pr-6 rounded focus:ring-2 ${colorClass} outline-none font-mono text-center text-xs`} 
          value={report.totals[fieldKey].quantity || ''}
          onChange={e => setReport({
              ...report, 
              totals: {
              ...report.totals, 
              [fieldKey]: { ...report.totals[fieldKey], quantity: Number(e.target.value) }
              }
          })}
          placeholder="Qtd"
          />
      </div>
    </div>
  </div>
);

function App() {
  const [report, setReport] = useState<DailyReport>(() => {
    const saved = localStorage.getItem('fechamento-caixa-v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getEmptyState(), ...parsed };
    }
    return getEmptyState();
  });

  function getEmptyState(): DailyReport {
    return {
      date: new Date().toISOString().split('T')[0], 
      openingBalance: 0,
      companyEntries: [],
      miscEntries: [],
      totals: {
        creditCard: { value: 0, quantity: 0 },
        debitCard: { value: 0, quantity: 0 },
        pixMachine: { value: 0, quantity: 0 },
        pixPersonal: { value: 0, quantity: 0 },
        cash: { value: 0, quantity: 0 },
        ifood: { value: 0, quantity: 0 }
      },
      expenses: []
    };
  }

  useEffect(() => {
    localStorage.setItem('fechamento-caixa-v1', JSON.stringify(report));
  }, [report]);

  // --- CÁLCULOS ---

  const calculateTotalCompanies = () => {
    return report.companyEntries.reduce((acc, entry) => {
      const company = COMPANIES.find(c => c.id === entry.companyId);
      return acc + (entry.quantity * (company?.pricePerUnit || 0));
    }, 0);
  };
  
  const calculateTotalMisc = () => {
    return report.miscEntries.reduce((acc, entry) => acc + entry.total, 0);
  };

  const calculateTotalItems = () => {
    const vouchersCount = report.companyEntries.reduce((acc, e) => acc + e.quantity, 0);
    const miscCount = report.miscEntries.reduce((acc, e) => acc + e.quantity, 0);
    const financeCount = 
      report.totals.creditCard.quantity + 
      report.totals.debitCard.quantity + 
      report.totals.pixMachine.quantity + 
      report.totals.pixPersonal.quantity + 
      report.totals.cash.quantity + 
      report.totals.ifood.quantity;
    return vouchersCount + financeCount + miscCount;
  };

  const calculateTotalFinance = () => {
    const t = report.totals;
    return t.creditCard.value + t.debitCard.value + t.pixMachine.value + t.pixPersonal.value + t.cash.value + t.ifood.value;
  };

  const calculateTotalExpenses = () => {
    return report.expenses.reduce((acc, item) => acc + item.value, 0);
  };

  // CÁLCULO TOTAL GERAL PEDIDO (Tudo somado - despesas)
  const calculateGrandTotal = () => {
    const entradas = calculateTotalCompanies() + calculateTotalFinance() + calculateTotalMisc();
    return entradas - calculateTotalExpenses();
  };

  // Cálculo Apenas do Dinheiro (Para conferência de gaveta, se precisar)
  const calculateCashBalance = () => {
      return report.openingBalance + calculateTotalFinance() - calculateTotalExpenses();
  };

  const handleCopyReport = () => {
    const totalVouchersVal = calculateTotalCompanies();
    const totalMiscVal = calculateTotalMisc();
    const totalFinanceVal = calculateTotalFinance();
    const totalExpensesVal = calculateTotalExpenses();
    const grandTotal = calculateGrandTotal();
    const cashBalance = calculateCashBalance();
    
    const vouchersDetail = report.companyEntries
      .filter(e => e.quantity > 0)
      .map(e => {
        const company = COMPANIES.find(c => c.id === e.companyId);
        return `- ${company?.name}: ${e.quantity} un`;
      }).join('\n');

    const miscDetail = report.miscEntries
      .map(e => `- ${e.description} (${e.quantity}x): R$ ${e.total.toFixed(2)}`)
      .join('\n');

    const expensesDetail = report.expenses
      .map(e => `- ${e.description}: R$ ${e.value.toFixed(2)}`)
      .join('\n');

    const text = `
📅 *FECHAMENTO - ${report.date.split('-').reverse().join('/')}*
---------------------------
📦 *Total Itens:* ${calculateTotalItems()} und

💵 *Fundo Inicial:* R$ ${report.openingBalance.toFixed(2)}
🏢 *Convênios:* R$ ${totalVouchersVal.toFixed(2)}
💳 *Balcão:* R$ ${totalFinanceVal.toFixed(2)}
🛒 *Avulsos:* R$ ${totalMiscVal.toFixed(2)}
📉 *Despesas:* - R$ ${totalExpensesVal.toFixed(2)}

Eq *TOTAL GERAL:* R$ ${grandTotal.toFixed(2)}
(Dinheiro Previsto na Gaveta: R$ ${cashBalance.toFixed(2)})
---------------------------
🏢 *Detalhamento Convênios:*
${vouchersDetail || '- Nenhum'}

🛒 *Detalhamento Avulsos:*
${miscDetail || '- Nenhum'}

💳 *Detalhamento Financeiro:*
- Crédito: R$ ${report.totals.creditCard.value.toFixed(2)}
- Débito: R$ ${report.totals.debitCard.value.toFixed(2)}
- Pix Maq: R$ ${report.totals.pixMachine.value.toFixed(2)}
- Pix Dona: R$ ${report.totals.pixPersonal.value.toFixed(2)}
- Dinheiro: R$ ${report.totals.cash.value.toFixed(2)}
- iFood: R$ ${report.totals.ifood.value.toFixed(2)}

🔻 *Saídas:*
${expensesDetail || '- Nenhuma'}
    `.trim();

    navigator.clipboard.writeText(text);
    alert("Relatório copiado!");
  };

  const addVoucherRow = () => {
    setReport({
      ...report,
      companyEntries: [...report.companyEntries, { companyId: '', quantity: 0 }]
    });
  };

  const addMiscRow = () => {
    setReport({
      ...report,
      miscEntries: [...report.miscEntries, { 
        id: crypto.randomUUID(), 
        description: '', 
        quantity: 1, 
        unitPrice: 0, 
        total: 0 
      }]
    });
  };

  const updateMiscRow = (index: number, field: keyof MiscEntry, value: string | number) => {
    const newEntries = [...report.miscEntries];
    const entry = newEntries[index];
    
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) : entry.quantity;
      const price = field === 'unitPrice' ? Number(value) : entry.unitPrice;
      entry.quantity = qty;
      entry.unitPrice = price;
      entry.total = qty * price;
    } else if (field === 'description') {
      entry.description = String(value);
    }

    setReport({ ...report, miscEntries: newEntries });
  };

  const handleStartNewDay = () => {
    if (window.confirm("Isso vai ZERAR todos os dados. Tem certeza?")) {
      setReport(getEmptyState()); 
      localStorage.removeItem('fechamento-caixa-v1'); 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-10">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Fechamento Diário</h1>
            <p className="text-xs text-slate-400 font-medium">Controle Brutal de Caixa</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white border p-2 rounded flex flex-col items-start w-32">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Fundo de Caixa</label>
                <div className="flex items-center gap-1 w-full">
                    <span className="text-slate-400 text-xs">R$</span>
                    <input 
                        type="number" 
                        className="w-full outline-none font-bold text-slate-700 bg-transparent"
                        placeholder="0.00"
                        value={report.openingBalance || ''}
                        onChange={(e) => setReport({...report, openingBalance: Number(e.target.value)})}
                    />
                </div>
            </div>
            <input 
                type="date" 
                className="border p-2 rounded bg-white font-medium text-slate-600 h-[58px]"
                value={report.date}
                onChange={(e) => setReport({...report, date: e.target.value})}
            />
          </div>
        </header>

        {/* BLOCO 1: VOUCHERS */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
              🏢 Vouchers & Convênios
            </h2>
          </div>
          
          <div className="space-y-3">
            {report.companyEntries.map((entry, index) => {
              const selectedCompany = COMPANIES.find(c => c.id === entry.companyId);
              return (
                <div key={index} className="flex gap-2 items-end animate-fadeIn">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 font-bold ml-1">Empresa</label>
                    <select
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white h-[42px]"
                      value={entry.companyId}
                      onChange={e => {
                        const newEntries = [...report.companyEntries];
                        newEntries[index].companyId = e.target.value;
                        setReport({ ...report, companyEntries: newEntries });
                      }}
                    >
                      <option value="" disabled>Selecione...</option>
                      {COMPANIES.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="text-xs text-slate-500 font-bold ml-1">Qtd</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center h-[42px]"
                      value={entry.quantity || ''}
                      onChange={e => {
                        const newEntries = [...report.companyEntries];
                        newEntries[index].quantity = Number(e.target.value);
                        setReport({ ...report, companyEntries: newEntries });
                      }}
                    />
                  </div>
                  <div className="w-24 text-right pb-2 hidden md:block">
                    <div className="text-xs text-slate-400">Total</div>
                    <div className="font-bold text-slate-700">
                      R$ {((entry.quantity || 0) * (selectedCompany?.pricePerUnit || 0)).toFixed(2)}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        const newEntries = report.companyEntries.filter((_, i) => i !== index);
                        setReport({ ...report, companyEntries: newEntries });
                    }}
                    className="h-[42px] w-[42px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
            
            {/* BOTÃO ADICIONAR (MOVIDO PARA O FINAL) */}
            <button 
              onClick={addVoucherRow}
              className="w-full py-3 mt-2 rounded-lg border-2 border-dashed border-blue-200 text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all font-medium flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Adicionar Convênio
            </button>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-slate-600 font-medium">Total em Vouchers:</span>
            <span className="text-xl font-bold text-blue-600">
              R$ {calculateTotalCompanies().toFixed(2)}
            </span>
          </div>
        </section>

        {/* BLOCO NOVO: ITENS AVULSOS */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-orange-400">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
              <ShoppingBag size={20} className="text-orange-500"/> Vendas Avulsas
            </h2>
          </div>
          
          <div className="space-y-3">
             {report.miscEntries.map((entry, index) => (
               <div key={entry.id} className="flex flex-wrap md:flex-nowrap gap-2 items-end animate-fadeIn bg-slate-50 p-2 rounded-lg md:bg-transparent md:p-0">
                 {/* ... (Mesmo código de Inputs Avulsos) ... */}
                 <div className="w-full md:flex-1">
                   <label className="text-xs text-slate-500 font-bold ml-1 md:hidden">Descrição</label>
                   <input 
                     type="text" 
                     placeholder="Ex: 3 Cocas..."
                     className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-300 outline-none h-[42px]"
                     value={entry.description}
                     onChange={e => updateMiscRow(index, 'description', e.target.value)}
                   />
                 </div>
                 <div className="w-1/3 md:w-20">
                   <label className="text-xs text-slate-500 font-bold ml-1 md:hidden">Qtd</label>
                   <input 
                     type="number"
                     placeholder="Qtd" 
                     className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-300 outline-none text-center h-[42px]"
                     value={entry.quantity || ''}
                     onChange={e => updateMiscRow(index, 'quantity', e.target.value)}
                   />
                 </div>
                 <div className="w-1/3 md:w-24 relative">
                   <label className="text-xs text-slate-500 font-bold ml-1 md:hidden">V. Unit</label>
                   <span className="absolute left-2 top-[5px] md:top-[10px] text-slate-400 text-xs">R$</span>
                   <input 
                     type="number"
                     placeholder="Unit." 
                     className="w-full border p-2 pl-6 rounded focus:ring-2 focus:ring-orange-300 outline-none text-right h-[42px]"
                     value={entry.unitPrice || ''}
                     onChange={e => updateMiscRow(index, 'unitPrice', e.target.value)}
                   />
                 </div>
                 <div className="w-1/3 md:w-24 text-right pb-2">
                   <div className="text-xs text-slate-400 hidden md:block">Total</div>
                   <div className="font-bold text-slate-700 h-[42px] flex items-center justify-end">
                     R$ {entry.total.toFixed(2)}
                   </div>
                 </div>
                 <button 
                    onClick={() => {
                        const newEntries = report.miscEntries.filter((_, i) => i !== index);
                        setReport({ ...report, miscEntries: newEntries });
                    }}
                    className="h-[42px] w-[42px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
               </div>
             ))}
             
             {/* BOTÃO ADICIONAR (AVULSOS) */}
             <button 
              onClick={addMiscRow}
              className="w-full py-3 mt-2 rounded-lg border-2 border-dashed border-orange-200 text-orange-500 hover:bg-orange-50 hover:border-orange-300 transition-all font-medium flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Adicionar Avulso
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
             <span className="text-slate-600 font-medium">Total Avulsos:</span>
             <span className="text-lg font-bold text-orange-600">
                 R$ {calculateTotalMisc().toFixed(2)}
             </span>
          </div>
        </section>

        {/* BLOCO 2: FINANCEIRO */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <Wallet size={20} /> Entradas Financeiras (Balcão)
          </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 border-b pb-2">Sistema / Maquininha</h3>
              <FinancialInputRow label="Crédito" fieldKey="creditCard" colorClass="focus:ring-blue-500" report={report} setReport={setReport} />
              <FinancialInputRow label="Débito" fieldKey="debitCard" colorClass="focus:ring-blue-500" report={report} setReport={setReport} />
              <FinancialInputRow label="Pix (Maquininha)" fieldKey="pixMachine" colorClass="focus:ring-blue-500" report={report} setReport={setReport} />
            </div>
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 border-b pb-2">Externo / Outros</h3>
              <FinancialInputRow label="Pix (Conta Dona)" fieldKey="pixPersonal" colorClass="focus:ring-purple-500" report={report} setReport={setReport} />
              <FinancialInputRow label="Dinheiro (Espécie)" fieldKey="cash" colorClass="focus:ring-green-500" report={report} setReport={setReport} />
              <FinancialInputRow label="iFood (Portal)" fieldKey="ifood" colorClass="focus:ring-red-500" report={report} setReport={setReport} />
            </div>
          </div>

          {/* NOVO: TOTAL DO FINANCEIRO */}
          <div className="mt-6 pt-4 border-t flex justify-between items-center">
            <span className="text-slate-600 font-medium">Total Balcão (Financeiro):</span>
            <span className="text-xl font-bold text-green-600">
              R$ {calculateTotalFinance().toFixed(2)}
            </span>
          </div>
        </section>

        {/* BLOCO 3: SAÍDAS */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
              <TrendingDown size={20} /> Saídas & Despesas
            </h2>
          </div>
          <div className="space-y-3">
            {report.expenses.map((expense, index) => (
              <div key={expense.id} className="flex gap-2 items-center animate-fadeIn">
                <input 
                  type="text" 
                  placeholder="Descrição (ex: Gelo)"
                  className="flex-1 border p-2 rounded focus:ring-2 focus:ring-red-200 outline-none h-[42px]"
                  value={expense.description}
                  onChange={e => {
                    const newExpenses = [...report.expenses];
                    newExpenses[index].description = e.target.value;
                    setReport({...report, expenses: newExpenses});
                  }}
                />
                <input 
                  type="number" 
                  placeholder="R$"
                  className="w-28 border p-2 rounded focus:ring-2 focus:ring-red-200 outline-none font-mono text-right h-[42px]"
                  value={expense.value || ''}
                  onChange={e => {
                    const newExpenses = [...report.expenses];
                    newExpenses[index].value = Number(e.target.value);
                    setReport({...report, expenses: newExpenses});
                  }}
                />
                 <button 
                  onClick={() => {
                    const newExpenses = report.expenses.filter((_, i) => i !== index);
                    setReport({...report, expenses: newExpenses});
                  }}
                  className="h-[42px] w-[42px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            {/* BOTÃO ADICIONAR (SAÍDAS) */}
            <button 
              onClick={() => setReport({
                ...report, 
                expenses: [...report.expenses, { id: crypto.randomUUID(), description: '', value: 0 }]
              })}
              className="w-full py-3 mt-2 rounded-lgWZ border-2 border-dashed border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all font-medium flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Adicionar Despesa
            </button>
          </div>

           {/* NOVO: TOTAL DE SAÍDAS */}
           <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-slate-600 font-medium">Total Despesas:</span>
            <span className="text-xl font-bold text-red-600">
              - R$ {calculateTotalExpenses().toFixed(2)}
            </span>
          </div>
        </section>

        {/* BLOCO 4: RESUMO GERAL REFEITO */}
        <section className="bg-slate-900 text-white p-6 rounded-xl shadow-lg mt-8">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-300 border-b border-slate-700 pb-4">
                <Receipt size={20} className="text-yellow-400"/> Relatório Final
            </h2>

            {/* GRID DE RESUMO DETALHADO */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                
                {/* 1. FUNDO DE CAIXA */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        1. Fundo Inicial
                    </span>
                    <span className="text-lg font-medium text-white">
                        R$ {report.openingBalance.toFixed(2)}
                    </span>
                </div>

                {/* 2. LUCRO CONVÊNIOS */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="block text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">
                        2. Convênios
                    </span>
                    <span className="text-lg font-medium text-white">
                        + R$ {calculateTotalCompanies().toFixed(2)}
                    </span>
                </div>

                {/* 3. LUCRO BALCÃO */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="block text-[10px] text-green-400 uppercase font-bold tracking-wider mb-1">
                        3. Balcão (Finan.)
                    </span>
                    <span className="text-lg font-medium text-white">
                        + R$ {calculateTotalFinance().toFixed(2)}
                    </span>
                </div>

                {/* 4. LUCRO AVULSOS */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="block text-[10px] text-orange-400 uppercase font-bold tracking-wider mb-1">
                        4. Avulsos
                    </span>
                    <span className="text-lg font-medium text-white">
                        + R$ {calculateTotalMisc().toFixed(2)}
                    </span>
                </div>

                {/* 5. DESPESAS */}
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <span className="block text-[10px] text-red-400 uppercase font-bold tracking-wider mb-1">
                        5. Despesas
                    </span>
                    <span className="text-lg font-medium text-red-400">
                        - R$ {calculateTotalExpenses().toFixed(2)}
                    </span>
                </div>

                 {/* 6. TOTAL GERAL (Soma Tudo - Despesas) */}
                 <div className="bg-indigo-900 p-3 rounded border border-indigo-700 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-indigo-500 w-8 h-8 rounded-bl-full opacity-20"></div>
                    <span className="block text-[10px] text-indigo-300 uppercase font-bold tracking-wider mb-1">
                        6. Total Geral (Somado)
                    </span>
                    <span className="text-2xl font-black text-white">
                        R$ {calculateGrandTotal().toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <button 
                  onClick={handleCopyReport}
                  className="w-full md:w-64 bg-white text-slate-900 py-3 rounded-lg font-bold hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                  <Download size={20} />
                  Copiar Relatório
              </button>

              <button 
                  onClick={handleStartNewDay}
                  className="w-full md:w-auto bg-slate-800 text-slate-400 py-3 px-6 rounded-lg font-medium hover:bg-red-900/30 hover:text-red-400 border border-transparent active:scale-95 transition-all flex items-center justify-center gap-2"
                  title="Limpar tudo e iniciar novo dia"
              >
                  <RotateCcw size={20} />
                  <span className="md:hidden">Iniciar Novo Dia</span>
              </button>
            </div>
        </section>

      </div>
    </div>
  );
}

export default App;