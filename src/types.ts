// Define o formato de uma empresa 
export interface CompanyConfig {
  id: string;
  name: string;
  pricePerUnit: number; 
}

// Define o input diário de uma empresa
export interface CompanyEntry {
  companyId: string;
  quantity: number;
}

// Define o relatório diário completo
export interface DailyReport {
  date: string;
  
  // Bloco 1: Vouchers/Empresas
  companyEntries: CompanyEntry[];
  
  // Bloco 2: Totais Financeiros (Digitados do sistema/maquininha)
  totals: {
    creditCard: number;
    debitCard: number;
    pixMachine: number;
    pixPersonal: number;
    cash: number;
    ifood: number;
  };

  // Bloco 3: Saídas
  expenses: {
    id: string;
    description: string;
    value: number;
  }[];
}