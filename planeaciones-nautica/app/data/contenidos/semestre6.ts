// Programas oficiales semestre 6 Piloto Naval (PN).
// Generado por scripts/integrar-contenidos-pares.mjs desde _generados-pares/ (biblioteca espejo
// F-32 Ene–Jun 2026). Evaluación normalizada a DEN-526-2025 / DEN-065-2026. NO editar a mano:
// re-generar desde los JSON fuente.
import type { ProgramaOficial } from "../tipos";

export const contenidosSemestre6: Record<string, ProgramaOficial> = {
  "Educación Física": {
    "clave": "CO011",
    "nombre": "Educación Física",
    "tipo": "Práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 3,
      "teoricas": 0,
      "practicas": 54,
      "independientes": 0,
      "total": 54
    },
    "objetivoGeneral": "Realiza movimientos físicos para el desarrollo de la percepción y mejora de la coordinación motriz fina y gruesa en el desempeño de cualquier función.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Percepción y coordinación motriz",
        "objetivoEspecifico": "Ejecuta movimientos físicos de forma adecuada, desarrollando la percepción y coordinación motriz, psicomotriz, para favorecer la ubicación en el espacio, tiempo, equilibrio y lateralidad.",
        "subtemas": [
          "1.1. Movimientos físicos.",
          "1.2. Ubicación espacial.",
          "1.3. Coordinación motriz y psicomotriz.",
          "1.4. Equilibrio.",
          "1.5. Lateralidad."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Desarrollo físico integral",
        "objetivoEspecifico": "Realiza ejercicios de estimulación, incremento y mantenimiento de la fuerza muscular, resistencia cardiorrespiratoria, la flexibilidad articular y muscular, a través de rutinas adecuadas para favorecer el desarrollo físico integral.",
        "subtemas": [
          "2.1. Fuerza muscular.",
          "2.2. Resistencia cardiorrespiratoria.",
          "2.3. Flexibilidad articular y muscular."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Concentración",
        "objetivoEspecifico": "Favorece la concentración, aplicando tácticas en distintos juegos, para el desarrollo integral de funciones mentales.",
        "subtemas": [
          "3.1. Fútbol.",
          "3.2. Juegos de concentración.",
          "3.3. Básquetbol.",
          "3.4. Voleibol."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Condición física",
        "objetivoEspecifico": "Favorece la condición física, a través de ejercicios de fuerza, vigor y flexibilidad, para el desarrollo integral de funciones físicas.",
        "subtemas": [
          "4.1. Fuerza.",
          "4.2. Vigor.",
          "4.3. Flexibilidad."
        ],
        "transversal": false
      }
    ],
    "bibliografia": [
      "Campos G. Actividad física para la vida y la salud, Ciencia de salud y el deporte. Kinesis, 2003.",
      "Lloret, Mario. Anatomía aplicada a la actividad física y deportiva. Paidotribo, 2000.",
      "López de Viñaspre. Manual de educación física y deportes. Océano, 2000."
    ],
    "fuente": "plan_18 EDUCACION FISICA VI A PN.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "práctica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Examen parcial De la unidad I,II, al subtema 3.2 de la unidad III, un total de 100%",
                  "instrumento": "Rubrica"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Ejercicios sobre la ubicación espacial",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "El alumno realiza ejercicios sobre su lateralidad",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "El alumno realiza ejercicios sobre la resistencia cardio respiratoria",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "El alumno realiza ejercicios sobre la flexibilidad articular",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "El alumno realiza ejercicios sobre Juegos de concentración",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "El alumno participa con ejercicios de voleibol",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 25,
              "desglose": []
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": []
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  },
  "Electrónica": {
    "clave": "ELC642",
    "nombre": "Electrónica",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 0,
      "porSemana": 3,
      "teoricas": 27,
      "practicas": 27,
      "independientes": 8,
      "total": 62
    },
    "objetivoGeneral": "Interpreta el funcionamiento de los semiconductores en diodos y transistores, su aplicación en rectificadores, reguladores de voltaje, amplificadores, osciladores y circuitos integrados, para identificar averías y fallas.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Introducción",
        "objetivoEspecifico": "Conocer los parámetros eléctricos básicos, sistemas de medición y componentes, analizando su funcionamiento, para entender su uso adecuado.",
        "subtemas": [
          "1.1. Definiciones de los parámetros eléctricos.",
          "1.2. Unidades de los parámetros eléctricos básicos.",
          "1.3. Componentes básicos (resistencias, capacitores, bobinas, etc).",
          "1.4. Sistemas de medición eléctrica (multímetro, osciloscopio, Megger).",
          "1.5. Conversión de unidades."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Análisis de circuitos",
        "objetivoEspecifico": "Comprender el funcionamiento de circuitos a partir de las leyes de Ohm y Kirchhoff, además de conocer las técnicas determinadas para su análisis.",
        "subtemas": [
          "2.1. Leyes de Ohm.",
          "2.2. Leyes de Kirchhoff.",
          "2.3. Técnica de análisis de circuitos por mallas.",
          "2.4. Técnica de análisis de circuitos por nodos."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Dispositivos de estado sólido",
        "objetivoEspecifico": "Conocer los dispositivos de estado sólido, analizando los materiales que los componen, para entender sus características ideales.",
        "subtemas": [
          "3.1. Materiales semiconductores.",
          "3.2. Materiales extrínsecos: tipos P y N.",
          "El diodo ideal (características eléctricas de acuerdo a su curva característica)."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Diodos y sus aplicaciones",
        "objetivoEspecifico": "Conocer el funcionamiento de los diodos y sus aplicaciones, a través del análisis en corriente directa y alterna para determinar su adecuado uso.",
        "subtemas": [
          "4.1. Tipos de diodos, características principales y aplicaciones.",
          "4.2. Análisis en corriente directa de circuitos con diodos.",
          "4.3. Análisis en corriente alterna de diodos rectificadores (proceso de rectificación de media onda y onda completa)."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Transistores",
        "objetivoEspecifico": "Identificar la constitución de los transistores NPN y PNP, analizando sus configuraciones básicas en corriente directa, para determinar su función y adecuado uso.",
        "subtemas": [
          "5.1. Construcción de transistores NPN y PNP.",
          "5.2. Polarización de las uniones del transistor.",
          "5.3. Análisis en corriente directa de las configuraciones básicas del transistor."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Circuitos integrados",
        "objetivoEspecifico": "Conocer los circuitos integrados, a través de su adecuada clasificación y funcionamiento para entender su utilidad.",
        "subtemas": [
          "6.1. Composición, clasificación y escala de integración.",
          "6.2. Familias de circuitos integrados.",
          "6.3. Identificación de terminales y circuitos integrados.",
          "6.4. Identificación de los circuitos integrados."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Análisis de circuitos electrónicos",
        "objetivoEspecifico": "Comprender el funcionamiento de circuitos electrónicos, identificando terminología y medición adecuada de parámetros en elementos electrónicos, además de entender el funcionamiento del sistema automático de regulación de voltaje.",
        "subtemas": [
          "7.1. Modelos de circuitos.",
          "7.2. Terminología y medición de parámetros de elementos electrónicos.",
          "7.3 Análisis del sistema automático de regulación de voltaje."
        ],
        "transversal": false
      },
      {
        "numero": 8,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "8. Contenidos de actualidad en el sector marítimo portuario"
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "García T, J (2002) Electrotecnia, Madrid España; PARANINFO",
      "Martínez F. (2009). Apuntes de electricidad aplicada a los buques. México Club Universitario",
      "Mileaf, H. (2014). Electricidad Serie 1-7. México: Limusa",
      "Braga, N (SF) Curso Electrónica Básica, Editorial NCB (Libro electrónico)"
    ],
    "fuente": "plan_193 ELCTRONICA VI B PN.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "teórica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "CONOCIMIENTO - 1ERA EVALUACION PARCIAL",
                  "instrumento": "EXAMEN"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Identificación de las partes de un motor/generador",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Construcción de un circuito rectificador de onda completa",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Construcción de un circuito secuencial simulando permisivos on/off",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "PARTICIPACIONES Y USO DE TICS - Exponer un equipo electrónico usado operaciones náuticas a bordo",
                  "instrumento": "Lista de cotejo."
                }
              ]
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": []
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": []
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  },
  "Laboratorio de Navegación": {
    "clave": "LNV639",
    "nombre": "Laboratorio de Navegación",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 0,
      "porSemana": 4,
      "teoricas": 18,
      "practicas": 54,
      "independientes": 10,
      "total": 82
    },
    "objetivoGeneral": "Conocer y utilizar los equipos de navegación, identificando sus funciones y realizando prácticas en el simulador, para desarrollar una navegación eficiente y segura.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Introducción al uso del simulador Navitrainer",
        "objetivoEspecifico": "Conocer el funcionamiento de los controles del simulador Navitrainer, identificándolos para una correcta operación.",
        "subtemas": [
          "1.1 Descripción de las partes comunes de la pantalla.",
          "1.2 Panel de información.",
          "1.3 Panel de control del piloto automático.",
          "1.4 Panel de control de la ecosonda y corredera.",
          "1.5 Panel de control de las señales.",
          "1.6 Panel de control de los winches y winche de levas.",
          "1.7 Panel de control del giro.",
          "1.8 Panel de las alarmas.",
          "1.9 Panel de control de las ayudas a la navegación."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Manejo del radar convencional",
        "objetivoEspecifico": "Conocer y utilizar los controles del simulador de radar, identificándolos y observando su funcionamiento, para una correcta operación.",
        "subtemas": [
          "2.1 Controles de Radar y menús.",
          "2.2 Ajuste y conservación de la imagen obtenida por el Radar.",
          "2.3 Interpretación de la imagen del Radar diferentes movimientos y presentaciones.",
          "2.4 Medición de distancias y marcaciones."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Manejo del radar APRA",
        "objetivoEspecifico": "Conocer y utilizar los controles del simulador APRA, identificándolos y observando su funcionamiento, para una correcta ejecución.",
        "subtemas": [
          "3.1 Ajuste y conservación de la imagen de un APRA.",
          "3.2 Adquisición manual y automática de los blancos y sus respectivas limitaciones.",
          "3.3 Obtención de información sobre los blancos."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "GPS",
        "objetivoEspecifico": "Conocer y utilizar los controles del simulador GPS, identificándolos y observando su funcionamiento, para una correcta operación.",
        "subtemas": [
          "4.1 Panel de control.",
          "4.2 Operación manual.",
          "4.3 Inicialización.",
          "4.4 Pantalla de navegación.",
          "4.5 Cargando la derrota del buque propio."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Sistema de identificación y automático",
        "objetivoEspecifico": "Conocer y utilizar los controles del simulador AIS, identificándolos y observando su funcionamiento, para una correcta operación.",
        "subtemas": [
          "5.1 Encendido.",
          "5.2 Menú principal.",
          "5.3 Visualización y edición de los datos estáticos y de viaje.",
          "5.4 Envío de mensajes de texto.",
          "5.5 Visualización de los telegramas recibidos."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Operación de un sistema ECDIS",
        "objetivoEspecifico": "Conocer y operar los controles simulados del ECDIS, identificándolos y aplicándolos, para una eficaz ejecución.",
        "subtemas": [
          "6.1 Operación de las funciones básicas.",
          "6.2 Seleccionando el modo apropiado para la operación.",
          "6.3. Actualización de las cartas.",
          "6.4 Inicio y configuración.",
          "6.5 Planeando la derrota.",
          "6.6 Modo de monitoreo de la derrota.",
          "6.7 Identificación de las características adicionales.",
          "6.8 Función de la bitácora del equipo.",
          "6.9 Indicadores y alarmas."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "7.0 Contenido de Actualidad en el Sector Marítimo Portuario",
          "7.1 Buques de Navegación Autónoma"
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "BOWDITCH, NATHANIEL. 1977. \"American Practical Navigator\". Defense Mapping Agency Hydographic Center.",
      "Juan B. Cardell // Editorial Asnautic. Reglamento para evitar abordaje I.A.LA Code.",
      "Manuales de operación del NAVITRAINER 5000 (versión 5.25) / 2011 Transas Marine Ltd.",
      "Guía ilustrada de maniobras para embarcaciones de vela y motor. Edición 2007. Autor Harald Schwarzlose. Robert Das. Publicación Tutor.",
      "Manual de operación del simulador de navegación. Navi Transas. Edición 2004 Microsoft Corporation.",
      "Schwarzlose, H.; y Das, R. (2007). Guía ilustrada de maniobras para embarcaciones de vela y motor. Robert Das. España: Publicación Tutor.",
      "Microsoft Corporation (2004). Manual de operación del simulador de navegación. Navi Transas.",
      "Sistema de Red a la carta NVDO \"Videotel\""
    ],
    "fuente": "plan_149 LABORATORIO NAVEGACION VI B PN.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "práctica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Examen Primer Parcial",
                  "instrumento": "Examen Sumativo"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Elabora un Organizador Gráfico",
                  "instrumento": "Lista de Cotejo"
                },
                {
                  "criterio": "Prácticas Radar Convencional",
                  "instrumento": "Guía de Observación"
                },
                {
                  "criterio": "Prácticas de Radar ARPA en Simulador Navitrainer",
                  "instrumento": "Guía de Observación"
                },
                {
                  "criterio": "Trabajo Comparativo de Investigación sobre Radar ARPA y Convencional",
                  "instrumento": "Lista de Cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participación Oral",
                  "instrumento": "Lista de Cotejo"
                }
              ]
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Examen Segundo Parcial",
                  "instrumento": "Examen Sumativo"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Prácticas G.P.S en Simulador Navitrainer",
                  "instrumento": "Guía de Observación"
                },
                {
                  "criterio": "Elabora Lista de Verificación para Actualizar A.I.S",
                  "instrumento": "Lista de Cotejo"
                },
                {
                  "criterio": "Prácticas en E.C.D.I.S en Simulador Navitrainer",
                  "instrumento": "Guía de Observación"
                },
                {
                  "criterio": "Síntesis de la utilidad de los Controles del GPS",
                  "instrumento": "Lista de Cotejo"
                },
                {
                  "criterio": "Elabora Plan de Viaje para seguimiento en ECDIS",
                  "instrumento": "Lista de Cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  },
  "Maniobras II": {
    "clave": "MAN640",
    "nombre": "Maniobras II",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 19,
      "porSemana": 4,
      "teoricas": 54,
      "practicas": 18,
      "independientes": 10,
      "total": 82
    },
    "objetivoGeneral": "Conocer los procedimientos de maniobra del buque, considerando los factores internos y externos que intervienen, para una operación segura.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Maniobra de atraque y desatraque",
        "objetivoEspecifico": "Conocer e identificar los tipos de maniobra y cabos, analizando una maniobra, para realizar un atraque o desatraque seguro.",
        "subtemas": [
          "1.1 Denominación de los cabos de acuerdo a su función en una maniobra.",
          "1.2 Atraque y desatraque de costado a un muelle.",
          "1.3 Maniobra de amarre y desamarre a una monoboya.",
          "1.4 Maniobra de arrejeramiento y desarrejeramiento a un muelle.",
          "1.5 Maniobra de abarloamiento y desabarloamiento a una embarcación."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Remolcadores",
        "objetivoEspecifico": "Conocer los tipos de remolcadores, analizando sus funciones, para garantizar operaciones seguras.",
        "subtemas": [
          "2.1 Tipos de remolcadores y sus funciones.",
          "2.2 Equipo para remolque.",
          "2.3 Aproximación a un buque.",
          "2.4 Maniobras de remolque.",
          "2.5 Atracando y desatracando un remolque",
          "2.6 Pérdida del remolque",
          "2.7 Cuidados con el cable de remolque.",
          "2.8 Maniobra de asistencia a otros buques en maniobra de atraque y desatraque."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Maniobra en hielo",
        "objetivoEspecifico": "Conocer los principios generales de las maniobras en hielo, identificando las características de los buques y de las zonas, para la navegación segura.",
        "subtemas": [
          "3.1 Clasificación/limitaciones del Buque para navegar en hielo.",
          "3.2 Preparación del buque.",
          "3.3 Entrando en una placa de hielo.",
          "3.4 Remolcando en hielo.",
          "3.5 Fondeo y atraque en hielo."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Varada",
        "objetivoEspecifico": "Identificar las maniobras pertinentes en caso de varada, analizando causas y procedimientos, para evaluar los daños causados por esta condición.",
        "subtemas": [
          "4.1 Acciones inmediatas.",
          "4.2 Procedimientos de rebote.",
          "4.3 Varada intencional."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Diques",
        "objetivoEspecifico": "Comprender las maniobras de entrada/salida a diques, analizando los procedimientos establecidos, para garantizar una correcta operación.",
        "subtemas": [
          "5.1 Tipos.",
          "5.2 Entradas.",
          "5.3 Reflote."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Maniobras en emergencia",
        "objetivoEspecifico": "Conocer las maniobras en caso de emergencia, analizando los procedimientos aplicables en situaciones concretas, para salvaguardar la integridad de la vida humana, la protección del medio ambiente, del buque y la carga.",
        "subtemas": [
          "6.1 Maniobrando un buque dañado.",
          "6.2 Rescate a sobrevivientes.",
          "6.3 Procedimiento de hombre al agua."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Navegación con mal tiempo",
        "objetivoEspecifico": "Identificar las maniobras en caso de mal tiempo, analizando los procedimientos aplicables en situaciones concretas, para salvaguardar la integridad de la vida humana, la protección del medio ambiente, del buque y la carga.",
        "subtemas": [
          "7.1 Comportamiento del buque.",
          "7.2 Cambio de rumbo.",
          "7.3 Preparando el buque para mal tiempo."
        ],
        "transversal": false
      },
      {
        "numero": 8,
        "tema": "Control de averías",
        "objetivoEspecifico": "Identificar las maniobras pertinentes en caso de averías, analizando causas y procedimientos, para evaluar los daños causados por esta condición.",
        "subtemas": [
          "8.1 Colisiones.",
          "8.2 Después del impacto.",
          "8.3 Reparación temporal.",
          "8.4 Averías de mal tiempo.",
          "8.5 Pérdidas del timón."
        ],
        "transversal": false
      },
      {
        "numero": 9,
        "tema": "Maniobras en costa afuera",
        "objetivoEspecifico": "Conocer e identificar los tipos de maniobras, analizando los procedimientos dispuestos, para efectuar una operación segura.",
        "subtemas": [
          "9.1 Tipos de maniobras.",
          "9.2 Rolado de anclas.",
          "9.3 Posicionamiento de una plataforma autoelevable.",
          "9.4 Posicionamiento en proximidades de plataforma.",
          "9.5 Operación de buceo saturado y de superficie.",
          "9.6 Tendido de líneas."
        ],
        "transversal": false
      },
      {
        "numero": 10,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "Digitalización y puertos inteligentes",
          "Automatización",
          "Uso de energías limpias y sostenibilidad"
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Maneuvering and Control of Marine Vehicles (2021)",
      "Ship Handling (ediciones recientes 2016–2020)",
      "Bridge Team Management (últimas ediciones 2017+)",
      "Maniobra avanzada en propulsores azimutales y waterjets en buques de pasaje (2025)",
      "ATLS Automated Trailer Loading for Surface Vessels (2024)",
      "Safe Payload Transfer with Ship Mounted Cranes (2025)"
    ],
    "fuente": "planeaci8n8didactica_2 MANIOBRAS II GRUPO VI B PN.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "teórica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "CONOCIMIENTO - 1era evaluación parcial (Unidad 4)",
                  "instrumento": "Evaluación sumativa"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Practicas (Unidad 1)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Practicas (Unidad 3)",
                  "instrumento": "Lista de cotejo."
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "PARTICIPACIONES Y USO DE TICS - Participaciones (Unidad 2)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "PARTICIPACIONES Y USO DE TICS - Participaciones (Unidad 4)",
                  "instrumento": "Lista de cotejo."
                }
              ]
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": []
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": []
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  },
  "Navegación IV": {
    "clave": "NAV637",
    "nombre": "Navegación IV",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 5,
      "teoricas": 102,
      "practicas": 72,
      "independientes": 12,
      "total": 174
    },
    "objetivoGeneral": "Conocer y comprender los principios de la navegación electrónica, identificando equipos y realizando prácticas en el simulador, para desarrollar una navegación eficiente y segura.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Sistema de Navegación por Satélite",
        "objetivoEspecifico": "Conocer los distintos tipos de navegación por satélite, identificando su uso y componentes, para interpretar los datos que estos equipos proporcionan.",
        "subtemas": [
          "1.1 Generalidades.",
          "1.2 Capacidad del sistema.",
          "1.3 Receptores GPS y DGPS.",
          "1.4 Descripción y funcionamiento.",
          "1.5 Operación de equipos",
          "1.6 Errores del sistema."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Navegación hiperbólica",
        "objetivoEspecifico": "Conocer la navegación hiperbólica, clasificando los diferentes sistemas utilizados para tal fin.",
        "subtemas": [
          "2.1 Generalidades.",
          "2.2 Sistema LORAN.",
          "2.3 Descripción"
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Ecosonda",
        "objetivoEspecifico": "Utilizar la información de un ecosonda, a través de la interpretación otorgada por el equipo, para la navegación segura.",
        "subtemas": [
          "3.1 Generalidades.",
          "3.2 Descripción y funcionamiento de los diferentes tipos de Ecosondas.",
          "3.3 Operación de los diferentes tipos de Ecosondas.",
          "3.4 Determinación de errores y calibración de las Ecosondas."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Corredera",
        "objetivoEspecifico": "Interpretar la información proporcionada por los instrumentos, realizando una lectura adecuada, para estimar la velocidad horaria del buque.",
        "subtemas": [
          "4.1 Generalidades.",
          "4.2 Descripción y operación de los diferentes tipos de correderas.",
          "4.3 Determinación de errores."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Sistema de identificación automático (AIS)",
        "objetivoEspecifico": "Conocer el funcionamiento y manejo del equipo, identificando sus componentes e interpretando la información, para el control del tráfico marítimo.",
        "subtemas": [
          "5.1 Generalidades.",
          "5.2 Edición de los datos estáticos y de viaje.",
          "5.3 Visualización de la información del AIS.",
          "5.4 Envío de mensajes de texto.",
          "5.5 Visualización de los mensajes de texto recibidos."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Sistemas integrados de Navegación (ECDIS)",
        "objetivoEspecifico": "Utilizar los sistemas integrados de navegación, mediante la integración teórico/práctica del manual (navi trainer), para una navegación eficaz.",
        "subtemas": [
          "6.1 Generalidades.",
          "6.2 Activación y ajustes.",
          "6.3 Manejo de cartas.",
          "6.4 Control del sistema y ajustes de seguridad.",
          "6.5 Tareas de navegación.",
          "6.6 Actualización de cartas.",
          "6.7 Manejo y obtención de información.",
          "6.8 Visión y procesamiento de datos."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "Comercio marítimo mundial y cadenas logísticas",
          "Congestión portuaria y digitalización",
          "Automatización y puertos inteligentes",
          "Descarbonización y sostenibilidad (IMO, emisiones)",
          "Seguridad marítima y portuaria",
          "Impacto de conflictos, pandemias y crisis económicas"
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Sistema de navegación desde el compás magnético a la navegación por satélite - CORBASI OTIN, ANGEL - MC GRAW-HILL - 200",
      "Introducción a los sistemas de navegación por satélite - OLMEDILLAS, JUAN CARLOS - UOC - 2009",
      "America practical navigator - BOWDITCH, NATHANIAL - 2002",
      "Noticias marítimas especializadas",
      "Informes de la OMI, UNCTAD, CEPAL",
      "Videos documentales",
      "Mapas de comercio marítimo",
      "Entrevistas a profesionales del sector"
    ],
    "fuente": "planeacion_2 NAVEGACION IV VIA PN.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "teórica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Estimar la velocidad horaria del buque",
                  "instrumento": "EXAMEN"
                },
                {
                  "criterio": "1RA. Evaluación Parcial",
                  "instrumento": "EXAMEN"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Utilizar datos de posicionamiento en aplicaciones reales.",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Conocer la navegación hiperbólica",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Usar el ecosonda para la navegación segura",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Participar en prácticas",
                  "instrumento": "Rúbrica"
                },
                {
                  "criterio": "Participar en prácticas",
                  "instrumento": "Rúbrica"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "2DA Evaluación Parcial",
                  "instrumento": "EXAMEN"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Conocer los datos estáticos y dinámicos del AIS",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas del manual navi trainer",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Temas de actualidad del sector marítimo",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participación del AIS",
                  "instrumento": "Rúbrica"
                },
                {
                  "criterio": "Participación del ECDIS",
                  "instrumento": "Rúbrica"
                }
              ]
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  },
  "Pensamiento Crítico": {
    "clave": "C0106",
    "nombre": "Pensamiento Crítico",
    "tipo": "Teórica",
    "horas": {
      "semanas": 0,
      "porSemana": 4,
      "teoricas": 20,
      "practicas": 0,
      "independientes": 0,
      "total": 20
    },
    "objetivoGeneral": "Valorar el pensamiento crítico, identificando los beneficios que implica, para el eficaz desempeño profesional.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Pensamiento Crítico",
        "objetivoEspecifico": "Reconoce los beneficios del pensamiento crítico, analizando las ventajas que brinda, para favorecer el eficaz desempeño en la actividad profesional.",
        "subtemas": [
          "1.1 Adopción de la actitud de un pensador crítico",
          "1.2 Barreras para desarrollar el pensamiento crítico",
          "1.3 Principales sesgos cognitivos",
          "1.4 Prejuicios cognitivos"
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Pensar y Tomar Decisiones",
        "objetivoEspecifico": "Comprende la toma de decisiones con base en un pensamiento crítico y su eficiencia en el campo profesional.",
        "subtemas": [
          "2.1 Pensamiento crítico.",
          "2.2 Formación en valores y actitudes.",
          "2.3 Ámbitos que se desarrollan con el pensamiento crítico y creativo.",
          "2.4 Patrones de experiencia.",
          "2.5 Creatividad y criticidad."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Componentes del Pensamiento Crítico",
        "objetivoEspecifico": "Implementa las características del pensamiento creativo y crítico en su formación profesional.",
        "subtemas": [
          "3.1 Elementos característicos del pensamiento creativo y crítico.",
          "3.2 Relación entre el pensamiento crítico y el creativo.",
          "3.3 Habilidades relacionadas con el pensamiento creativo.",
          "3.4 Desarrollo del pensamiento crítico y creativo."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Pensamiento Lateral",
        "objetivoEspecifico": "Aplica el pensamiento lateral en la resolución de problemas relacionados con su vida personal y profesional.",
        "subtemas": [
          "4.1 Funcionamiento de la mente.",
          "4.2 Diferencia entre pensamiento lateral y vertical.",
          "4.3 Actitudes hacia el pensamiento lateral.",
          "4.4 El pensamiento lateral, su naturaleza fundamental.",
          "4.5 Uso del pensamiento lateral."
        ],
        "transversal": false
      }
    ],
    "bibliografia": [
      "Darnaculleta, A.; Iranzo, N.; Planas, N. (2009). El pensamiento crítico en actividades de contexto real. XVI JAEM. Recuperado de http://pagines.uab.cat/nuria_planas/sites/pagines.uab.cat.nuria_planas/files/El_pensamiento_critico_en_actividades_de_contexto_real_ADarnaculleta_PROTEGIDO_0.pdf",
      "Espíndola, J. L. Espíndola, M. (2005). Pensamiento crítico. México: Pearson Educación.",
      "https://amadag.com/pensamiento-lateral/",
      "http://ingeniosamente.com.ar/diferencias-entre-el-pensamiento-lateral-y-pensamiento-lineal/",
      "http://pensamiento-critico-reativo.blogspot.com/"
    ],
    "fuente": "vi8b8pn8 PENSAMIENTO CRITICO  VI B PN.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "teórica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Cuestionario",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Examen",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Actividad 1, 2",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Actividad 1,2,3",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Mapa conceptual",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participación del estudiante",
                  "instrumento": "Preguntas"
                }
              ]
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": []
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Estudio de caso",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Resumen",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  },
  "Prácticas Marineras VI": {
    "clave": "PMR644",
    "nombre": "Prácticas Marineras VI",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 3,
      "teoricas": 18,
      "practicas": 36,
      "independientes": 0,
      "total": 54
    },
    "objetivoGeneral": "Aplicar la destreza para elaborar costuras y nudos con cabos para utilizarlas como accesorios en las escalas del buque y en embarcaciones a vela, identificando los cabos de amarre según la situación del buque.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Pastecas y cuadernales",
        "objetivoEspecifico": "Manejar pesos utilizando pastecas y cuadernales para multiplicar la fuerza.",
        "subtemas": [
          "1.1. Nomenclatura.",
          "1.2. Uso y aplicación."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Cabos de amarre",
        "objetivoEspecifico": "Identificar los cabos por su nombre, considerando la posición y la dirección en la que trabajan con respecto al buque para un uso efectivo de ellos.",
        "subtemas": [
          "2.1. Identificación por su situación."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Costuras con cabos",
        "objetivoEspecifico": "Unir cabos mediante las costuras necesarias para maniobrar en los buques con seguridad.",
        "subtemas": [
          "3.1. Costuras redondas.",
          "3.2. Empulgeras.",
          "3.3. Unión de cabos."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Nudos especiales y de ornato",
        "objetivoEspecifico": "Elaborar los diferentes nudos, aplicando la técnica adecuada para utilizarlos de forma eficiente en el buque.",
        "subtemas": [
          "4.1. Cabeza de turco.",
          "4.2. Barrilete.",
          "4.3. Botón de dos puntas.",
          "4.4. Nudo de campana."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Escalas de piloto",
        "objetivoEspecifico": "Identificar una escala de piloto enumerando sus partes y describiendo el mantenimiento que requiere y la forma de instalarla para el embarque o desembarque del piloto.",
        "subtemas": [
          "5.1. Características.",
          "5.2. Mantenimiento.",
          "5.3. Instalación abordo.",
          "5.4. Requisitos especiales en el Canal de Panamá."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Escalas reales",
        "objetivoEspecifico": "Describir la forma en que se arma una escala real y su instalación, mediante la mención de sus componentes, para utilizarla con seguridad.",
        "subtemas": [
          "6.1. Partes que la componen.",
          "6.2. Guarnido de la misma.",
          "6.3. Medidas de seguridad."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Embarcaciones de vela",
        "objetivoEspecifico": "Describir los diferentes tipos de embarcaciones a vela mencionando las partes de ellas para un manejo apropiado y seguro de las naves.",
        "subtemas": [
          "7.1. Tipos de velas.",
          "7.2. Material utilizado en su confección.",
          "7.3. Partes de un velamen."
        ],
        "transversal": false
      },
      {
        "numero": 8,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "8.1 Prácticas marineras actuales en el sector marítimo."
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "“Conceptos Básicos De Proa A Popa” Luis Delgado Lallemand ED. Thomson Tomo 1 y Tomo 2",
      "“Manejo y Uso de los Cabos a Bordo de los Buques” José de Jesús Paredes y Castro ED. Esdima AC",
      "“Manual de Nudos Náuticos” Peter Owen Volumen 3 ED Tutor abordo"
    ],
    "fuente": "plan8practicasmarineras_1.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "práctica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Cuestionario oral",
                  "instrumento": "Cuestionario"
                },
                {
                  "criterio": "Examen primer parcial",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Mapa conceptual",
                  "instrumento": "Rúbrica"
                },
                {
                  "criterio": "Reporte de practicas",
                  "instrumento": "Rúbrica"
                },
                {
                  "criterio": "Prácticas de nudos",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Discusión guiada",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participación oral",
                  "instrumento": "Lista de cotejo"
                }
              ]
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 25,
              "desglose": []
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": []
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  },
  "Primeros Auxilios Médicos": {
    "clave": "C0039",
    "nombre": "Primeros Auxilios Médicos",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 0,
      "porSemana": 3,
      "teoricas": 22,
      "practicas": 8,
      "independientes": 0,
      "total": 30
    },
    "objetivoGeneral": "Al término del curso, el participante será capaz de llevar a cabo las tareas, cometidos y responsabilidades, conforme a los requerimientos que se indican en la sección A-VI/4, tabla A-VI/4-1 del Convenio STCW pero no se limitan a: 1. Dispensar primeros auxilios en caso de accidentes o enfermedad a bordo.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Acción inmediata.",
        "objetivoEspecifico": "1. Describir cada uno de los pasos que se deben de seguir durante el entrenamiento de las acciones inmediatas. 2. Demostrar su habilidad para llevar a cabo una acción inmediata dentro del área de trabajo. 1. Reconocer los signos del paciente en estado de inconsciencia. 2. Manejar en forma general al paciente inconsciente.",
        "subtemas": [
          "1.1. Aspectos importantes de entrenamiento necesario para llevar a cabo las acciones inmediatas efectivas.",
          "1.2. Primeros auxilios en el paciente inconsciente."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Botiquín de primeros auxilios.",
        "objetivoEspecifico": "1. Describir las características y elementos que componen el botiquín de primeros auxilios. 2. Describir el contenido de un botiquín de Primeros Auxilios en un bote Salvavidas.",
        "subtemas": [
          "2.1. Descripción del botiquín de Primeros Auxilios.",
          "2.2. Uso correcto del equipo de Primeros Auxilios."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Estructura y funciones del organismo humano.",
        "objetivoEspecifico": "1. Explicar el concepto y las partes que constituyen al cuerpo humano. 2. Describir cada una de las funciones de los órganos y sistemas que constituyen el cuerpo humano. 3. Describir cada una de las funciones de los órganos y sistemas que constituyen el cuerpo humano, de acuerdo al dibujo mostrado por el instructor.",
        "subtemas": [
          "3.1. El cuerpo humano.",
          "3.2. Estructuras del cuerpo humano.",
          "3.3. Funciones de los órganos y sistemas que constituyen el cuerpo humano."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Riesgos toxicológicos a bordo del buque.",
        "objetivoEspecifico": "1. Conocer la importancia de las regulaciones establecidas por el Código IMDG. 2. Identificar los síntomas y aspectos clínicos de envenenamiento. 3. Aplicar los primeros auxilios en caso de envenenamiento por ingestión, inhalación o contacto en la piel/lesiones en los ojos. 4. Aplicar la terapia en caso de soluciones ácidas y cáusticas que han sido ingeridas. 5. Identificar los síntomas y tratamiento para quemaduras ácidas o cáusticas. 6. Utilizar el resucitador de oxígeno: - Partes del resucitador. - Operación del resucitador. - Cambio de cilindros. - CPR con resucitador.",
        "subtemas": [
          "4.1. Importancia de las regulaciones para el transporte de carga peligrosa a bordo de los buques.",
          "4.2. Guía de Primeros Auxilios para uso en accidentes que involucren mercancía peligrosa."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Exploración del paciente.",
        "objetivoEspecifico": "1. Conocer cómo realizar la exploración física en la persona lesionada o accidentada. 2. Elaborar un diagnóstico de una gran variedad de factores individuales basados en: - Información derivada del historial médico. - Apariencia general. - Respuesta de preguntas específicas. - Examen físico.",
        "subtemas": [
          "5.1. Examen clínico del lesionado o enfermo.",
          "5.2. Diagnóstico del lesionado o enfermo"
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Lesiones de la columna vertebral.",
        "objetivoEspecifico": "1. Mencionar los síntomas que presenta un paciente con lesión espinal. 2. Identificar las complicaciones la cual pueden ser causadas por la inconsciencia. 1. Aplicar las medidas apropiadas de primeros auxilios, incluyendo: Control de la sensibilidad en las extremidades. Apropiado transporte de rescate y tratamiento para casos de sospecha de fractura de espina dorsal. 2. Lesiones en la cabeza: Nivel de conciencia/inconsciencia.",
        "subtemas": [
          "6.1. Reconocimiento de las lesiones espinales.",
          "6.2. Medidas a tomar en la aplicación de los Primeros Auxilios y transporte del paciente o lesionado."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Quemaduras, escaldaduras y consecuencias del calor y el frío.",
        "objetivoEspecifico": "1. Identificar los conceptos de las quemaduras y escaldaduras. 2. Conocer la importancia de aplicar los primeros auxilios inmediatamente. 3. Distinguir entre quemadura y escaldadura. 4. Describir la diferencia entre quemaduras de primer grado, segundo grado y tercer grado. 5. Aplicar en forma correcta los primeros auxilios al paciente con quemaduras y/o escaldaduras. 6. Establecer la importancia de las preparaciones estériles.",
        "subtemas": [
          "7.1. Definición de las quemaduras y las escaldaduras.",
          "7.2. La importancia de aplicar los primeros auxilios después de identificar cada una de ellas.",
          "7.3. Uso correcto y aplicación de los primeros auxilios en los casos de quemaduras."
        ],
        "transversal": false
      },
      {
        "numero": 8,
        "tema": "Fractura, dislocaciones y lesiones musculares.",
        "objetivoEspecifico": "1. Mencionar los tipos y las características de las fracturas, luxaciones y lesiones musculares. 2. Explicar la importancia de aplicar inmediatamente los primeros auxilios al paciente, cuando alguna de estas lesiones se presente. 3. Aplicar los primeros auxilios al paciente que presente estos síntomas, en forma correcta basándose en el método adecuado. 4. Establecer las precauciones necesarias mientras se utiliza las tablillas neumáticas. 5. Describir el tratamiento para partes lesionadas y la importancia de la inmovilización de la parte lesionada. 6. Describir los requisitos especiales para el tratamiento de las lesiones de la pelvis y la espina dorsal.",
        "subtemas": [
          "8.1. Características y tipos de fracturas, luxaciones y lesiones musculares.",
          "8.2. La importancia de la aplicación de los primeros auxilios a estas lesiones.",
          "8.3. Aplicación y uso correcto de primeros auxilios de acuerdo al método."
        ],
        "transversal": false
      },
      {
        "numero": 9,
        "tema": "Cuidados médicos de personas rescatadas, incluyendo angustia, hipotermia y exposición al frío.",
        "objetivoEspecifico": "1. Identificar los síntomas de angustia, hipotermia y exposición al frío, al examinar al paciente. 2. Mencionar cada una de las medidas que deben tomarse en cuenta para aplicar los primeros auxilios, en estos casos. 3. Aplicar los primeros auxilios inmediatamente y en forma correcta al paciente que presente estos síntomas.",
        "subtemas": [
          "9.1. Las medidas que se deben considerar para la atención de un paciente que presente síntomas de angustia, hipotermia y exposición al frío.",
          "9.2. Aplicación de las medidas a los pacientes."
        ],
        "transversal": false
      },
      {
        "numero": 10,
        "tema": "Consejo médico por radio.",
        "objetivoEspecifico": "1. Describir el desarrollo del método usado para solicitar un consejo médico por radio.",
        "subtemas": [
          "10.1. Disponibilidad para mandar un aviso médico por radio.",
          "10.2. Métodos de uso y cómo obtener un aviso por radio."
        ],
        "transversal": false
      }
    ],
    "bibliografia": [
      "Curso Modelo OMI 1.13 Primeros Auxilios Básicos",
      "Curso Modelo OMI 1.14 Primeros Auxilios Sanitarios",
      "Libro del estudiante de SVB/BLS para profesionales de la salud"
    ],
    "fuente": "lmn_primeros8auxilios8m8dicos_vi_bpn PRIMEROS AUXILISO GRUPO VI B PN.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "teórica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Examen primer parcial",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Debate",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Práctica",
                  "instrumento": "Lista de verificación"
                },
                {
                  "criterio": "Cuestionamiento",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Mapa conceptual",
                  "instrumento": "Rúbrica"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participación",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Participación",
                  "instrumento": "Lista de cotejo"
                }
              ]
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": []
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": []
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  },
  "Situaciones de emergencia": {
    "clave": "INS643",
    "nombre": "Situaciones de emergencia",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 20,
      "porSemana": 4,
      "teoricas": 54,
      "practicas": 18,
      "independientes": 8,
      "total": 80
    },
    "objetivoGeneral": "Comprender los procedimientos necesarios para responder en casos diversos de emergencia, aplicando las normas estipuladas por la OMI, para garantizar el rescate de personas salvaguardando la integridad de la vida humana, proteger el medio ambiente, la seguridad de la embarcación y la carga.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Precauciones para la protección y seguridad de los pasajeros en situaciones de emergencia",
        "objetivoEspecifico": "Conoce las acciones de respuesta en casos de emergencia, mediante los planes de contingencia, para garantizar la protección y seguridad de los pasajeros.",
        "subtemas": [
          "1.1. Plan de contingencia para respuesta a emergencias.",
          "1.2. Precauciones para la protección y seguridad de los pasajeros en situaciones de emergencia."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Primeras medidas a seguir después de emergencias; evaluación y control de averías",
        "objetivoEspecifico": "Conoce el comportamiento adecuado de respuesta en casos de emergencia, mediante planes de simulacros y contingencia, para evaluar y controlar las averías, así como salvaguardar la integridad de los pasajeros.",
        "subtemas": [
          "2.1. Varada.",
          "2.2. Encallamiento.",
          "2.3. Colisión.",
          "2.4. Incendio y/o explosión.",
          "2.5. Abandono del buque.",
          "2.6. Hombre al agua",
          "2.7. Derrame de hidrocarburos",
          "2.8. Atentados terroristas.",
          "2.9. Casos de piratería.",
          "2.10. Buque sin gobierno.",
          "2.11. Remolcar o ser remolcado."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Rescate de personas en el mar, asistiendo a embarcaciones siniestradas y emergencias en puerto.",
        "objetivoEspecifico": "Conoce los procedimientos de rescate de personas y asistencia a buques siniestrados en la mar o en puerto, a través de los lineamientos previamente establecidos, para garantizar la seguridad de la vida humana, así como para evitar daños a la carga y al medio ambiente.",
        "subtemas": [
          "3.1. Rescate de personas de una embarcación siniestrada o encallada.",
          "3.2. Acciones a seguir en casos de emergencias en puerto.",
          "3.3. Medidas para asistir a una embarcación siniestrada."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "4.1 Introducción a los temas de actualidad marítimo-portuaria"
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Libran, Álvaro & Mari, Ricardo. (2003). Seguridad pública en buques de pasaje. Ediciones UPC.",
      "Colwell, Keith. (2009). Manual de supervivencia en el mar: Guía completa de supervivencia en el mar de la RYA. Tutor."
    ],
    "fuente": "plan_situaciones8de8emergencia_vi_b_pn_enmt SIT EMERGENCIA GRUPO VI B PN.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "teórica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Examen 1er parcial",
                  "instrumento": "Examen escrito"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Plan de Contingencia para Protección de Pasajeros",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Lista de Verificación para Emergencias Iniciales",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Simulacro de Emergencia Temprana",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Podcast \"voz de emergencia\"",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": []
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Segunda evaluación parcial",
                  "instrumento": "Examen escrito"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Análisis de Caso Complejo con Emergencias Múltiples",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Propuesta de Innovación en Seguridad Marítima",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Video tutorial \"protocolo paso a paso\"",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Plan de Rescate SAR y Asistencia a Terceros",
                  "instrumento": "Lista de cotejo"
                }
              ]
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  },
  "Teoría del Buque I": {
    "clave": "TEB641",
    "nombre": "Teoría del Buque I",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 4,
      "teoricas": 36,
      "practicas": 36,
      "independientes": 12,
      "total": 72
    },
    "objetivoGeneral": "Calcular la estabilidad, utilizando el procedimiento adecuado, para garantizar la seguridad del buque.",
    "unidades": [
      {
        "numero": 1,
        "tema": "El buque y sus dimensiones",
        "objetivoEspecifico": "Conocer las dimensiones del buque aplicables en la estabilidad, mediante el análisis del plano, para su aplicación en el cálculo de atributos de la carena y estabilidad del buque.",
        "subtemas": [
          "1.1 Definición de Teoría del Buque.",
          "1.2 Principio de Arquímedes.",
          "1.3 Perpendiculares.",
          "1.4 Eslora entre perpendiculares y de trazado.",
          "1.5 Manga de trazado.",
          "1.6 Puntal de trazado.",
          "1.7 Tipos de desplazamiento y Peso Muerto."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Planos y coeficientes de formas del buque",
        "objetivoEspecifico": "Interpretar las formas de la carena, mediante el análisis del plano de formas, para ubicar puntos en el buque y calcular los atributos y coeficientes de formas de la carena.",
        "subtemas": [
          "2.1 Líneas y planos de referencia.",
          "2.2 Líneas y planos de agua.",
          "2.3 Cuaderna de trazado y secciones transversales.",
          "2.4 Verticales.",
          "2.5 Diagonales.",
          "2.6 Interpretación del plano de formas.",
          "2.7 Coeficientes de formas del buque."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Áreas y volúmenes",
        "objetivoEspecifico": "Calcular áreas y volúmenes, utilizando métodos aproximados de integración, para determinar los atributos de la carena y la estabilidad del buque.",
        "subtemas": [
          "3.1 Regla de trapecios.",
          "3.2 Regla de Simpson.",
          "3.3 Cálculo de atributos de la carena.",
          "3.4 Curvas y tablas hidrostáticas.",
          "3.5 Uso de las curvas y tablas hidrostáticas."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Estabilidad estática transversal inicial",
        "objetivoEspecifico": "Calcular la estabilidad estática transversal, analizando la distribución vertical de pesos en el buque, para garantizar una buena estabilidad y navegación segura.",
        "subtemas": [
          "4.1 Definición.",
          "4.2 Centro de gravedad y centro de carena.",
          "4.3 Metacentro transversal.",
          "4.4 Condiciones básicas de equilibrio del buque.",
          "4.5 Brazo y momento adrizante.",
          "4.6 Estado de equilibrio del buque.",
          "4.7 Cálculo de KG.",
          "4.8 Cálculo de GM.",
          "4.9 Efectos de superficie libre de la estabilidad.",
          "4.10 Cálculo del GM corregido por efecto de superficie libre.",
          "4.11 Cálculo de la estabilidad transversal inicial."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Estabilidad estática transversal a grandes ángulos de escora",
        "objetivoEspecifico": "Calcular la estabilidad estática transversal a grandes ángulos de escora, mediante el uso de las curvas cruzadas o curvas KN, para garantizar una buena estabilidad y navegación segura.",
        "subtemas": [
          "5.1 Curvas cruzadas de estabilidad y curvas KN.",
          "5.2 Curvas de estabilidad estática.",
          "5.3 Efecto de superficie libre.",
          "5.4 Cálculo de la estabilidad estática transversal a grandes ángulos de escora."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Estabilidad dinámica",
        "objetivoEspecifico": "Calcular la estabilidad dinámica del buque, utilizando la curva de estabilidad estática, para garantizar una buena estabilidad y navegación segura.",
        "subtemas": [
          "6.1 Análisis de la estabilidad dinámica.",
          "6.2 Cálculo de la estabilidad dinámica."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Asiento",
        "objetivoEspecifico": "Calcular el asiento del buque, mediante el análisis de la distribución longitudinal de pesos, para determinar los calados finales del buque.",
        "subtemas": [
          "7.1 Definición.",
          "7.2 Centro de flotación.",
          "7.3 Cálculo de XG.",
          "7.4 Cálculo del asiento.",
          "7.5 Cálculo de calados."
        ],
        "transversal": false
      },
      {
        "numero": 8,
        "tema": "Cálculo de estabilidad en la práctica",
        "objetivoEspecifico": "Realizar el cálculo de estabilidad del buque, analizando la distribución de pesos, para garantizar una navegación segura.",
        "subtemas": [
          "8.1 Cálculo de estabilidad en la práctica"
        ],
        "transversal": false
      },
      {
        "numero": 9,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "9. Contenidos de actualidad en el sector marítimo portuario"
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Teoría del buque. Juan Olivela Puig. Editorial UPC 1996"
    ],
    "fuente": "plan_23 TEORIA DEL BUQUE VI A PN.pdf",
    "evaluacion": {
      "esquema": "oficial",
      "oficio": "DEN-526-2025 / DEN-065-2026",
      "tipoMateria": "teórica",
      "calificacionMinima": 6,
      "parciales": [
        {
          "nombre": "1er Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Examen diagnostico",
                  "instrumento": "Examen diagnostico (evaluación diagnostica)"
                },
                {
                  "criterio": "Examen Parcial",
                  "instrumento": "Examen (Evaluación sumativa)"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Resolver problemas de coeficientes del buque",
                  "instrumento": "Lista de cotejo (Evaluación formativa)"
                },
                {
                  "criterio": "Elaboración de maqueta de planos y coeficientes de formas del buque",
                  "instrumento": "Lista de cotejo (Evaluación formativa)"
                },
                {
                  "criterio": "Resolver problemas de áreas y volumenes",
                  "instrumento": "Lista de cotejo (Evaluación formativa)"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participación del cadete",
                  "instrumento": "Lista de Cotejo (formativa)"
                },
                {
                  "criterio": "Participación del cadete",
                  "instrumento": "Lista de Cotejo (Formativa)"
                }
              ]
            }
          ]
        },
        {
          "nombre": "2do Parcial",
          "categorias": [
            {
              "categoria": "Conocimiento",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Examen",
                  "instrumento": "Examen (Evaluación sumativa)"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Elaborar problemas de la unidad",
                  "instrumento": "Lista de cotejo (Evaluación formativa)"
                },
                {
                  "criterio": "Resolver problemas de C.G y asiento",
                  "instrumento": "Lista de cotejo (Evaluación formativa)"
                },
                {
                  "criterio": "Cálculo de estabilidad completo",
                  "instrumento": "Lista de Cotejo (Formativa)"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participación del cadete",
                  "instrumento": "Lista de Cotejo (Formativa)"
                },
                {
                  "criterio": "Participación del cadete",
                  "instrumento": "Lista de cotejo (Evaluación formativa)"
                },
                {
                  "criterio": "Participación del cadete",
                  "instrumento": "Lista de Cotejo (Formativa)"
                }
              ]
            }
          ]
        }
      ],
      "acreditacion": "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario."
    }
  }
};
