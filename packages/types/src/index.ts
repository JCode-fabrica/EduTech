// Core domain models
export type Role = 'admin' | 'coordenacao' | 'professor';
export type ProvaStatus = 'DRAFT' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'APPROVED';

export interface Escola {
  id: string;
  nome: string;
  slug?: string | null;
  logo_url?: string | null;
  created_at: string;
  endereco?: string | null;
  contato_nome?: string | null;
  contato_cpf?: string | null;
  contato_email?: string | null;
  contato_tel?: string | null;
  contrato_inicio?: string | null; // ISO date
  contrato_fim?: string | null; // ISO date
  observacoes?: string | null;
}

export interface Turma {
  id: string;
  escola_id: string;
  nome_exibicao: string;
  ano_letivo: number;
  turno: string;
}

export interface Materia {
  id: string;
  escola_id: string;
  nome: string;
}

export interface Usuario {
  id: string;
  escola_id?: string | null; // null para admin global
  nome: string;
  email: string;
  role: Role;
  senha_hash?: string;
  ativo: boolean;
  must_change_password?: boolean;
}

export interface ProfessorTurma {
  id: string;
  professor_id: string;
  turma_id: string;
}

export interface ProfessorTurmaMateria {
  id: string;
  professor_turma_id: string;
  materia_id: string;
}

export interface Template {
  id: string;
  escola_id?: string | null;
  nome: string;
  regras_json: Record<string, unknown>;
  versao: string;
  ativo: boolean;
}

export type QuestaoTipo = 'objetiva' | 'dissertativa';

export interface Questao {
  id: string;
  prova_id: string;
  ordem: number;
  tipo: QuestaoTipo;
  enunciado: string;
  alternativas?: string[];
  correta_index?: number | null;
  images_refs?: string[];
  images_inline_ids?: string[];
}

export interface Prova {
  id: string;
  escola_id: string;
  autor_id: string;
  titulo_interno: string;
  turma_id: string;
  materia_id: string;
  template_id: string;
  status: ProvaStatus;
  render_opts_json?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ImagemUpload {
  id: string;
  escola_id: string;
  prova_id: string;
  filename: string;
  storage_url: string;
  alt_text: string;
  legenda?: string;
  prefer_glossary?: boolean;
  ref_code?: string; // ex: IMAGEM 1
}

export interface AnaliseIAResumoScores {
  gramatica: number;
  coerencia: number;
  aderencia: number;
}

export interface AnaliseIAQuestaoItem {
  questao_id: string;
  issues: string[];
  sugestoes: string[];
}

export interface AnaliseIAUso {
  mostradas: number;
  aplicadas: number;
  tempo_seg: number;
}

export interface AnaliseIA {
  id: string;
  prova_id: string;
  resumo_scores: AnaliseIAResumoScores;
  por_questao: AnaliseIAQuestaoItem[];
  uso: AnaliseIAUso;
}

export interface RevisaoCoordenacao {
  id: string;
  prova_id: string;
  coordenador_id: string;
  status: 'APPROVED' | 'CHANGES_REQUESTED';
  comentario?: string;
  created_at: string;
}

// DTOs
export interface LoginRequest { email: string; senha: string }
export interface LoginResponse {
  token: string;
  user: Pick<Usuario, 'id' | 'nome' | 'email' | 'role' | 'escola_id' | 'must_change_password'>;
}

export interface CreateProvaRequest {
  titulo_interno: string;
  turma_id: string;
  materia_id: string;
  template_id: string;
  questoes: Array<
    Pick<Questao, 'tipo' | 'enunciado' | 'alternativas' | 'correta_index' | 'images_refs' | 'images_inline_ids'>
  >;
}

export interface UpdateProvaRequest extends Partial<CreateProvaRequest> {}

export interface IAResultResponse extends AnaliseIA {}

export interface SubmitProvaResponse { id: string; status: ProvaStatus }

export type ApproveProvaResponse = SubmitProvaResponse;
export type RequestChangesResponse = SubmitProvaResponse & { comentario: string };

export interface RelatorioResponse {
  formato: 'PDF' | 'JSON';
  url?: string; // para PDF
  data?: Record<string, unknown>; // para JSON
}

export interface MeResponse {
  user: LoginResponse['user'];
  escola?: Escola;
}
