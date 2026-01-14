
export type Category = 'Orçamento' | 'Pesquisa de Fuga' | 'Desentupimentos' | 'Serviços' | 'Geral' | 'Outros';

export type ApptStage = 
  | 'Leads' 
  | 'Visita Técnica' 
  | 'Orçamentos a Fazer' 
  | 'Relatórios a Fazer'
  | 'Aguardando Resposta' 
  | 'Serviços a Fazer' 
  | 'Em Execução' 
  | 'Retrabalho'
  | 'A Receber'
  | 'Concluído'
  | 'Recusados';

export interface SavedResponse {
  id: string;
  title: string;
  content: string;
  category: Category;
  lastUpdated: number;
}

export interface Attachment {
  name: string;
  type: string;
  size: string;
  date: string;
  url: string;
}

export interface Appointment {
  id: string;
  customer_id: string;
  customer_name?: string; 
  company_name?: string;
  service_type: string;
  description: string; 
  notes?: string; 
  attachments?: Attachment[]; 
  scheduled_at: string; // Data ISO
  start_time?: string;  // Ex: "10:00"
  end_time?: string;    // Ex: "12:00"
  status: 'Pendente' | 'Concluído' | 'Cancelado';
  price: number;
  stage: ApptStage;
  expected_revenue: number;
  probability: number;
  phone?: string;
  email?: string;
  nif?: string;
  tech_sent_at?: string; // Novo campo para rastreio
}
