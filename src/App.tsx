import { useState, useEffect } from 'react';
import type { DailyReport } from './types';
import { COMPANIES } from './config';
import { Plus, Trash2, Download, Wallet, TrendingDown, Receipt, RotateCcw } from 'lucide-react';

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
  // Estado inicial inteligente (Migração de dados antigos se necessário)
  const [report, setReport] = useState<DailyReport>(() => {
    const saved = localStorage.getItem('fechamento-caixa-v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Pequena proteção: Se o salvo for do formato antigo (sem .value), reseta ou adapta
      // Para simplificar no dev, se der erro de estrutura, assumimos zerado.
      if (typeof parsed.totals.creditCard === 'number') {
        return getEmptyState();
      }
      return parsed;
    }
    return getEmptyState();
  });

  // Função para gerar o estado zerado (ajuda na organização)
  function getEmptyState(): DailyReport {
    return {
      date: new Date().toISOString().split('T')[0], 
      companyEntries: [],
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

  // Persistência
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
  
  // Calcula Quantidade TOTAL de marmitas/itens (Vouchers + Financeiro)
  const calculateTotalItems = () => {
    const vouchersCount = report.companyEntries.reduce((acc, e) => acc + e.quantity, 0);
    const financeCount = 
      report.totals.creditCard.quantity + 
      report.totals.debitCard.quantity + 
      report.totals.pixMachine.quantity + 
      report.totals.pixPersonal.quantity + 
      report.totals.cash.quantity + 
      report.totals.ifood.quantity;
    return vouchersCount + financeCount;
  };

  const calculateTotalFinance = () => {
    const t = report.totals;
    // Agora acessamos .value
    return t.creditCard.value + t.debitCard.value + t.pixMachine.value + t.pixPersonal.value + t.cash.value + t.ifood.value;
  };

  const calculateTotalExpenses = () => {
    return report.expenses.reduce((acc, item) => acc + item.value, 0);
  };

  const calculateNetTotal = () => {
    return (calculateTotalCompanies() + calculateTotalFinance()) - calculateTotalExpenses();
  };

  const handleCopyReport = () => {
    const totalVouchersVal = calculateTotalCompanies();
    const totalFinanceVal = calculateTotalFinance();
    const totalExpensesVal = calculateTotalExpenses();
    const net = calculateNetTotal();
    const totalItems = calculateTotalItems();

    const vouchersDetail = report.companyEntries
      .filter(e => e.quantity > 0)
      .map(e => {
        const company = COMPANIES.find(c => c.id === e.companyId);
        return `- ${company?.name}: ${e.quantity} un`;
      }).join('\n');

    const expensesDetail = report.expenses
      .map(e => `- ${e.description}: R$ ${e.value.toFixed(2)}`)
      .join('\n');

    const text = `
📅 *FECHAMENTO - ${report.date.split('-').reverse().join('/')}*
---------------------------
📦 *Total Itens/Marmitas:* ${totalItems} und
💰 *Venda Total:* R$ ${(totalVouchersVal + totalFinanceVal).toFixed(2)}
📉 *Despesas:* R$ ${totalExpensesVal.toFixed(2)}
✅ *LÍQUIDO:* R$ ${net.toFixed(2)}
---------------------------
🏢 *Convênios (R$ ${totalVouchersVal.toFixed(2)}):*
${vouchersDetail || '- Nenhum'}

💳 *Financeiro (R$ ${totalFinanceVal.toFixed(2)}):*
- Crédito: R$ ${report.totals.creditCard.value.toFixed(2)} (${report.totals.creditCard.quantity} und)
- Débito: R$ ${report.totals.debitCard.value.toFixed(2)} (${report.totals.debitCard.quantity} und)
- Pix Maq: R$ ${report.totals.pixMachine.value.toFixed(2)} (${report.totals.pixMachine.quantity} und)
- Pix Dona: R$ ${report.totals.pixPersonal.value.toFixed(2)} (${report.totals.pixPersonal.quantity} und)
- Dinheiro: R$ ${report.totals.cash.value.toFixed(2)} (${report.totals.cash.quantity} und)
- iFood: R$ ${report.totals.ifood.value.toFixed(2)} (${report.totals.ifood.quantity} und)

🔻 *Saídas:*
${expensesDetail || '- Nenhuma'}
    `.trim();

    navigator.clipboard.writeText(text);
    alert("Relatório copiado! Pode colar no WhatsApp.");
  };

  const addVoucherRow = () => {
    setReport({
      ...report,
      companyEntries: [...report.companyEntries, { companyId: '', quantity: 0 }]
    });
  };

  const removeVoucherRow = (index: number) => {
    const newEntries = report.companyEntries.filter((_, i) => i !== index);
    setReport({ ...report, companyEntries: newEntries });
  };

  const handleStartNewDay = () => {
    if (window.confirm("Tem certeza? Isso vai APAGAR todos os dados de hoje para iniciar um novo dia.")) {
      setReport(getEmptyState()); 
      localStorage.removeItem('fechamento-caixa-v1'); 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-10">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Fechamento Diário</h1>
          <input 
            type="date" 
            className="border p-2 rounded bg-white font-medium text-slate-600"
            value={report.date}
            onChange={(e) => setReport({...report, date: e.target.value})}
          />
        </header>

        {/* BLOCO 1: VOUCHERS */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
              🏢 Vouchers & Convênios
            </h2>
            <button 
              onClick={addVoucherRow}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={16} /> Adicionar
            </button>
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
                    onClick={() => removeVoucherRow(index)}
                    className="h-[42px] w-[42px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
            {report.companyEntries.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded border border-dashed border-slate-300 text-slate-400 text-sm">
                Nenhum convênio adicionado hoje.<br/>
                <span className="text-xs opacity-70">Clique em "Adicionar" se houver vouchers.</span>
              </div>
            )}
          </div>
          {report.companyEntries.length > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="text-slate-600 font-medium">Total em Vouchers:</span>
              <span className="text-xl font-bold text-blue-600">
                R$ {calculateTotalCompanies().toFixed(2)}
              </span>
            </div>
          )}
        </section>

        {/* BLOCO 2: FINANCEIRO (ATUALIZADO COM QTD) */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <Wallet size={20} /> Entradas Financeiras
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1: Maquininha */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 border-b pb-2">Sistema / Maquininha</h3>
              <FinancialInputRow label="Crédito" fieldKey="creditCard" colorClass="focus:ring-blue-500" report={report} setReport={setReport} />
              <FinancialInputRow label="Débito" fieldKey="debitCard" colorClass="focus:ring-blue-500" report={report} setReport={setReport} />
              <FinancialInputRow label="Pix (Maquininha)" fieldKey="pixMachine" colorClass="focus:ring-blue-500" report={report} setReport={setReport} />
            </div>

            {/* Coluna 2: Externo */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 border-b pb-2">Externo / Outros</h3>
              <FinancialInputRow label="Pix (Conta Dona)" fieldKey="pixPersonal" colorClass="focus:ring-purple-500" report={report} setReport={setReport} />
              <FinancialInputRow label="Dinheiro (Espécie)" fieldKey="cash" colorClass="focus:ring-green-500" report={report} setReport={setReport} />
              <FinancialInputRow label="iFood (Portal)" fieldKey="ifood" colorClass="focus:ring-red-500" report={report} setReport={setReport} />
            </div>
          </div>
        </section>

        {/* BLOCO 3: SAÍDAS */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
              <TrendingDown size={20} /> Saídas & Despesas
            </h2>
            <button 
              onClick={() => setReport({
                ...report, 
                expenses: [...report.expenses, { id: crypto.randomUUID(), description: '', value: 0 }]
              })}
              className="text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={16} /> Adicionar
            </button>
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
            
            {report.expenses.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded border border-dashed border-slate-300 text-slate-400 text-sm">
                Nenhuma saída registrada hoje.<br/>
                <span className="text-xs opacity-70">Clique em "Adicionar" se houver gastos.</span>
              </div>
            )}
          </div>
        </section>

        {/* BLOCO 4: RESUMO GERAL ESTÁTICO */}
        <section className="bg-slate-900 text-white p-6 rounded-xl shadow-lg mt-8">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-300">
                <Receipt size={20} /> Resumo do Fechamento
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <div>
                    <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Bruto Total</span>
                    <span className="text-2xl font-bold text-white">
                        R$ {(calculateTotalCompanies() + calculateTotalFinance()).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">
                      {calculateTotalItems()} itens vendidos
                    </span>
                </div>
                <div>
                    <span className="block text-red-300 text-xs uppercase font-bold tracking-wider mb-1">Saídas</span>
                    <span className="text-2xl font-bold text-red-400">
                        - R$ {calculateTotalExpenses().toFixed(2)}
                    </span>
                </div>
                <div className="col-span-2 md:col-span-1 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-700">
                    <span className="block text-green-400 text-xs uppercase font-bold tracking-wider mb-1">Líquido Final</span>
                    <span className="text-3xl font-black text-green-400">
                        R$ {calculateNetTotal().toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              {/* Botão Principal: Copiar */}
              <button 
                  onClick={handleCopyReport}
                  // Mudei de 'flex-1' para 'w-full md:w-64' (Tamanho fixo no PC, total no celular)
                  className="w-full md:w-64 bg-white text-slate-900 py-3 rounded-lg font-bold hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                  <Download size={20} />
                  Copiar Relatório
              </button>

              {/* Botão Secundário: Novo Dia */}
              <button 
                  onClick={handleStartNewDay}
                  // Mudei para 'w-full md:w-auto' para ficar harmonico
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