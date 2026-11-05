// Regras da grade semanal (aba "Grade Semanal" em Cursos e Turmas).
// Ficam aqui para que a grade e o dashboard usem exatamente o mesmo critério.

export const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

// Horários disponíveis para novas turmas e exibidos na grade semanal.
export const HORARIOS = [
  { turno: "Manhã", label: "08:30–10:00", inicio: "08:30", fim: "10:00" },
  { turno: "Manhã", label: "10:00–11:30", inicio: "10:00", fim: "11:30" },
  { turno: "Tarde", label: "14:30–16:00", inicio: "14:30", fim: "16:00" },
  { turno: "Tarde", label: "16:00–17:30", inicio: "16:00", fim: "17:30" },
] as const;

// Horários descontinuados: não aparecem mais na grade nem para novas turmas,
// mas continuam sendo reconhecidos para exibir corretamente as turmas encerradas.
export const HORARIOS_DESATIVADOS = [
  { turno: "Manhã", label: "08:30–09:30", inicio: "08:30", fim: "09:30" },
  { turno: "Manhã", label: "09:30–10:30", inicio: "09:30", fim: "10:30" },
  { turno: "Manhã", label: "10:30–11:30", inicio: "10:30", fim: "11:30" },
  { turno: "Tarde", label: "14:30–15:30", inicio: "14:30", fim: "15:30" },
  { turno: "Tarde", label: "15:30–16:30", inicio: "15:30", fim: "16:30" },
  { turno: "Tarde", label: "16:30–17:30", inicio: "16:30", fim: "17:30" },
] as const;

export type TurmaHorario = {
  turno?: string | null;
  horario?: string | null;
  data_hora_inicio?: string | null;
  dias_semana?: string[] | null;
  status?: string | null;
};

export function getHorarioByLabel(label: string) {
  return [...HORARIOS, ...HORARIOS_DESATIVADOS].find((h) => h.label === label);
}

export function getHorarioLabel(turma: TurmaHorario) {
  if (turma.horario) {
    const horarioSalvo = turma.horario.replace(/\s*[-–]\s*/g, "–");
    const h = [...HORARIOS, ...HORARIOS_DESATIVADOS].find((h) => h.label === horarioSalvo);
    if (h) return h.label;

    // Mantém compatibilidade com horários antigos salvos no banco.
    const horariosAntigos: Record<string, string> = {
      "08:30–10:00": "08:30–10:00",
      "10:00–11:30": "10:00–11:30",
      "14:30–16:00": "14:30–16:00",
      "16:00–17:30": "16:00–17:30",
    };
    if (horariosAntigos[horarioSalvo]) return horariosAntigos[horarioSalvo];

    return turma.horario;
  }
  if (turma.data_hora_inicio) {
    const data = new Date(turma.data_hora_inicio);
    const horaBrasil = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(data);

    if (turma.turno === "Manhã") {
      if (horaBrasil === "08:30") return "08:30–10:00";
      if (horaBrasil === "09:30") return "09:30–10:30";
      if (horaBrasil === "10:00") return "10:00–11:30";
      if (horaBrasil === "10:30") return "10:30–11:30";
    }
    if (turma.turno === "Tarde") {
      if (horaBrasil === "14:30") return "14:30–16:00";
      if (horaBrasil === "15:30") return "15:30–16:30";
      if (horaBrasil === "16:00") return "16:00–17:30";
      if (horaBrasil === "16:30") return "16:30–17:30";
    }
  }
  return turma.turno === "Manhã" ? "08:30–10:00" : "14:30–16:00";
}

// Uma turma aparece na grade quando não está encerrada, tem um horário que
// existe na grade e ocupa ao menos um dia da semana exibido.
export function turmaEstaNaGrade(turma: TurmaHorario): boolean {
  if (turma.status === "encerrada") return false;
  const horario = getHorarioLabel(turma);
  if (!HORARIOS.some((h) => h.label === horario)) return false;
  return (turma.dias_semana || []).some((dia) => DIAS_SEMANA.includes(dia));
}
