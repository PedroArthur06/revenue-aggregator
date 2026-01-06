export interface CompanyConfig {
  id: string;
  name: string;
  pricePerUnit: number;
}

export interface CompanyEntry {
  companyId: string;
  quantity: number;
}

// Novo tipo para agrupar Valor + Quantidade
export interface FinancialEntry {
  value: number;
  quantity: number; // Quantidade de itens/pedidos
}

export interface DailyReport {
  date: string;
  
  companyEntries: CompanyEntry[];
  
  // Agora cada método tem Valor E Quantidade
  totals: {
    creditCard: FinancialEntry;
    debitCard: FinancialEntry;
    pixMachine: FinancialEntry;
    pixPersonal: FinancialEntry;
    cash: FinancialEntry;
    ifood: FinancialEntry;
  };

  expenses: {
    id: string;
    description: string;
    value: number;
  }[];
}