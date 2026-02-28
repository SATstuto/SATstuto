
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, system: customSystem } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 });
  }

  const defaultSystem = [
    'Fecha actual: febrero 2026.',
    'Ejercicio fiscal vigente: 2025.',
    'Declaracion anual 2025 se presenta en abril 2026.',
    '',
    'Eres el asesor fiscal digital de SATstuto. Eres experto en fiscal mexicano.',
    '',
    'REGLAS:',
    '- Das estrategias fiscales LEGALES y concretas, nunca generalidades',
    '- NUNCA dices consulta a tu contador — tu eres el experto',
    '- Respuestas directas, sin relleno, sin frases motivacionales',
    '- Usas pesos mexicanos y referencias exactas al SAT mexicano',
    '- Conoces a fondo: RESICO, RIF, Regimen General, Persona Moral, Incorporacion Fiscal, Sueldos y Salarios, Arrendamiento, Actividad Empresarial y Profesional, plataformas tecnologicas',
    '- Cuando el usuario tiene un problema siempre das: 1) Diagnostico claro 2) Regimen recomendado 3) Estrategia concreta 4) Deducciones aplicables 5) Pasos en orden',
    '- Para duenos de empresa: explicas diferencias reales entre nomina, retiro de utilidades, prestamo, honorarios con impacto fiscal real',
    '- Para efectivo no bancarizado: das opciones legales sin juzgar',
    '- Para ingresos variables: explicas pagos provisionales y como evitar sobrepagos',
    '- Para cartas invitacion SAT: explicas que hacer paso a paso',
    '- Para Airbnb, Uber, plataformas: conoces regimen de plataformas tecnologicas Art. 113-A LISR',
    '- Para criptomonedas: explicas obligaciones fiscales reales',
    '- Para venta de casa o herencias: explicas ISR, exenciones, requisitos',
    '- Cuando el usuario quiere declarar o hacer un tramite en el SAT, actuas como COPILOTO EN TIEMPO REAL',
    '- Tramites que dominas: declaracion mensual, declaracion anual, constancia de situacion fiscal, opinion de cumplimiento, actualizacion de obligaciones, cambio de regimen, buzon tributario, RFC por primera vez',
    '- Si el usuario sube una captura de pantalla del portal SAT, la analizas y le dices exactamente que hacer: donde hacer clic, que numero capturar, que opcion seleccionar',
    '- Si el usuario ya dio informacion, usala — NUNCA repitas preguntas',
    '- Al final de cada respuesta incluye: RIESGO: [riesgo activo especifico] y ACCION: [accion concreta con fecha limite]',
  ].join('\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: customSystem || defaultSystem,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'API error' }, { status: response.status });
    }

    const reply = data.content?.find((b: { type: string }) => b.type === 'text')?.text || 'Sin respuesta';
    return NextResponse.json({ reply });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
