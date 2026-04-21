import React, { useState, useRef, useEffect } from 'react';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/chat'
  : 'https://web-production-13bd2f.up.railway.app/chat';

const FEEDBACK_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/feedback'
  : 'https://web-production-13bd2f.up.railway.app/feedback';

// Ordre des champs du formulaire (correspond à QUESTIONS_ENTREPRISE dans main.py)
const QUESTIONS_CHAMPS = [
  'typeBeneficiaire', 'nomBeneficiaire', 'prenomBeneficiaire',
  'nationaliteBeneficiaire', 'cinBeneficiaire', 'dateBirthBeneficiaire',
  'gsmBeneficiaire', 'emailBeneficiaire', 'villeBeneficiaire',
  'adresseBeneficiaire', 'denominationBeneficiaire', 'denomination2',
  'denomination3', 'formeJuridique', 'domaineActivite', 'dureeSociete',
  'villeDomiciliation', 'capitalSocial', 'apport1', 'gerant', 'pack', 'password'
];

const COLORS = {
  primary:      '#2563eb',
  primaryDark:  '#1d4ed8',
  primaryLight: '#eff6ff',
  border:       '#bfdbfe',
  msgBg:        '#f0f7ff',
  text:         '#1e293b',
  textMuted:    '#64748b',
  white:        '#ffffff',
  online:       '#4ade80',
};

const SUGGESTIONS = [
  "Créer une SARL",
  "Voir les tarifs",
  "Suivre mon dossier",
  "Consultation gratuite",
  "Domiciliation",
  "Dépôt de marque",
];

// ════════════════════════════════════════
// COMPOSANT CALENDRIER
// ════════════════════════════════════════

function SelecteurDate({ onSelect }) {
  const anneeDefaut = new Date().getFullYear() - 25;
  const [mois, setMois] = useState(new Date().getMonth());
  const [annee, setAnnee] = useState(anneeDefaut);

  const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const premierJour = new Date(annee, mois, 1).getDay();
  const joursInMois = new Date(annee, mois + 1, 0).getDate();
  const decalage = premierJour === 0 ? 6 : premierJour - 1;

  const jours = [];
  for (let i = 0; i < decalage; i++) jours.push(null);
  for (let i = 1; i <= joursInMois; i++) jours.push(i);

  const selectionnerJour = (jour) => {
    if (!jour) return;
    const dateFormatee = `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
    onSelect(dateFormatee);
  };

  const moisPrecedent = () => {
    if (mois === 0) { setMois(11); setAnnee(a => a - 1); }
    else setMois(m => m - 1);
  };

  const moisSuivant = () => {
    if (mois === 11) { setMois(0); setAnnee(a => a + 1); }
    else setMois(m => m + 1);
  };

  return (
    <div style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      padding: '12px',
      marginTop: '8px',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Navigation mois */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '10px'
      }}>
        <button onClick={moisPrecedent} style={{
          background: COLORS.primaryLight, border: 'none',
          borderRadius: '6px', cursor: 'pointer',
          color: COLORS.primary, fontSize: '16px',
          width: '28px', height: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>

        <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text }}>
          {MOIS[mois]} {annee}
        </span>

        <button onClick={moisSuivant} style={{
          background: COLORS.primaryLight, border: 'none',
          borderRadius: '6px', cursor: 'pointer',
          color: COLORS.primary, fontSize: '16px',
          width: '28px', height: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>›</button>
      </div>

      {/* En-têtes jours */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px', marginBottom: '4px'
      }}>
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(j => (
          <div key={j} style={{
            textAlign: 'center', fontSize: '10px',
            color: COLORS.textMuted, fontWeight: 600, padding: '2px 0'
          }}>
            {j}
          </div>
        ))}
      </div>

      {/* Jours du mois */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px'
      }}>
        {jours.map((jour, idx) => (
          <button
            key={idx}
            onClick={() => selectionnerJour(jour)}
            style={{
              background: 'none', border: 'none',
              borderRadius: '50%',
              width: '30px', height: '30px',
              margin: '0 auto',
              fontSize: '11px',
              cursor: jour ? 'pointer' : 'default',
              color: jour ? COLORS.text : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => {
              if (jour) {
                e.currentTarget.style.background = COLORS.primary;
                e.currentTarget.style.color = COLORS.white;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = jour ? COLORS.text : 'transparent';
            }}
          >
            {jour || ''}
          </button>
        ))}
      </div>

      {/* Navigation année rapide */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', marginTop: '10px',
        borderTop: `1px solid ${COLORS.border}`, paddingTop: '8px'
      }}>
        <button onClick={() => setAnnee(a => a - 1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: COLORS.textMuted, fontSize: '11px', padding: '2px 6px',
          borderRadius: '4px',
        }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.primaryLight}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >◀ {annee - 1}</button>

        <span style={{ fontSize: '12px', color: COLORS.primary, fontWeight: 600 }}>
          {annee}
        </span>

        <button onClick={() => setAnnee(a => a + 1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: COLORS.textMuted, fontSize: '11px', padding: '2px 6px',
          borderRadius: '4px',
        }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.primaryLight}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >{annee + 1} ▶</button>
      </div>

      {/* Astuce */}
      <p style={{
        fontSize: '10px', color: COLORS.textMuted,
        textAlign: 'center', margin: '6px 0 0',
      }}>
        Cliquez sur un jour pour sélectionner votre date de naissance
      </p>
    </div>
  );
}

// ════════════════════════════════════════
// COMPOSANT FORMATER RÉPONSE
// ════════════════════════════════════════

function FormaterReponse({ texte }) {
  const lignes = texte.split('\n');
  return (
    <div style={{ lineHeight: '1.6', fontSize: '13px', color: COLORS.text }}>
      {lignes.map((ligne, i) => {
        if (!ligne.trim()) return <br key={i} />;

        if (ligne.startsWith('**') && ligne.endsWith('**')) {
          return (
            <p key={i} style={{ fontWeight: 600, margin: '6px 0 3px', color: COLORS.primary }}>
              {ligne.replace(/\*\*/g, '')}
            </p>
          );
        }

        if (ligne.trim().startsWith('- ') || ligne.trim().startsWith('• ')) {
          const contenu = ligne.trim().replace(/^[-•]\s/, '');
          return (
            <div key={i} style={{ display: 'flex', gap: '7px', margin: '3px 0', alignItems: 'flex-start' }}>
              <span style={{ color: COLORS.primary, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: gras(contenu) }} />
            </div>
          );
        }

        const num = ligne.trim().match(/^(\d+)\.\s(.+)/);
        if (num) {
          return (
            <div key={i} style={{ display: 'flex', gap: '7px', margin: '3px 0', alignItems: 'flex-start' }}>
              <span style={{
                background: COLORS.primary, color: '#fff',
                borderRadius: '50%', width: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700, flexShrink: 0, marginTop: '1px'
              }}>{num[1]}</span>
              <span dangerouslySetInnerHTML={{ __html: gras(num[2]) }} />
            </div>
          );
        }

        return (
          <p key={i} style={{ margin: '3px 0' }}
            dangerouslySetInnerHTML={{ __html: gras(ligne) }} />
        );
      })}
    </div>
  );
}

function gras(texte) {
  return texte.replace(/\*\*(.+?)\*\*/g,
    `<strong style="color:${COLORS.primary}">$1</strong>`);
}

// ════════════════════════════════════════
// COMPOSANT PRINCIPAL CHATWIDGET
// ════════════════════════════════════════

export default function ChatWidget() {
  const [ouvert, setOuvert]     = useState(false);
  const [messages, setMessages] = useState([{
    role: 'bot',
    texte: "Bonjour ! Je suis l'assistant LegalStation. Comment puis-je vous aider aujourd'hui ?",
    suggestions: true,
    evaluation: null,
    streaming: false,
  }]);
  const [input, setInput]                               = useState('');
  const [chargement, setChargement]                     = useState(false);
  const [suggestionsUtilisees, setSuggestionsUtilisees] = useState(false);
  const [history, setHistory]                           = useState([]);
  const [formulaire, setFormulaire]                     = useState({});
  const [afficherCalendrier, setAfficherCalendrier]     = useState(false);
  const finMessages = useRef(null);

  useEffect(() => {
    finMessages.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chargement, afficherCalendrier]);

  const evaluer = async (index, valeur, question, reponse) => {
    setMessages(prev => prev.map((msg, i) =>
      i === index ? { ...msg, evaluation: valeur } : msg
    ));
    if (valeur === 'negatif') {
      try {
        await fetch(FEEDBACK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question, reponse, evaluation: 'negatif',
            date: new Date().toISOString()
          }),
        });
      } catch (e) {
        console.log('Feedback non envoyé', e);
      }
    }
  };

  const envoyer = async (texte) => {
    const msg = (texte || input).trim();
    if (!msg || chargement) return;

    setAfficherCalendrier(false);
    setMessages(prev => [...prev, {
      role: 'user', texte: msg, evaluation: null, streaming: false
    }]);
    setInput('');
    setChargement(true);
    setSuggestionsUtilisees(true);

    try {
      const rep = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: history,
          formulaire: formulaire,
        }),
      });
      const data = await rep.json();

      setMessages(prev => [...prev, {
        role: 'bot', texte: data.answer,
        evaluation: null, streaming: false,
      }]);
      setHistory(prev => [...prev, { user: msg, bot: data.answer }]);

      if (data.formulaire !== undefined) {
        setFormulaire(data.formulaire);

        // Détecter si la question ACTUELLE posée est la date de naissance
        // etape_index pointe vers la prochaine question à poser
        // donc la question actuelle = etape_index - 1
        const prochainIndex = data.formulaire?.etape_index;
        const champActuel = prochainIndex !== undefined && prochainIndex > 0
          ? (QUESTIONS_CHAMPS[prochainIndex - 1] || '')
          : '';
        setAfficherCalendrier(champActuel === 'dateBirthBeneficiaire');
            
}
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        texte: "Désolé, une erreur est survenue. Vérifiez que le serveur est lancé.",
        evaluation: null, streaming: false,
      }]);
    } finally {
      setChargement(false);
    }
  };

  const reinitialiser = () => {
    setMessages([{
      role: 'bot',
      texte: "Bonjour ! Je suis l'assistant LegalStation. Comment puis-je vous aider aujourd'hui ?",
      suggestions: true, evaluation: null, streaming: false,
    }]);
    setSuggestionsUtilisees(false);
    setHistory([]);
    setInput('');
    setFormulaire({});
    setAfficherCalendrier(false);
  };

  const nbQuestions = 22;
  const etapeActuelle = formulaire?.etape_index || 0;
  const pourcentage = Math.min(Math.round((etapeActuelle / nbQuestions) * 100), 100);

  return (
    <>
      {ouvert && (
        <div style={{
          position: 'fixed', bottom: '88px', right: '24px',
          width: '360px', height: '540px',
          background: COLORS.white, borderRadius: '16px',
          border: `1px solid ${COLORS.border}`,
          display: 'flex', flexDirection: 'column',
          zIndex: 9999, overflow: 'hidden',
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}>

          {/* ── Header ── */}
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
            padding: '13px 15px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                Assistant LegalStation
              </p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLORS.online, display: 'inline-block' }}/>
                En ligne · répond rapidement
              </p>
            </div>
            <button onClick={reinitialiser} title="Nouvelle conversation" style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', borderRadius: '6px', padding: '4px 8px',
              fontSize: '13px', cursor: 'pointer', marginRight: '4px',
            }}>↺</button>
            <button onClick={() => setOuvert(false)} style={{
              background: 'none', border: 'none', color: '#fff',
              fontSize: '18px', cursor: 'pointer', lineHeight: 1,
            }}>✕</button>
          </div>

          {/* ── Barre de progression formulaire ── */}
          {formulaire && formulaire.actif && (
            <div style={{
              background: COLORS.primaryLight,
              borderBottom: `1px solid ${COLORS.border}`,
              padding: '7px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: COLORS.primary, fontWeight: 500 }}>
                  🏢 Création d'entreprise
                </span>
                <span style={{ fontSize: '11px', color: COLORS.primary }}>
                  {etapeActuelle}/{nbQuestions} — {pourcentage}%
                </span>
              </div>
              <div style={{ background: COLORS.border, borderRadius: '4px', height: '4px' }}>
                <div style={{
                  background: COLORS.primary, borderRadius: '4px',
                  height: '4px', width: `${pourcentage}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '13px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            background: COLORS.msgBg,
          }}>
            {messages.map((msg, i) => (
              <div key={i}>
                {/* Bulle de message */}
                <div style={{
                  background: msg.role === 'user' ? COLORS.primary : COLORS.white,
                  color: msg.role === 'user' ? '#fff' : COLORS.text,
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '10px 13px', maxWidth: '90%',
                  marginLeft: msg.role === 'user' ? 'auto' : '0',
                  border: msg.role === 'bot' ? `1px solid ${COLORS.border}` : 'none',
                }}>
                  {msg.role === 'bot'
                    ? <FormaterReponse texte={msg.texte} />
                    : <span style={{ fontSize: '13px', lineHeight: '1.5' }}>{msg.texte}</span>
                  }
                </div>

                {/* Calendrier — affiché après le dernier message bot si date demandée */}
                {msg.role === 'bot' && i === messages.length - 1 && afficherCalendrier && (
                  <SelecteurDate
                    onSelect={(date) => {
                      setAfficherCalendrier(false);
                      envoyer(date);
                    }}
                  />
                )}

                {/* Boutons évaluation — masqués pendant le formulaire */}
                {msg.role === 'bot' && i > 0 && !msg.streaming && !(formulaire && formulaire.actif) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginTop: '5px', marginLeft: '4px'
                  }}>
                    {msg.evaluation === null ? (
                      <>
                        <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
                          Cette réponse vous a-t-elle aidé ?
                        </span>
                        <button
                          onClick={() => evaluer(i, 'positif', messages[i - 1]?.texte || '', msg.texte)}
                          style={{
                            background: 'none', border: `1px solid ${COLORS.border}`,
                            borderRadius: '20px', padding: '3px 9px',
                            fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#16a34a'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = COLORS.border; }}
                        >👍</button>
                        <button
                          onClick={() => evaluer(i, 'negatif', messages[i - 1]?.texte || '', msg.texte)}
                          style={{
                            background: 'none', border: `1px solid ${COLORS.border}`,
                            borderRadius: '20px', padding: '3px 9px',
                            fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#dc2626'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = COLORS.border; }}
                        >👎</button>
                      </>
                    ) : msg.evaluation === 'positif' ? (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontStyle: 'italic' }}>
                        👍 Merci, nous sommes ravis de vous avoir aidé !
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#dc2626', fontStyle: 'italic' }}>
                        👎 Merci pour votre retour. Notre équipe va améliorer cette réponse.
                      </span>
                    )}
                  </div>
                )}

                {/* Suggestions rapides */}
                {msg.suggestions && !suggestionsUtilisees && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '9px' }}>
                    {SUGGESTIONS.map((s, j) => (
                      <button key={j} onClick={() => envoyer(s)}
                        onMouseEnter={e => { e.target.style.background = COLORS.primary; e.target.style.color = '#fff'; e.target.style.borderColor = COLORS.primary; }}
                        onMouseLeave={e => { e.target.style.background = COLORS.primaryLight; e.target.style.color = COLORS.primary; e.target.style.borderColor = COLORS.border; }}
                        style={{
                          background: COLORS.primaryLight, border: `1px solid ${COLORS.border}`,
                          borderRadius: '16px', padding: '5px 11px',
                          fontSize: '11px', color: COLORS.primary,
                          cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Animation chargement */}
            {chargement && (
              <div style={{
                background: COLORS.white, border: `1px solid ${COLORS.border}`,
                borderRadius: '12px 12px 12px 2px', padding: '11px 15px',
                display: 'flex', gap: '4px', alignItems: 'center', alignSelf: 'flex-start',
              }}>
                {[0, 1, 2].map(k => (
                  <div key={k} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: COLORS.primary,
                    animation: `pulse 1s ease-in-out ${k * 0.2}s infinite`,
                  }}/>
                ))}
              </div>
            )}
            <div ref={finMessages} />
          </div>

          {/* ── Zone de saisie ── */}
          <div style={{
            padding: '11px 12px', borderTop: `1px solid ${COLORS.border}`,
            display: 'flex', gap: '8px', background: COLORS.white, alignItems: 'center',
          }}>
            <input
              style={{
                flex: 1, background: COLORS.msgBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '22px', padding: '9px 14px',
                fontSize: '13px', color: COLORS.text, outline: 'none',
              }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && envoyer()}
              placeholder={
                afficherCalendrier
                  ? "Ou tapez la date (JJ/MM/AAAA)..."
                  : formulaire && formulaire.actif
                  ? "Tapez votre réponse..."
                  : "Posez votre question..."
              }
            />
            <button onClick={() => envoyer()} style={{
              background: input.trim() ? COLORS.primary : '#cbd5e1',
              border: 'none', borderRadius: '50%',
              width: '38px', height: '38px',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Bouton flottant ── */}
      <button onClick={() => setOuvert(!ouvert)} style={{
        position: 'fixed', bottom: '24px', right: '24px',
        width: '54px', height: '54px', borderRadius: '50%',
        background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      }}>
        {ouvert
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
        }
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50%       { opacity: 1;    transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}