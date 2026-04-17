import React, { useState, useRef, useEffect } from 'react';

const STREAM_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/chat/stream'
  : 'https://web-production-13bd2f.up.railway.app/chat/stream';

const FEEDBACK_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/feedback'
  : 'https://web-production-13bd2f.up.railway.app/feedback';

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

export default function ChatWidget() {
  const [ouvert, setOuvert]       = useState(false);
  const [messages, setMessages]   = useState([{
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
  const finMessages = useRef(null);

  useEffect(() => {
    finMessages.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chargement]);

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
            question: question,
            reponse: reponse,
            evaluation: 'negatif',
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

    setMessages(prev => [...prev, { role: 'user', texte: msg, evaluation: null, streaming: false }]);
    setInput('');
    setChargement(true);
    setSuggestionsUtilisees(true);

    // Message bot vide — caché jusqu'au premier token
    setMessages(prev => [...prev, {
      role: 'bot', texte: '', evaluation: null, streaming: true
    }]);

    try {
      const rep = await fetch(STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: history }),
      });

      const reader = rep.body.getReader();
      const decoder = new TextDecoder();
      let texteComplet = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lignes = chunk.split('\n');

        for (const ligne of lignes) {
          if (ligne.startsWith('data: ')) {
            try {
              const data = JSON.parse(ligne.slice(6));

              if (data.error) {
                texteComplet = "Désolé, une erreur est survenue.";
                const texteErreur = texteComplet;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'bot', texte: texteErreur,
                    evaluation: null, streaming: false
                  };
                  return newMessages;
                });
                break;
              }

              if (!data.done) {
                texteComplet += data.token;
                const texteActuel = texteComplet;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'bot', texte: texteActuel,
                    evaluation: null, streaming: true
                  };
                  return newMessages;
                });
              } else {
                const texteFinal = texteComplet;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'bot', texte: texteFinal,
                    evaluation: null, streaming: false
                  };
                  return newMessages;
                });
                setHistory(prev => [...prev, { user: msg, bot: texteFinal }]);
              }
            } catch (e) {
              // Ignore les lignes mal formées
            }
          }
        }
      }
    } catch {
      const texteErreur = "Désolé, une erreur est survenue. Vérifiez que le serveur est lancé.";
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'bot', texte: texteErreur,
          evaluation: null, streaming: false
        };
        return newMessages;
      });
    } finally {
      setChargement(false);
    }
  };

  const reinitialiser = () => {
    setMessages([{
      role: 'bot',
      texte: "Bonjour ! Je suis l'assistant LegalStation. Comment puis-je vous aider aujourd'hui ?",
      suggestions: true,
      evaluation: null,
      streaming: false,
    }]);
    setSuggestionsUtilisees(false);
    setHistory([]);
    setInput('');
  };

  return (
    <>
      {ouvert && (
        <div style={{
          position: 'fixed', bottom: '88px', right: '24px',
          width: '360px', height: '540px',
          background: COLORS.white,
          borderRadius: '16px',
          border: `1px solid ${COLORS.border}`,
          display: 'flex', flexDirection: 'column',
          zIndex: 9999, overflow: 'hidden',
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}>

          {/* Header */}
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

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '13px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            background: COLORS.msgBg,
          }}>
            {messages.map((msg, i) => (
              <div key={i}>

                {/* Bulle — cachée si streaming et texte vide */}
                {!(msg.streaming && msg.texte === '') && (
                  <div style={{
                    background: msg.role === 'user' ? COLORS.primary : COLORS.white,
                    color: msg.role === 'user' ? '#fff' : COLORS.text,
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '10px 13px',
                    maxWidth: '90%',
                    marginLeft: msg.role === 'user' ? 'auto' : '0',
                    border: msg.role === 'bot' ? `1px solid ${COLORS.border}` : 'none',
                  }}>
                    {msg.role === 'bot'
                      ? <FormaterReponse texte={msg.texte} />
                      : <span style={{ fontSize: '13px', lineHeight: '1.5' }}>{msg.texte}</span>
                    }
                  </div>
                )}

                {/* Boutons évaluation — uniquement quand streaming terminé */}
                {msg.role === 'bot' && i > 0 && !msg.streaming && (
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
                          title="Réponse utile"
                          style={{
                            background: 'none',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: '20px', padding: '3px 9px',
                            fontSize: '13px', cursor: 'pointer',
                            transition: 'all 0.15s', lineHeight: 1,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#dcfce7';
                            e.currentTarget.style.borderColor = '#16a34a';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.borderColor = COLORS.border;
                          }}
                        >👍</button>
                        <button
                          onClick={() => evaluer(i, 'negatif', messages[i - 1]?.texte || '', msg.texte)}
                          title="Réponse à améliorer"
                          style={{
                            background: 'none',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: '20px', padding: '3px 9px',
                            fontSize: '13px', cursor: 'pointer',
                            transition: 'all 0.15s', lineHeight: 1,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.borderColor = '#dc2626';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.borderColor = COLORS.border;
                          }}
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
                        onMouseEnter={e => {
                          e.target.style.background = COLORS.primary;
                          e.target.style.color = '#fff';
                          e.target.style.borderColor = COLORS.primary;
                        }}
                        onMouseLeave={e => {
                          e.target.style.background = COLORS.primaryLight;
                          e.target.style.color = COLORS.primary;
                          e.target.style.borderColor = COLORS.border;
                        }}
                        style={{
                          background: COLORS.primaryLight,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '16px', padding: '5px 11px',
                          fontSize: '11px', color: COLORS.primary,
                          cursor: 'pointer', fontWeight: 500,
                          transition: 'all 0.15s',
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Animation chargement — uniquement si texte encore vide */}
            {chargement && messages[messages.length - 1]?.texte === '' && (
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px 12px 12px 2px',
                padding: '11px 15px',
                display: 'flex', gap: '4px', alignItems: 'center',
                alignSelf: 'flex-start',
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

          {/* Zone de saisie */}
          <div style={{
            padding: '11px 12px',
            borderTop: `1px solid ${COLORS.border}`,
            display: 'flex', gap: '8px',
            background: COLORS.white,
            alignItems: 'center',
          }}>
            <input
              style={{
                flex: 1,
                background: COLORS.msgBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '22px',
                padding: '9px 14px',
                fontSize: '13px',
                color: COLORS.text,
                outline: 'none',
              }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && envoyer()}
              placeholder="Posez votre question..."
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

      {/* Bouton flottant */}
      <button onClick={() => setOuvert(!ouvert)} style={{
        position: 'fixed', bottom: '24px', right: '24px',
        width: '54px', height: '54px', borderRadius: '50%',
        background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
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