export interface CompanyConfig {
  id: string;
  name: string;
  pricePerUnit: number;
}

export interface CompanyEntry {
  companyId: string;
  quantity: number;
}

// Novo tipo para itens avulsos
export interface MiscEntry {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface FinancialEntry {
  value: number;
  quantity: number;
}

export interface DailyReport {
  date: string;
  
  // O dinheiro que já estava na gaveta
  openingBalance: number;

  companyEntries: CompanyEntry[];
  
  // Lista de itens soltos (Cocas, doces, etc)
  miscEntries: MiscEntry[];

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