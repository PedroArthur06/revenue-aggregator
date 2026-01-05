import { useState } from 'react';
import type { CompanyEntry, DailyReport } from './types';
import { COMPANIES } from './config';
import { Plus, Trash2, Download } from 'lucide-react'; 

function App() {
  // Estado inicial do dia
  const [report, setReport] = useState<DailyReport>({
    date: new Date().toISOString().split('T')[0], 
    companyEntries: COMPANIES.map(c => ({ companyId: c.id, quantity: 0 })),
    totals: {
      creditCard: 0,
      debitCard: 0,
      pixMachine: 0,
      pixPersonal: 0,
      cash: 0,
      ifood: 0
    },
    expenses: []
  });

  // Função auxiliar para calcular totais em tempo real
  const calculateTotalCompanies = () => {
    return report.companyEntries.reduce((acc, entry) => {
      const company = COMPANIES.find(c => c.id === entry.companyId);
      return acc + (entry.quantity * (company?.pricePerUnit || 0));
    }, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Fechamento Diário</h1>
          <input 
            type="date" 
            className="border p-2 rounded bg-white"
            value={report.date}
            onChange={(e) => setReport({...report, date: e.target.value})}
          />
        </header>

        {/* BLOCO 1: EMPRESAS / VOUCHERS */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🏢 Vouchers & Convênios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.companyEntries.map((entry, index) => {
              const company = COMPANIES.find(c => c.id === entry.companyId);
              if (!company) return null;

              return (
                <div key={company.id} className="flex flex-col">
                  <label className="text-sm text-slate-600 font-medium mb-1">
                    {company.name} (R$ {company.pricePerUnit.toFixed(2)})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Qtd."
                      value={entry.quantity || ''}
                      onChange={(e) => {
                        const newEntries = [...report.companyEntries];
                        newEntries[index].quantity = Number(e.target.value);
                        setReport({ ...report, companyEntries: newEntries });
                      }}
                    />
                    <span className="text-sm font-bold text-slate-500 w-24 text-right">
                      R$ {(entry.quantity * company.pricePerUnit).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center bg-slate-50 p-2 rounded">
            <span className="text-slate-600">Subtotal Convênios:</span>
            <span className="text-xl font-bold text-green-600">
              R$ {calculateTotalCompanies().toFixed(2)}
            </span>
          </div>
        </section>

        {/* ... AQUI VAMOS COLOCAR OS OUTROS BLOCOS DEPOIS ... */}

      </div>
    </div>
  );
}

export default App;