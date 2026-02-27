
'use client';

import { useState, useRef, useEffect } from 'react';

const QUICK_OPTIONS = [
  { icon: '😰', text: 'Llevo años sin declarar. ¿Qué me pasa si me regularizo?' },
  { icon: '📩', text: 'Me llegó carta del SAT. ¿Me van a multar?' },
  { icon: '💸', text: '¿Cómo pago menos impuestos sin hacer nada ilegal?' },
  { icon: '🏠', text: 'Tengo Airbnb o Uber. ¿El SAT ya sabe de mis ingresos?' },
  { icon: '💰', text: 'Recibo efectivo y el SAT me está presionando. ¿Qué hago?' },
  { icon: '🏢', text: 'Soy dueño de negocio. ¿Cómo me pago sin que el SAT me cobre por todos lados?' },
  { icon: '📈', text: 'Tengo criptomonedas. ¿El SAT me puede cobrar impuestos?' },
  { icon: '🏡', text: 'Vendí mi casa. ¿Debo pagar ISR o hay forma legal de no pagar?' },
  { icon: '🧾', text: 'Soy freelancer con ingresos variables. ¿En qué régimen debo estar?' },
  { icon: '📋', text: 'Quiero declarar ahora mismo. Acompáñame paso a paso.' },
];

const PLANES = [
  { plan: 'Personal', precio: '$599', desc: 'Chat ilimitado, copiloto de declaración, recordatorios mensuales y estrategia fiscal personalizada', color: '#111', border: '#2a2a2a' },
  { plan: 'PyME', precio: '$1,999', desc: 'Todo lo anterior + deducciones avanzadas, estrategia fiscal activa y análisis financiero mensual', color: '#001a14', border: '#00d4aa' },
  { plan: 'PyME Pro', precio: '$3,999', desc: 'Todo lo anterior + proyección de impuestos anual y análisis financiero mensual personalizado', color: '#0a0a1a', border: '#4466ff' },
];

type Message = { role: 'user' | 'assistant'; content: string };
type View = 'home' | 'chat' | 'copiloto' | 'planes';

const PAYWALL = `━━━━━━━━━━━━━━━━━━
🔒 Función exclusiva para suscriptores

Para continuar con el copiloto de declaración en tiempo real necesitas el plan Personal.

✅ Copiloto ilimitado
✅ Chat fiscal sin límites  
✅ Recordatorio mensual antes del vencimiento
✅ Estrategia fiscal personalizada cada mes

Todo por $599/mes — menos que una multa del SAT.

👉 Escríbenos a contacto@satstuto.mx para suscribirte.
━━━━━━━━━━━━━━━━━━`;

export default function SATstuto() {
  const [view, setView] = useState<View>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [copilotoMessages, setCopilotoMessages] = useState<Message[]>([]);
  const [copilotoCount, setCopilotoCount] = useState(0);
  const [input, setInput] = useState('');
  const [copilotoInput, setCopilotoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copilotoLoading, setCopilotoLoading] = useState(false);
  const [copilotoStarted, setCopilotoStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const copilotoBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { copilotoBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [copilotoMessages, copilotoLoading]);

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply || 'Error al obtener respuesta.' }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' }]);
    }
    setLoading(false);
  };

  const sendCopiloto = async (userText: string) => {
    if (!userText.trim() || copilotoLoading) return;
    if (copilotoCount >= 3) {
      setCopilotoMessages(prev => [...prev, { role: 'user', content: userText }, { role: 'assistant', content: PAYWALL }]);
      setCopilotoInput('');
      return;
    }
    const newMessages: Message[] = [...copilotoMessages, { role: 'user', content: userText }];
    setCopilotoMessages(newMessages);
    setCopilotoInput('');
    setCopilotoLoading(true);
    setCopilotoCount(prev => prev + 1);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          system: 'Eres el copiloto de declaración de SATstuto. El usuario tiene el portal SAT abierto en otra ventana. Guíalo paso a paso en tiempo real. Pregunta qué ve en pantalla. Sé muy específico: dile exactamente dónde hacer clic, qué número capturar, qué opción seleccionar. Máximo 3 pasos por mensaje para no abrumarlo.'
        }),
      });
      const data = await res.json();
      const reply = data.reply || 'Error al obtener respuesta.';
      const updatedMessages = [...newMessages, { role: 'assistant' as const, content: reply }];
      setCopilotoMessages(updatedMessages);
      if (copilotoCount + 1 >= 3) {
        setTimeout(() => {
          setCopilotoMessages(prev => [...prev, { role: 'assistant', content: PAYWALL }]);
        }, 1500);
      }
    } catch {
      setCopilotoMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' }]);
    }
    setCopilotoLoading(false);
  };

  const startWith = (text: string) => { setView('chat'); sendMessage(text); };

  const startCopiloto = () => {
    setCopilotoStarted(true);
    const initialMsg: Message = {
      role: 'assistant',
      content: '¡Listo! Vamos a declarar juntos. 🎯\n\nPrimero dime:\n1. ¿Qué tipo de declaración vas a presentar? (mensual, anual, complementaria)\n2. ¿Ya tienes el portal SAT abierto en otra ventana?\n\nTe guío paso a paso desde donde estés.'
    };
    setCopilotoMessages([initialMsg]);
  };

  const NAV = (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1a1a1a' }}>
      {(['home', 'chat', 'copiloto', 'planes'] as View[]).map((v, i) => {
        const icons = ['🏠', '💬', '📋', '🔔'];
        return (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, background: view === v ? '#00d4aa' : '#111',
            color: view === v ? '#000' : '#666',
            border: '1px solid ' + (view === v ? '#00d4aa' : '#222'),
            borderRadius: '8px', padding: '10px 4px',
            fontSize: '18px', cursor: 'pointer',
          }}>
            {icons[i]}
          </button>
        );
      })}
    </div>
  );

  const ChatBubble = ({ m }: { m: Message }) => (
    <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '85%',
        background: m.role === 'user' ? '#00d4aa' : '#111',
        color: m.role === 'user' ? '#000' : '#ddd',
        border: m.role === 'assistant' ? '1px solid #1e1e1e' : 'none',
        borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
        padding: '12px 16px', fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap',
      }}>
        {m.content}
      </div>
    </div>
  );

  const LoadingDots = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '4px 16px 16px 16px', padding: '14px 18px', display: 'flex', gap: '5px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d4aa', animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: '580px' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '20px', padding: '6px 16px', marginBottom: '12px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d4aa' }} />
            <span style={{ color: '#00d4aa', fontSize: '11px', fontWeight: 600, letterSpacing: '2px' }}>EN LÍNEA</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-1px' }}>
            SAT<span style={{ color: '#00d4aa' }}>stuto</span>
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Que el SAT no te sorprenda.</p>
        </div>

        {NAV}

        {/* HOME */}
        {view === 'home' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {QUICK_OPTIONS.map((q) => (
                <button key={q.text} onClick={() => startWith(q.text)} style={{
                  background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
                  padding: '14px 12px', color: '#ccc', fontSize: '12px',
                  cursor: 'pointer', textAlign: 'left', lineHeight: '1.5',
                }}>
                  <span style={{ fontSize: '20px', display: 'block', marginBottom: '6px' }}>{q.icon}</span>
                  {q.text}
                </button>
              ))}
            </div>
            <button onClick={() => setView('chat')} style={{
              width: '100%', background: '#00d4aa', color: '#000',
              border: 'none', borderRadius: '10px', padding: '14px',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            }}>
              Describir mi situación →
            </button>
          </div>
        )}

        {/* CHAT LIBRE */}
        {view === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#444', fontSize: '13px', marginTop: '40px' }}>
                  Describe tu situación fiscal y te doy estrategia concreta.
                </div>
              )}
              {messages.map((m, i) => <ChatBubble key={i} m={m} />)}
              {loading && <LoadingDots />}
              <div ref={bottomRef} />
            </div>
            <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #1a1a1a' }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Describe tu situación fiscal..."
                style={{ flex: 1, background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
              <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{
                background: !loading && input.trim() ? '#00d4aa' : '#1a1a1a',
                color: !loading && input.trim() ? '#000' : '#333',
                border: 'none', borderRadius: '10px', padding: '12px 20px',
                fontSize: '18px', fontWeight: 700, cursor: !loading && input.trim() ? 'pointer' : 'default',
              }}>→</button>
            </div>
          </div>
        )}

        {/* COPILOTO */}
        {view === 'copiloto' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            {!copilotoStarted ? (
              <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Copiloto de Declaración</h2>
                <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
                  Abre el portal SAT en otra ventana.<br />Yo te guío paso a paso en tiempo real.
                </p>
                <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                  <div style={{ color: '#00d4aa', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>PRUEBA GRATIS — 3 intercambios</div>
                  <div style={{ color: '#888', fontSize: '12px', lineHeight: '1.6' }}>
                    Experimenta cómo funciona el copiloto. Para declaraciones completas sin límite, suscríbete al plan Personal.
                  </div>
                </div>
                <button onClick={startCopiloto} style={{
                  width: '100%', background: '#00d4aa', color: '#000',
                  border: 'none', borderRadius: '10px', padding: '14px',
                  fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                }}>
                  Iniciar copiloto gratuito →
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: '#888', fontSize: '12px' }}>Copiloto activo</span>
                  {copilotoCount < 3 && (
                    <span style={{ color: '#00d4aa', fontSize: '12px', background: '#001a14', border: '1px solid #00d4aa', borderRadius: '20px', padding: '2px 10px' }}>
                      {3 - copilotoCount} intercambios gratis restantes
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
                  {copilotoMessages.map((m, i) => <ChatBubble key={i} m={m} />)}
                  {copilotoLoading && <LoadingDots />}
                  <div ref={copilotoBottomRef} />
                </div>
                {copilotoCount < 3 && (
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #1a1a1a' }}>
                    <input value={copilotoInput} onChange={e => setCopilotoInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendCopiloto(copilotoInput)}
                      placeholder="¿Qué ves en pantalla?"
                      style={{ flex: 1, background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />
                    <button onClick={() => sendCopiloto(copilotoInput)} disabled={copilotoLoading || !copilotoInput.trim()} style={{
                      background: !copilotoLoading && copilotoInput.trim() ? '#00d4aa' : '#1a1a1a',
                      color: !copilotoLoading && copilotoInput.trim() ? '#000' : '#333',
                      border: 'none', borderRadius: '10px', padding: '12px 20px',
                      fontSize: '18px', fontWeight: 700, cursor: !copilotoLoading && copilotoInput.trim() ? 'pointer' : 'default',
                    }}>→</button>
                  </div>
                )}
                {copilotoCount >= 3 && (
                  <div style={{ paddingTop: '12px', borderTop: '1px solid #1a1a1a', textAlign: 'center' }}>
                    <a href="mailto:contacto@satstuto.mx" style={{
                      display: 'block', background: '#00d4aa', color: '#000',
                      borderRadius: '10px', padding: '14px', fontSize: '14px',
                      fontWeight: 700, textDecoration: 'none',
                    }}>
                      Suscribirme al Plan Personal — $599/mes →
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PLANES */}
        {view === 'planes' && (
          <div style={{ overflowY: 'auto', maxHeight: '70vh' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>Lo que recibes cada mes</h2>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>No una respuesta. Vigilancia continua.</p>

            {[
              { icon: '📅', titulo: 'Recordatorio de declaración', desc: '5 días antes del vencimiento: fecha límite, estimado de pago y link directo al portal SAT.' },
              { icon: '📊', titulo: 'Estrategia mensual personalizada', desc: 'Basada en tus ingresos del mes: deducciones que adelantar, topes de régimen, cierres fiscales.' },
              { icon: '⚠️', titulo: 'Alerta de riesgo activo', desc: 'Si el SAT cruza nuevas bases de datos o hay cambios en tu régimen, te avisamos antes de que llegue la carta.' },
              { icon: '📋', titulo: 'Resumen fiscal mensual', desc: 'Cuánto pagaste, cuánto dedujiste, cómo vas en el año. En un mensaje, no en un portal confuso.' },
            ].map((item) => (
              <div key={item.titulo} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '14px', marginBottom: '10px', display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <div>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{item.titulo}</div>
                  <div style={{ color: '#888', fontSize: '12px', lineHeight: '1.6' }}>{item.desc}</div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {PLANES.map(p => (
                <div key={p.plan} style={{ background: p.color, border: '1px solid ' + p.border, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#888', fontSize: '11px', letterSpacing: '1px', marginBottom: '4px' }}>{p.plan.toUpperCase()}</div>
                    <div style={{ color: '#aaa', fontSize: '12px', maxWidth: '240px', lineHeight: '1.4' }}>{p.desc}</div>
                  </div>
                  <div style={{ color: '#fff', fontSize: '22px', fontWeight: 800, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    {p.precio}<span style={{ fontSize: '11px', fontWeight: 400, color: '#555' }}>/mes</span>
                  </div>
                </div>
              ))}
            </div>

            <a href="mailto:contacto@satstuto.mx" style={{
              display: 'block', width: '100%', background: '#00d4aa', color: '#000',
              border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px',
              fontWeight: 700, cursor: 'pointer', marginTop: '14px', textAlign: 'center', textDecoration: 'none',
            }}>
              Quiero que el SAT no me sorprenda →
            </a>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <span style={{ color: '#444', fontSize: '11px' }}>Orientación fiscal con alta precisión. Para casos complejos, complementa con validación profesional.</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        *{box-sizing:border-box} body{margin:0;background:#0a0a0a}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#0a0a0a} ::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
        input::placeholder{color:#444}
        button:active{opacity:.85}
      `}</style>
    </div>
  );
}
