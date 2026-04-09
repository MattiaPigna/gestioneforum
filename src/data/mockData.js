// Mock data — sostituisci con chiamate Supabase/Firebase in produzione

export const soci = [
  { id: 1, nome: 'Mattia Rossi', ruolo: 'Presidente', email: 'mattia.rossi@forum.it', iscrizione: '2023-01-15', avatar: 'MR' },
  { id: 2, nome: 'Sofia Bianchi', ruolo: 'Vice Presidente', email: 'sofia.bianchi@forum.it', iscrizione: '2023-02-20', avatar: 'SB' },
  { id: 3, nome: 'Luca Verdi', ruolo: 'Segretario', email: 'luca.verdi@forum.it', iscrizione: '2023-03-10', avatar: 'LV' },
  { id: 4, nome: 'Anna Ferrari', ruolo: 'Tesoriere', email: 'anna.ferrari@forum.it', iscrizione: '2023-04-05', avatar: 'AF' },
  { id: 5, nome: 'Marco Esposito', ruolo: 'Membro', email: 'marco.esposito@forum.it', iscrizione: '2023-05-18', avatar: 'ME' },
  { id: 6, nome: 'Giulia Ricci', ruolo: 'Membro', email: 'giulia.ricci@forum.it', iscrizione: '2023-06-22', avatar: 'GR' },
  { id: 7, nome: 'Davide Conti', ruolo: 'Membro', email: 'davide.conti@forum.it', iscrizione: '2023-07-30', avatar: 'DC' },
  { id: 8, nome: 'Elena Greco', ruolo: 'Referente Progetti', email: 'elena.greco@forum.it', iscrizione: '2023-08-12', avatar: 'EG' },
];

export const tasks = [
  { id: 1, titolo: 'Organizzare evento estivo', descrizione: 'Pianificare il festival giovanile di luglio con stand e attività', priorita: 'Alta', stato: 'In Progress', assegnatario: 'Mattia Rossi', scadenza: '2026-07-01' },
  { id: 2, titolo: 'Aggiornare sito web', descrizione: 'Rinnovare la grafica e aggiungere sezione notizie', priorita: 'Media', stato: 'To Do', assegnatario: 'Luca Verdi', scadenza: '2026-05-15' },
  { id: 3, titolo: 'Report trimestrale', descrizione: 'Preparare il report attività Q1 2026', priorita: 'Alta', stato: 'Done', assegnatario: 'Anna Ferrari', scadenza: '2026-04-10' },
  { id: 4, titolo: 'Workshop fotografia', descrizione: 'Organizzare laboratorio creativo per i giovani soci', priorita: 'Bassa', stato: 'To Do', assegnatario: 'Sofia Bianchi', scadenza: '2026-06-20' },
  { id: 5, titolo: 'Bando contributi regionali', descrizione: 'Compilare e inviare domanda per finanziamento regionale', priorita: 'Alta', stato: 'In Progress', assegnatario: 'Elena Greco', scadenza: '2026-04-30' },
  { id: 6, titolo: 'Newsletter mensile', descrizione: 'Redazione newsletter aprile 2026', priorita: 'Media', stato: 'Done', assegnatario: 'Giulia Ricci', scadenza: '2026-04-05' },
];

export const proposte = [
  {
    id: 1,
    titolo: 'Creare uno spazio di coworking giovani',
    descrizione: 'Proponiamo di aprire uno spazio condiviso dove i giovani possano lavorare, studiare e collaborare a progetti creativi.',
    autore: 'Marco Esposito',
    data: '2026-04-01',
    upvotes: 24,
    downvotes: 3,
    userVote: null,
    commenti: [
      { id: 1, autore: 'Sofia Bianchi', testo: 'Ottima idea! Avevo in mente qualcosa di simile.', data: '2026-04-02' },
      { id: 2, autore: 'Luca Verdi', testo: 'Bisogna trovare il finanziamento. Potremmo candidarci al bando regionale.', data: '2026-04-03' },
    ],
  },
  {
    id: 2,
    titolo: 'Programma di mentorship con professionisti locali',
    descrizione: 'Avviare un programma di tutoraggio dove professionisti del territorio affiancano i giovani soci in percorsi di crescita.',
    autore: 'Elena Greco',
    data: '2026-04-03',
    upvotes: 18,
    downvotes: 1,
    userVote: null,
    commenti: [
      { id: 1, autore: 'Mattia Rossi', testo: 'Possiamo contattare la Camera di Commercio per i contatti.', data: '2026-04-04' },
    ],
  },
  {
    id: 3,
    titolo: 'App mobile per il Forum',
    descrizione: 'Sviluppare un\'app dedicata per migliorare la comunicazione e la partecipazione dei soci.',
    autore: 'Davide Conti',
    data: '2026-04-05',
    upvotes: 31,
    downvotes: 7,
    userVote: null,
    commenti: [],
  },
];

export const canali = [
  {
    id: 1,
    nome: 'generale',
    messaggi: [
      { id: 1, autore: 'Mattia Rossi', avatar: 'MR', testo: 'Benvenuti nel canale generale! 👋', ora: '10:00' },
      { id: 2, autore: 'Sofia Bianchi', avatar: 'SB', testo: 'Ciao a tutti! Ricordate la riunione di venerdì alle 18.', ora: '10:05' },
      { id: 3, autore: 'Luca Verdi', avatar: 'LV', testo: 'Confermato, ci sarò!', ora: '10:12' },
    ],
  },
  {
    id: 2,
    nome: 'progetti',
    messaggi: [
      { id: 1, autore: 'Elena Greco', avatar: 'EG', testo: 'Aggiornamento sul bando regionale: scadenza il 30 aprile!', ora: '09:30' },
      { id: 2, autore: 'Anna Ferrari', avatar: 'AF', testo: 'Ho preparato la bozza del documento, la carico su Drive.', ora: '09:45' },
    ],
  },
  {
    id: 3,
    nome: 'eventi',
    messaggi: [
      { id: 1, autore: 'Giulia Ricci', avatar: 'GR', testo: 'Per il festival estivo servono almeno 10 volontari.', ora: '11:00' },
      { id: 2, autore: 'Davide Conti', avatar: 'DC', testo: 'Io ci sono! Posso occuparmi della logistica.', ora: '11:15' },
      { id: 3, autore: 'Marco Esposito', avatar: 'ME', testo: 'Possiamo usare il parco comunale? Chiedo al Comune.', ora: '11:22' },
    ],
  },
  {
    id: 4,
    nome: 'idee',
    messaggi: [
      { id: 1, autore: 'Mattia Rossi', avatar: 'MR', testo: 'Spazio libero per le vostre idee creative!', ora: '08:00' },
    ],
  },
];

export const filesDrive = [
  { id: 1, nome: 'Statuto Forum dei Giovani 2024.pdf', tipo: 'pdf', dimensione: '1.2 MB', modificato: '2024-12-01', link: '#', condiviso: true },
  { id: 2, nome: 'Budget 2026.xlsx', tipo: 'sheet', dimensione: '345 KB', modificato: '2026-03-15', link: '#', condiviso: false },
  { id: 3, nome: 'Verbale Riunione Marzo.docx', tipo: 'doc', dimensione: '89 KB', modificato: '2026-03-28', link: '#', condiviso: true },
  { id: 4, nome: 'Foto Evento Febbraio.zip', tipo: 'folder', dimensione: '234 MB', modificato: '2026-02-20', link: '#', condiviso: true },
  { id: 5, nome: 'Presentazione Bando Regionale.pptx', tipo: 'slides', dimensione: '5.6 MB', modificato: '2026-04-02', link: '#', condiviso: false },
  { id: 6, nome: 'Piano Attività 2026.pdf', tipo: 'pdf', dimensione: '2.1 MB', modificato: '2026-01-10', link: '#', condiviso: true },
  { id: 7, nome: 'Contatti Stakeholder.xlsx', tipo: 'sheet', dimensione: '156 KB', modificato: '2026-03-05', link: '#', condiviso: false },
];
