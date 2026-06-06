export type Locale = "pt" | "en";

const pt = {
  // ── Tipos de card ──
  task: "Tarefa",
  goal: "Meta",

  // ── Prioridades ──
  prio_high: "Alta",
  prio_medium: "Média",
  prio_low: "Baixa",

  // ── Colunas padrão ──
  col_backlog: "Backlog",
  col_todo: "A Fazer",
  col_inprogress: "Em Andamento",
  col_review: "Review",
  col_done: "Concluído",

  // ── Ações comuns ──
  create: "Criar",
  save: "Salvar",
  cancel: "Cancelar",
  close: "Fechar",
  edit: "Editar",
  delete: "Excluir",
  add: "Adicionar",
  confirm: "Confirmar?",
  yes: "Sim",
  no: "Não",
  duplicate: "Duplicar",
  favorite: "Favoritar",
  search: "Buscar",

  // ── Campos ──
  title: "Título",
  description: "Descrição",
  type: "Tipo",
  priority: "Prioridade",
  deadline: "Prazo",
  tags: "Etiquetas",
  column: "Coluna",
  color: "Cor",

  // ── AddCardModal ──
  add_card: "Adicionar card",
  use_template: "Usar template",
  template: "Template",
  goal_parent: "Meta vinculada (opcional)",
  no_parent: "— Nenhuma —",
  no_tags: "Nenhuma etiqueta cadastrada.",
  desc_optional: "Descrição (opcional)",

  // ── Board ──
  all: "Todos",
  tracks: "Trilhas",
  columns: "Colunas",
  archived_one: "card arquivado",
  archived_many: "cards arquivados",
  done_since: "Concluído há mais de",
  done_since_days: "dias",
  see_dashboards: "Ver no Dashboards →",
  no_tracks: "Nenhuma trilha ainda",
  create_first_track: "Criar primeira trilha",
  no_tracks_desc: "Crie sua primeira trilha para começar a organizar suas tarefas.",
  add_track_hint_title: "Quer organizar melhor?",
  add_track_hint_desc: "Adicione uma nova trilha para separar suas tarefas por contexto.",
  empty_board_title: "Nenhum card ainda",
  empty_board_desc: "Adicione uma nova trilha para começar a organizar suas tarefas.",
  move_to_column: "Mover para coluna",
  move_to_track: "Mover para trilha",
  in_progress_label: "em andamento",
  cards_label: "cards",
  card_label: "card",
  drag_card: "Arrastar card",

  // ── CardItem ──
  blocked_by_deps: "Bloqueado por dependências pendentes",
  blocked: "Bloqueado",
  checklist_progress: "concluídos",
  overdue: "Vencido",
  today: "Hoje",

  // ── CardDetailModal ──
  tab_details: "Detalhes",
  tab_checklist: "Checklist",
  tab_comments: "Comentários",
  tab_activity: "Atividade",
  tab_time: "Tempo",
  tab_attachments: "Anexos",
  attach_add: "Adicionar arquivo",
  attach_empty: "Nenhum anexo ainda",
  attach_uploading: "Enviando…",
  attach_download: "Baixar",
  attach_delete: "Remover anexo",
  attach_too_large: "é muito grande. O limite é 20 MB.",
  highlight_color: "Cor de destaque",
  goal_parent_label: "Meta pai:",
  progress: "Progresso",
  tasks_done: "tarefas concluídas",
  no_desc: "Sem descrição. Pressione",
  no_desc_hint: "para editar.",
  save_as_template: "Salvar como template",
  template_name_placeholder: "Nome do template...",
  delete_card: "Excluir card",

  // ── TrilhasModal ──
  manage_tags: "Gerenciar etiquetas",
  manage_tags_desc:
    "Etiquetas categorizam seus cards. Excluir uma etiqueta remove ela de todos os cards.",
  no_tags_yet: "Nenhuma etiqueta ainda.",
  new_tag: "Nova etiqueta",
  tag_name_placeholder: "Nome da etiqueta",
  delete_confirm: "Excluir?",

  // ── TracksModal ──
  manage_tracks: "Gerenciar trilhas",
  manage_tracks_desc:
    "Trilhas são as swimlanes do board. Excluir uma trilha move todos os cards dela para a primeira trilha restante.",
  no_tracks_yet: "Nenhuma trilha ainda.",
  new_track: "Nova trilha",
  track_name_placeholder: "Nome da trilha",

  // ── ColumnsModal ──
  manage_columns: "Gerenciar colunas",
  manage_columns_desc:
    "Colunas são os estágios do board. Excluir uma coluna move seus cards para a primeira coluna restante.",
  manage_columns_track_desc:
    "Colunas específicas desta trilha. Quando vazias, usam o template global.",
  no_columns_yet: "Nenhuma coluna ainda.",
  new_column: "Nova coluna",
  column_name_placeholder: "Nome da coluna",
  wip_limit: "WIP Limit:",
  wip_short: "WIP:",
  wip_no_limit: "Sem limite",
  min_one_column: "Deve existir ao menos uma coluna",

  // ── ChecklistSection ──
  checklist: "Checklist",
  checklist_add_placeholder: "Adicionar item...",

  // ── CommentsSection ──
  comments: "Comentários",
  comment_edited: "(editado)",
  comment_placeholder: "Adicionar comentário... (Ctrl+Enter)",

  // ── ActivitySection ──
  activities: "Atividades",
  show_less: "Mostrar menos",
  see_all: "Ver todas",

  // ── TimeTrackingSection ──
  time_tracking: "Time tracking",
  log_time: "Registrar tempo",
  note_optional: "Nota (opcional)",

  // ── DependenciesSection ──
  blocked_by: "Bloqueado por",
  blocked_badge: "Bloqueado",
  completed: "Concluído",
  pending: "Pendente",
  add_dependency: "Adicionar dependência",
  search_card: "Buscar card...",
  no_card_found: "Nenhum card encontrado.",

  // ── TemplatesModal ──
  saved_templates: "Templates salvos",
  no_templates: "Nenhum template salvo ainda.",
  no_templates_hint: 'Abra um card e clique em "Salvar como template".',

  // ── AppShell ──
  search_placeholder: "Buscar tarefas…",
  urgent_tooltip_one: "card com prazo vencido ou hoje",
  urgent_tooltip_many: "cards com prazo vencido ou hoje",
  create_btn: "Criar",
  toggle_theme: "Alternar tema",
  log_out: "Log Out",

  // ── Navegação ──
  nav_home: "Home",
  nav_for_you: "For You",
  nav_calendar: "Calendário",
  nav_habits: "Hábitos",
  nav_dashboards: "Dashboards",
  nav_settings: "Configurações",
  nav_profile: "Profile",
  nav_templates: "Templates",
  // ── Habit Tracker ──
  habits_title: "Hábitos",
  habit_add: "Novo hábito",
  habit_name_placeholder: "Nome do hábito",
  habit_empty: "Nenhum hábito ainda. Crie o primeiro!",
  habit_streak: "sequência",
  habit_streak_days: "dias",
  habit_delete: "Excluir hábito",
  habit_delete_confirm: "Excluir este hábito e todo o histórico?",
  habit_freq_daily: "Todo dia",
  habit_freq_weekdays: "Dias da semana",
  habit_freq_label: "Frequência",
  habit_color_label: "Cor",
  habit_today: "Hoje",
  habit_create: "Criar",
  habit_cancel: "Cancelar",
  habit_history: "Histórico",
  // ── Bloco 7: habits no Dashboard / For You ──
  habits_section: "Hábitos",
  habit_consistency: "Consistência do mês",
  habit_last30: "Últimos 30 dias",
  habit_record: "recorde",
  habit_no_habits: "Nenhum hábito ainda",
  habit_today_progress: "Hábitos de hoje",
  habit_today_done: "feitos",
  habit_today_left: "faltam",
  habit_all_done_today: "Tudo feito por hoje 🎉",
  habit_none_today: "Nenhum hábito para hoje",
  habit_streak_risk: "Seu streak de {n} dias em {name} quebra hoje",

  // ── Calendar ──
  upcoming_deadlines: "Próximos prazos",
  view_month: "Mês",
  view_week: "Semana",
  view_list: "Lista",
  prev: "Anterior",
  next_btn: "Próximo",
  today_btn: "Hoje",
  no_cards_deadline:
    "Nenhum card com prazo. Adicione uma data de entrega a um card para vê-lo aqui.",
  past: "passado",

  // ── Dashboards ──
  statistics: "Estatísticas",
  active_cards: "Cards ativos",
  completion_rate: "Taxa de conclusão",
  overdue_cards: "Vencidos",
  due_today: "Vencem hoje",
  cards_by_column: "Cards por coluna",
  cards_by_priority: "Cards por prioridade",
  cards_by_track: "Cards por trilha",
  all_cards: "Todos os cards",
  filters: "Filtros",
  export_data: "Exportar dados",
  export: "Exportar",
  status: "Status",
  status_all: "Todos",
  status_active: "Ativos",
  status_archived: "Arquivados",
  archived_badge: "Arquivado",
  deadline_filter: "Prazo",
  deadline_overdue: "Vencidos",
  deadline_today: "Vencem hoje",
  deadline_week: "Esta semana",
  priority_all: "Todas",
  type_filter: "Tipo",
  type_all: "Todos",
  type_tasks: "Tarefas",
  type_goals: "Metas",
  search_cards_placeholder: "Buscar por título ou descrição...",
  col_header_title: "Título",
  col_header_track: "Trilha",
  col_header_status: "Status",
  col_header_priority: "Prioridade",
  col_header_deadline: "Prazo",
  col_header_updated: "Atualizado",
  col_header_actions: "Ações",
  no_cards: "Nenhum card.",
} as const;

const en = {
  // ── Card types ──
  task: "Task",
  goal: "Goal",

  // ── Priorities ──
  prio_high: "High",
  prio_medium: "Medium",
  prio_low: "Low",

  // ── Default columns ──
  col_backlog: "Backlog",
  col_todo: "To Do",
  col_inprogress: "In Progress",
  col_review: "Review",
  col_done: "Done",

  // ── Common actions ──
  create: "Create",
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  edit: "Edit",
  delete: "Delete",
  add: "Add",
  confirm: "Confirm?",
  yes: "Yes",
  no: "No",
  duplicate: "Duplicate",
  favorite: "Favorite",
  search: "Search",

  // ── Fields ──
  title: "Title",
  description: "Description",
  type: "Type",
  priority: "Priority",
  deadline: "Deadline",
  tags: "Tags",
  column: "Column",
  color: "Color",

  // ── AddCardModal ──
  add_card: "Add card",
  use_template: "Use template",
  template: "Template",
  goal_parent: "Parent Goal (optional)",
  no_parent: "— None —",
  no_tags: "No tags yet.",
  desc_optional: "Description (optional)",

  // ── Board ──
  all: "All",
  tracks: "Tracks",
  columns: "Columns",
  archived_one: "archived card",
  archived_many: "archived cards",
  done_since: "Done for more than",
  done_since_days: "days",
  see_dashboards: "See in Dashboards →",
  no_tracks: "No tracks yet",
  create_first_track: "Create first track",
  no_tracks_desc: "Create your first track to start organizing your tasks.",
  add_track_hint_title: "Want better organization?",
  add_track_hint_desc: "Add a new track to separate your tasks by context.",
  empty_board_title: "No cards yet",
  empty_board_desc: "Add a new track to start organizing your tasks.",
  move_to_column: "Move to column",
  move_to_track: "Move to track",
  in_progress_label: "in progress",
  cards_label: "cards",
  card_label: "card",
  drag_card: "Drag card",

  // ── CardItem ──
  blocked_by_deps: "Blocked by pending dependencies",
  blocked: "Blocked",
  checklist_progress: "completed",
  overdue: "Overdue",
  today: "Today",

  // ── CardDetailModal ──
  tab_details: "Details",
  tab_checklist: "Checklist",
  tab_comments: "Comments",
  tab_activity: "Activity",
  tab_time: "Time",
  tab_attachments: "Attachments",
  attach_add: "Add file",
  attach_empty: "No attachments yet",
  attach_uploading: "Uploading…",
  attach_download: "Download",
  attach_delete: "Remove attachment",
  attach_too_large: "is too large. The limit is 20 MB.",
  highlight_color: "Highlight color",
  goal_parent_label: "Parent goal:",
  progress: "Progress",
  tasks_done: "tasks done",
  no_desc: "No description. Press",
  no_desc_hint: "to edit.",
  save_as_template: "Save as template",
  template_name_placeholder: "Template name...",
  delete_card: "Delete card",

  // ── TrilhasModal ──
  manage_tags: "Manage tags",
  manage_tags_desc: "Tags categorize your cards. Deleting a tag removes it from all cards.",
  no_tags_yet: "No tags yet.",
  new_tag: "New tag",
  tag_name_placeholder: "Tag name",
  delete_confirm: "Delete?",

  // ── TracksModal ──
  manage_tracks: "Manage tracks",
  manage_tracks_desc:
    "Tracks are the board's swimlanes. Deleting a track moves all its cards to the first remaining track.",
  no_tracks_yet: "No tracks yet.",
  new_track: "New track",
  track_name_placeholder: "Track name",

  // ── ColumnsModal ──
  manage_columns: "Manage columns",
  manage_columns_desc:
    "Columns are the board's stages. Deleting a column moves its cards to the first remaining column.",
  manage_columns_track_desc:
    "Columns specific to this track. When empty, the global template is used.",
  no_columns_yet: "No columns yet.",
  new_column: "New column",
  column_name_placeholder: "Column name",
  wip_limit: "WIP Limit:",
  wip_short: "WIP:",
  wip_no_limit: "No limit",
  min_one_column: "At least one column must exist",

  // ── ChecklistSection ──
  checklist: "Checklist",
  checklist_add_placeholder: "Add item...",

  // ── CommentsSection ──
  comments: "Comments",
  comment_edited: "(edited)",
  comment_placeholder: "Add a comment... (Ctrl+Enter)",

  // ── ActivitySection ──
  activities: "Activities",
  show_less: "Show less",
  see_all: "See all",

  // ── TimeTrackingSection ──
  time_tracking: "Time tracking",
  log_time: "Log time",
  note_optional: "Note (optional)",

  // ── DependenciesSection ──
  blocked_by: "Blocked by",
  blocked_badge: "Blocked",
  completed: "Completed",
  pending: "Pending",
  add_dependency: "Add dependency",
  search_card: "Search card...",
  no_card_found: "No card found.",

  // ── TemplatesModal ──
  saved_templates: "Saved templates",
  no_templates: "No saved templates yet.",
  no_templates_hint: 'Open a card and click "Save as template".',

  // ── AppShell ──
  search_placeholder: "Search tasks…",
  urgent_tooltip_one: "card with overdue or today deadline",
  urgent_tooltip_many: "cards with overdue or today deadlines",
  create_btn: "Create",
  toggle_theme: "Toggle theme",
  log_out: "Log Out",

  // ── Navigation ──
  nav_home: "Home",
  nav_for_you: "For You",
  nav_calendar: "Calendar",
  nav_habits: "Habits",
  nav_dashboards: "Dashboards",
  nav_settings: "Settings",
  nav_profile: "Profile",
  nav_templates: "Templates",
  // ── Habit Tracker ──
  habits_title: "Habits",
  habit_add: "New habit",
  habit_name_placeholder: "Habit name",
  habit_empty: "No habits yet. Create your first!",
  habit_streak: "streak",
  habit_streak_days: "days",
  habit_delete: "Delete habit",
  habit_delete_confirm: "Delete this habit and all its history?",
  habit_freq_daily: "Every day",
  habit_freq_weekdays: "Days of week",
  habit_freq_label: "Frequency",
  habit_color_label: "Color",
  habit_today: "Today",
  habit_create: "Create",
  habit_cancel: "Cancel",
  habit_history: "History",
  // ── Bloco 7: habits no Dashboard / For You ──
  habits_section: "Habits",
  habit_consistency: "This month's consistency",
  habit_last30: "Last 30 days",
  habit_record: "record",
  habit_no_habits: "No habits yet",
  habit_today_progress: "Today's habits",
  habit_today_done: "done",
  habit_today_left: "left",
  habit_all_done_today: "All done for today 🎉",
  habit_none_today: "No habits for today",
  habit_streak_risk: "Your {n}-day streak in {name} breaks today",

  // ── Calendar ──
  upcoming_deadlines: "Upcoming deadlines",
  view_month: "Month",
  view_week: "Week",
  view_list: "List",
  prev: "Previous",
  next_btn: "Next",
  today_btn: "Today",
  no_cards_deadline: "No cards with a deadline. Add a due date to a card to see it here.",
  past: "past",

  // ── Dashboards ──
  statistics: "Statistics",
  active_cards: "Active cards",
  completion_rate: "Completion rate",
  overdue_cards: "Overdue",
  due_today: "Due today",
  cards_by_column: "Cards by column",
  cards_by_priority: "Cards by priority",
  cards_by_track: "Cards by track",
  all_cards: "All cards",
  filters: "Filters",
  export_data: "Export data",
  export: "Export",
  status: "Status",
  status_all: "All",
  status_active: "Active",
  status_archived: "Archived",
  archived_badge: "Archived",
  deadline_filter: "Deadline",
  deadline_overdue: "Overdue",
  deadline_today: "Due today",
  deadline_week: "This week",
  priority_all: "All",
  type_filter: "Type",
  type_all: "All",
  type_tasks: "Tasks",
  type_goals: "Goals",
  search_cards_placeholder: "Search by title or description...",
  col_header_title: "Title",
  col_header_track: "Track",
  col_header_status: "Status",
  col_header_priority: "Priority",
  col_header_deadline: "Deadline",
  col_header_updated: "Updated",
  col_header_actions: "Actions",
  no_cards: "No cards.",
} as const;

export type TranslationKey = keyof typeof pt;
export type Translations = Record<TranslationKey, string>;

export const translations: Record<Locale, Translations> = {
  pt: pt as Translations,
  en: en as Translations,
};

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}
