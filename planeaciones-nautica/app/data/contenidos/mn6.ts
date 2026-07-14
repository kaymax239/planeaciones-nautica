// Programas oficiales semestre 6 Maquinista/Mecánico Naval (MN).
// Generado por scripts/integrar-contenidos-pares.mjs desde _generados-pares/ (biblioteca espejo
// F-32 Ene–Jun 2026). Evaluación normalizada a DEN-526-2025 / DEN-065-2026. NO editar a mano:
// re-generar desde los JSON fuente.
import type { ProgramaOficial } from "../tipos";

export const contenidosMN6: Record<string, ProgramaOficial> = {
  "Electrónica": {
    "clave": "ELA641",
    "nombre": "Electrónica",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 20,
      "porSemana": 4,
      "teoricas": 52,
      "practicas": 20,
      "independientes": 8,
      "total": 80
    },
    "objetivoGeneral": "Comprender el funcionamiento de los semiconductores en diodos y transistores, analizando su aplicación en rectificadores, reguladores de voltaje, amplificadores, osciladores y circuitos integrados, para identificar averías y fallas.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Medición y error",
        "objetivoEspecifico": "Comprender los conceptos de exactitud y precisión para obtener mediciones correctas y minimizar errores. Identificar los sistemas de unidades y aplica las equivalencias para realizar conversiones adecuadas de acuerdo al caso.",
        "subtemas": [
          "1.1. Definiciones.",
          "1.2. Exactitud y precisión.",
          "1.3. Cifras significativas.",
          "1.4. Probabilidad de errores.",
          "1.5. Sistemas de unidades.",
          "1.6. Unidades eléctricas y magnéticas.",
          "1.7. Conversión de unidades."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Instrumentos indicadores electromecánicos",
        "objetivoEspecifico": "Utilizar los instrumentos de medición para obtener lectura correcta y determinar si están dentro de los parámetros correspondientes.",
        "subtemas": [
          "2.1. Galvanómetro de suspensión.",
          "2.2. Termoinstrumentos.",
          "2.3. Electrodinamómetro en mediciones de potencia.",
          "2.4. Medidores de factor de potencia.",
          "2.5. Instrumentos transformadores."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Instrumentos electrónicos para medición de parámetros",
        "objetivoEspecifico": "Emplear los multímetro y voltímetro explicando su diferencia, funcionamiento y aplicación para tener parámetros correctos.",
        "subtemas": [
          "3.1. Medidor con amplificador.",
          "3.2. Voltímetro con rectificadores.",
          "3.3. Multímetro electrónico.",
          "3.4. Medidor de vector impedancia.",
          "3.5. Mediciones de voltaje y potencia.",
          "3.6. Realizar, declinar y aceptar ofrecimientos."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Componentes electrónicos",
        "objetivoEspecifico": "Conocer los componentes básicos electrónicos y su función mediante diagramas y prácticas, para determinar su estado.",
        "subtemas": [
          "4.1. Las resistencias (de hilo y químicas).",
          "4.2. Condensadores.",
          "4.3. Transistores."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Diodos",
        "objetivoEspecifico": "Conocer la constitución de los diodos, su función y armar circuitos rectificadores con regulación de voltaje, a fin de mantener los circuitos operacionales.",
        "subtemas": [
          "5.1. Diodo Zener.",
          "5.2. LED´s",
          "5.3. Diodos fotoeléctricos.",
          "5.4. Diodo Schottky."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Circuitos integrados",
        "objetivoEspecifico": "Identificar correctamente los circuitos integrados, verificar sus condiciones de funcionamiento, para determinar su estado de operatividad y realizar los cambios necesarios.",
        "subtemas": [
          "6.1. Composición de un circuito integrado.",
          "6.2. Clasificación de los CI según su función.",
          "6.3. Clasificación de los CI según la cantidad de compuertas.",
          "6.4. Identificación de los CI."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "Contenidos de actualidad del sector marítimo portuario."
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "García T, J (2002) Electrotecnia, Madrid España; PARANINFO",
      "Martínez F. (2009). Apuntes de electricidad aplicada a los buques. México Club Universitario",
      "Mileaf, H. (2014). Electricidad Serie 1-7. México: Limusa",
      "Martínez F. & Martin, J. (s.f) Apuntes de Electricidad Aplicada a los Buques, fm; Editorial Club Universitario (Libro Virtual)"
    ],
    "fuente": "plan_195 ELECTRONICA GRUPO VI A MN.pdf",
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
                  "criterio": "Conocimiento - 1era Evaluación parcial",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Diseño de un sistema de medición electrónica",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Diseño de un control industrial de nivel y temperatura",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Programación y configuración de un controlador industrial para control de temperatura",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participaciones y uso de TICS - Exposición de proyectos final de semestre",
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
              "desglose": [
                {
                  "criterio": "Conocimiento - 2da Evaluación parcial",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participaciones y uso de TICS - Exposición de proyectos final de semestre",
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
  "Generadores y máquinas de vapor": {
    "clave": "GMV639",
    "nombre": "Generadores y máquinas de vapor",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 0,
      "porSemana": 4,
      "teoricas": 36,
      "practicas": 36,
      "independientes": 10,
      "total": 82
    },
    "objetivoGeneral": "Comprender los procedimientos de servicio de una planta generadora de vapor, identificando sus elementos y ciclos de trabajo, para la óptima operación.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Generadores de vapor",
        "objetivoEspecifico": "Conocer los componentes de un generador de vapor y define el proceso de la transferencia de calor, mediante imágenes y diagramas, para comprender su funcionamiento.",
        "subtemas": [
          "1.1 Definición.",
          "1.2 Componentes de los diferentes tipos y sus accesorios.",
          "1.3 Proceso transferencia de calor.",
          "1.4 Características básicas de su construcción."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Sistema de combustible",
        "objetivoEspecifico": "Identificar los componentes del sistema de manejo de combustible, mediante diagramas y elementos físicos, para conocer su funcionamiento.",
        "subtemas": [
          "2.1 Bombas.",
          "2.2 Calentadores.",
          "2.3 Quemadores.",
          "2.4 Compuertas de aire.",
          "2.5 Ventiladores tiro forzado e inducido.",
          "2.6 Control de la combustión."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Operación",
        "objetivoEspecifico": "Comprender los procedimientos de operación al encender o apagar un generador de vapor, analizándolos en diferentes situaciones, para operarlos de forma segura.",
        "subtemas": [
          "3.1 Puesta en servicio.",
          "3.2 Sacar de servicio normal y en caso de emergencia.",
          "3.3 Deshollinado estando en servicio.",
          "3.4 Precauciones de puesta en servicio después de una reparación.",
          "3.5 Sistema de tratamiento del agua."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Mantenimiento",
        "objetivoEspecifico": "Conocer los procedimientos de mantenimiento y prueba de los diferentes sistemas de un generador de vapor, analizando diagramas y componentes, para utilizarlos en el trabajo.",
        "subtemas": [
          "4.1 Limpieza.",
          "4.2 Prueba hermeticidad hogar.",
          "4.3 Prueba hidrostática.",
          "4.4 Calibración de válvulas de seguridad."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Máquinas de vapor",
        "objetivoEspecifico": "Conoce los componentes de una máquina alternativa accionada por vapor, identificando cada uno de sus componentes, para entender su funcionamiento.",
        "subtemas": [
          "5.1 Máquina alternativa de triple expansión del vapor.",
          "5.2 Configuración.",
          "5.3 Sistema de cambio de marcha."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Turbinas de vapor",
        "objetivoEspecifico": "Comprende los principios de operación de las turbinas de vapor, clasificándolas de acuerdo a su funcionamiento, para su posterior aplicación.",
        "subtemas": [
          "6.1 Turbinas de acción.",
          "6.2 Turbinas de reacción.",
          "6.3 Operación y mantenimiento de turbinas de vapor."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "Contenidos de actualidad del sector marítimo-portuario."
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "American Society of Mechanical Engineers. (2021). Boiler and Pressure Vessel Code. ASME.",
      "Babcock & Wilcox Enterprises. (2021). Steam: Its generation and use (42nd ed.). Babcock & Wilcox.",
      "El-Wakil, M. M. (2017). Power plant technology. McGraw-Hill Education.",
      "International Maritime Organization. (2020). Marine boilers and steam systems. IMO Publishing.",
      "International Maritime Organization. (2022). SOLAS consolidated edition. IMO Publishing.",
      "McGeorge, D. (2020). Marine auxiliary machinery (8th ed.). Butterworth-Heinemann.",
      "Nag, P. K. (2018). Power plant engineering (4th ed.). McGraw-Hill Education.",
      "Saravanamuttoo, H. I. H., Rogers, G. F. C., & Cohen, H. (2017). Gas turbine theory (7th ed.). Pearson Education.",
      "Taylor, D. A. (2019). Introduction to marine engineering (3rd ed.). Butterworth-Heinemann.",
      "Manuales técnicos del fabricante de los generadores de vapor, calderas y turbinas instalados a bordo (ediciones vigentes)."
    ],
    "fuente": "plan_generadores8y8m8quinas8de8vapor_vimn_enmt GENERADORES  Y MAQUINARIA GRUPO VI A MN.pdf",
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
                  "criterio": "Conocimiento - 1era Evaluación parcial (Unidad III)",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica supervisada (Unidad II)",
                  "instrumento": "Rúbrica"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica supervisada (Unidad III)",
                  "instrumento": "Rúbrica"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participaciones y uso de TICS - Investigación y exposición (Unidad I)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Participaciones y uso de TICS - Investigación y exposición (Unidad II)",
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
              "desglose": [
                {
                  "criterio": "Conocimiento - 2da Evaluación parcial (Unidad VII)",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica supervisada (Unidad IV)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica supervisada (Unidad VI)",
                  "instrumento": "Rúbrica"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participaciones y uso de TICS - Investigación y exposición (Unidad IV)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Participaciones y uso de TICS - Investigación y exposición (Unidad V)",
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
  "Motores II": {
    "clave": "MOT637",
    "nombre": "Motores II",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 0,
      "porSemana": 4,
      "teoricas": 36,
      "practicas": 36,
      "independientes": 12,
      "total": 84
    },
    "objetivoGeneral": "Calcular la potencia, la cilindrada, el ángulo de calaje, etc., de un motor, usando las fórmulas correspondientes, para clasificarlos de acuerdo a su eficiencia.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Cálculo en los motores de 2 y 4 tiempos",
        "objetivoEspecifico": "Conocer la eficiencia de un motor calculando su volumen muerto, su relación de compresión y su cilindrada para clasificarlos adecuadamente.",
        "subtemas": [
          "1.1 Ángulo de calaje.",
          "1.2 Espacio muerto.",
          "1.3 Relación de compresión.",
          "1.4 Cilindrada."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Potencia indicada y potencia de freno",
        "objetivoEspecifico": "Conocer la potencia y consumos de un motor de combustión interna, realizando el cálculo de ellos, para el control y prolongación de su utilidad.",
        "subtemas": [
          "2.1 Fórmulas de potencia.",
          "2.2 Equivalencias (HP, CV y KW).",
          "2.3 Cálculo.",
          "2.4 Aplicación.",
          "2.5 Cálculo de consumo de combustible y aceite."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Diagramas",
        "objetivoEspecifico": "Elaborar diagramas de un motor de combustión interna interpretando las funciones de operación para verificar su funcionamiento.",
        "subtemas": [
          "3.1 Tipos.",
          "3.2 Interpretación."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Rendimiento mecánico",
        "objetivoEspecifico": "Conocer el rendimiento mecánico de un motor de combustión interna, calculándolo con las fórmulas adecuadas, para mejorar la utilidad de la máquina.",
        "subtemas": [
          "4.1 Fórmula y cálculo del rendimiento.",
          "4.2 Aplicación"
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Relación estequiometría",
        "objetivoEspecifico": "Conocer la estequiometría de un motor, realizando los cálculos de ella, para mejorar la utilidad del motor.",
        "subtemas": [
          "5.1 Concepto.",
          "5.2 Diagrama.",
          "5.3 Cálculo.",
          "5.4 Aplicación."
        ],
        "transversal": true
      },
      {
        "numero": 6,
        "tema": "Operación de un motor de combustión interna",
        "objetivoEspecifico": "Habilitar en forma segura la máquina principal y motores auxiliares de combustión interna, usando de manera adecuada el regulador de velocidad, para evitar desperfectos y accidentes.",
        "subtemas": [
          "6.1 Reguladores de velocidad.",
          "6.2 Habilitar el motor principal (máquina principal).",
          "6.3 Habilitar un motor auxiliar (motogenerador)."
        ],
        "transversal": false
      }
    ],
    "bibliografia": [
      "Heywood, J. Internal Combustion Engine Fundamentals. McGraw-Hill.",
      "MAN B&W Diesel. Basic Principles of Marine Engines.",
      "Wärtsilä. Marine Engine Manual.",
      "Caterpillar Marine. Operation & Maintenance Manuals.",
      "OMI (IMO). MARPOL Anexo VI.",
      "ISO 3046: Reciprocating internal combustion engines."
    ],
    "fuente": "plan_motores_viamn_enmt MOTORES II GRUPO VI A MN.pdf",
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
                  "criterio": "Cuestionario oral en el salón de clases",
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
                  "criterio": "Cálculos individuales en el programa y visitas al taller",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Cálculos individuales",
                  "instrumento": "Lista de cotejo de participación"
                },
                {
                  "criterio": "Participación Trabajo en clase",
                  "instrumento": "Lista de cotejo de participación"
                },
                {
                  "criterio": "Interpretación de diagrama de un motor",
                  "instrumento": "Lista de cotejo de participación"
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
    "fuente": "pensamiento8critico8via8mn_3 PENSAMIENTO CRITICO VI A MN.pdf",
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
                  "criterio": "Examen (UNIDAD I Y II)",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Actividad 1, 2 (UNIDAD 1. Pensamiento Crítico)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Actividad 1,2,3 (UNIDAD 2. Pensar y Tomar Decisiones)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Mapa conceptual (UNIDAD I)",
                  "instrumento": null
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participación del estudiante (UNIDAD II)",
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
                  "criterio": "Estudio de caso (UNIDAD 3. Componentes del Pensamiento Crítico)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Resumen (UNIDAD 4. Pensamiento Lateral)",
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
    "objetivoGeneral": "Aplicar la destreza para elaborar costuras y nudos con cabos para utilizarlos como accesorios en las escalas del buque y en embarcaciones a vela, identificando los cabos de amarre según la situación del buque.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Pastecas y cuadernales.",
        "objetivoEspecifico": "Manejar pesos utilizando pastecas y cuadernales para multiplicar la fuerza.",
        "subtemas": [
          "1.1 Nomenclatura.",
          "1.2 Uso y aplicación."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Cabos de amarre.",
        "objetivoEspecifico": "Identificar los cabos por su nombre, considerando la posición y la dirección en la que trabajan con respecto al buque para un uso efectivo de ellos.",
        "subtemas": [
          "2.1 Identificación por su situación."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Costuras con cabos.",
        "objetivoEspecifico": "Unir cabos mediante las costuras necesarias para maniobrar en los buques.",
        "subtemas": [
          "3.1 Costuras redondas.",
          "3.2 Empulgueras",
          "3.3 Unión de cabos"
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Nudos especiales y de ornato.",
        "objetivoEspecifico": "Elaborar los diferentes nudos, aplicando la técnica adecuada para utilizarlos de forma eficiente en el buque.",
        "subtemas": [
          "4.1 Cabeza de turco.",
          "4.2 Barrilete.",
          "4.3 Botón de dos puntas.",
          "4.4 Nudo de campana."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Escala de pilotos",
        "objetivoEspecifico": "Identificar una escala de piloto enumerando sus partes y describiendo el mantenimiento que requiere y la forma de instalarla para el embarque o desembarque del piloto.",
        "subtemas": [
          "5.1 Características.",
          "5.2 Mantenimiento",
          "5.3 Instalación abordo",
          "5.4 Requisitos especiales en el canal de Panamá."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Escalas reales.",
        "objetivoEspecifico": "Describir la forma en que se arma una escala real y su instalación, mediante la mención de sus componentes, para utilizarla con seguridad.",
        "subtemas": [
          "6.1 Parte que la componente.",
          "6.2 Guarnido de la misma.",
          "6.3 Medidas de seguridad."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Embarcaciones de vela.",
        "objetivoEspecifico": "Describir los diferentes tipos de embarcaciones a vela mencionando las partes de ellas para un manejo apropiado y seguro de las naves.",
        "subtemas": [
          "7.1 Tipos de velas.",
          "7.2 Materiales utilizando en su confección, partes de un velamen."
        ],
        "transversal": false
      }
    ],
    "bibliografia": [
      "Libros antología Prácticas Marineras VI"
    ],
    "fuente": "practicas8marineras8vi8a8mn8oki PRACTICAS MARINERA VI A MN.pdf",
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
                  "criterio": "1ra Evaluación parcial (Unidad IV)",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Práctica (Unidad I)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Práctica (Unidad IV)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Ejercicio (Unidad II)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Síntesis (Unidad III)",
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
              "desglose": [
                {
                  "criterio": "Cuestionario (Unidad V)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "2da Evaluación parcial (Unidad VII)",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Práctica (Unidad V)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Práctica (Unidad VII)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Trabajo en clase (Unidad VI)",
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
        "objetivoEspecifico": "1. Describir las características y elementos que componen el botiquín de primeros auxilios. 2. Describir el contenido de un botiquín de Primeros Auxilios en un bote salvavidas.",
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
        "objetivoEspecifico": "1. Conocer la importancia de las regulaciones establecidas por el Código IMDG. 2. Identificar los síntomas y aspectos clínicos de envenenamiento. 3. Aplicar los primeros auxilios en caso de envenenamiento por ingestión, inhalación o contacto en la piel/lesiones en los ojos. 4. Aplicar la terapia en caso de soluciones ácidas y cáusticas que han sido ingeridas. 5. Identificar los síntomas y tratamiento para quemaduras ácidas o cáusticas. 6. Utilizar el resucitador de oxígeno: Partes del resucitador. Operación del resucitador. Cambio de cilindros. CPR con resucitador.",
        "subtemas": [
          "4.1. Importancia de las regulaciones para el transporte de carga peligrosa a bordo de los buques.",
          "4.2. Guía de Primeros Auxilios para uso en accidentes que involucren mercancía peligrosa."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Exploración del paciente.",
        "objetivoEspecifico": "1. Conocer cómo realizar la exploración física en la persona lesionada o accidentada. 2. Elaborar un diagnóstico de una gran variedad de factores individuales basados en: Información derivada del historial médico. Apariencia general. Respuesta de preguntas específicas. Examen físico.",
        "subtemas": [
          "5.1. Examen clínico del lesionado o enfermo.",
          "5.2. Diagnóstico del lesionado o enfermo."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Lesiones de la columna vertebral.",
        "objetivoEspecifico": "1. Mencionar los síntomas que presenta un paciente con lesión espinal. 2. Identificar las complicaciones la cual pueden ser causadas por la inconsciencia. 1. Aplicar las medidas apropiadas de primeros auxilios, incluyendo: Control de la sensibilidad en las extremidades. Apropiado transporte de rescate y tratamiento para casos de sospecha de fractura de espina dorsal. 2. Lesiones en la cabeza: Nivel de conciencia/inconciencia.",
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
    "fuente": "plan_92 PRIMEROS AUXILIOS MEDICOS VI A MN.pdf",
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
  "Refrigeración I": {
    "clave": "REF640",
    "nombre": "Refrigeración I",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 21,
      "porSemana": 4,
      "teoricas": 36,
      "practicas": 36,
      "independientes": 12,
      "total": 84
    },
    "objetivoGeneral": "Comprender la importancia de la refrigeración en un buque, describiendo y analizando los elementos que conforman el sistema, para su mantenimiento y autonomía de la nave.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Generalidades",
        "objetivoEspecifico": "Entiende los conceptos básicos de la refrigeración, recurriendo a los datos históricos y termodinámicos para comprender las generalidades del enfriamiento.",
        "subtemas": [
          "1.1 Datos históricos.",
          "1.2 Conceptos termodinámicos básicos, aplicados a la refrigeración."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Ciclo básico de refrigeración",
        "objetivoEspecifico": "Analiza la importancia y función de los componentes del enfriamiento interpretando los diagramas de presión-temperatura para comprender el ciclo de refrigeración.",
        "subtemas": [
          "2.1 Ciclo de refrigeración.",
          "2.2 Componentes, compresor, condensador, evaporador y dispositivos de control.",
          "2.3 Instrumentos para el control de flujo de refrigerante.",
          "2.4 Interpreta los diagramas de presión-temperatura."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Características de los gases",
        "objetivoEspecifico": "Enlista los refrigerantes más comunes, describiendo las propiedades de ellos, para una elección conveniente.",
        "subtemas": [
          "3.1 Definición de los refrigerantes.",
          "3.2 Lista de los refrigerantes más comunes.",
          "3.3 Propiedades de los refrigerantes."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Aceites utilizados en sistemas de frigoríficos.",
        "objetivoEspecifico": "Clasifica los aceites usados en un sistema de refrigeración, analizando sus características, para una elección conveniente.",
        "subtemas": [
          "4.1 Características de un aceite utilizado en el sistema de refrigeración.",
          "4.2 Clasificación de aceites usados en el sistema de refrigeración."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "La presente unidad se incluye con el propósito de que el/la profesor/a incorpore contenidos o temas de actualidad del sector marítimo portuario, a fin de vincularlos con el contenido de esta asignatura.",
        "subtemas": [
          "5.1 Innovaciones en los sistemas de refrigeración del sector marítimo."
        ],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Manual de Refrigeración, Juan Manuel Franco Lijó. Editorial Reverté, SA. 2012.",
      "Manual Curso Frío Industrial."
    ],
    "fuente": "plan_171 REFRIGERACION VI A MN.pdf",
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
                  "instrumento": "Cuestionario"
                },
                {
                  "criterio": "Cuestionario",
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
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Resumen",
                  "instrumento": "Rúbrica"
                },
                {
                  "criterio": "Cuestionamiento directo",
                  "instrumento": "Lista de verificación"
                },
                {
                  "criterio": "Debate",
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
                  "criterio": "Examen segundo parcial",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Reporte de prácticas",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Cuadro sinóptico",
                  "instrumento": "Rúbrica"
                },
                {
                  "criterio": "Discusión guiada",
                  "instrumento": "Lista de verificación"
                },
                {
                  "criterio": "Debate",
                  "instrumento": "Lista de verificación"
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
  "Taller V": {
    "clave": "TAL642",
    "nombre": "Taller V",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 20,
      "porSemana": 4,
      "teoricas": 24,
      "practicas": 48,
      "independientes": 8,
      "total": 80
    },
    "objetivoGeneral": "Conocer el torno y sus componentes, describiendo su función y precaución al usarlos, así como el afilado de las herramientas de corte, para realizar trabajos de calidad en el buque.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Clasificación de torno y seguridad en su manejo",
        "objetivoEspecifico": "Clasifica los diferentes tipos de torno tomando en cuenta sus características, para realizar el trabajo adecuado con ellos.",
        "subtemas": [
          "1.1 Tipos y clasificación.",
          "1.2 Trabajos a realizar con ellos"
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Partes principales de un torno",
        "objetivoEspecifico": "Conoce las partes de un torno y su uso, describiendo su función para darles el uso adecuado en la realización de un trabajo.",
        "subtemas": [
          "2.1 Fijas",
          "2.2 Móviles"
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Herramientas auxiliares.",
        "objetivoEspecifico": "Conoce las herramientas de corte y fijación mencionando sus características, para la manufactura de piezas útiles en el buque.",
        "subtemas": [
          "3.1 De corte.",
          "3.2 De fijación"
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Elementos de corte para torno",
        "objetivoEspecifico": "Clasifica y afila buriles considerando el tipo de trabajo a realizar para su aplicación en cortes precisos.",
        "subtemas": [
          "4.1 Tipos de buriles.",
          "4.2 Afilado de varios ángulos."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Cálculo de conicidad y trabajos de desbaste",
        "objetivoEspecifico": "Opera el torno en los distintos trabajos de desbaste, utilizando los procedimientos y diferentes cálculos de conicidad, para obtener acabados con calidad.",
        "subtemas": [
          "5.1 Tipos de desbaste.",
          "5.2 Fórmula para calcular el desbaste."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Tipos de torneado.",
        "objetivoEspecifico": "Realiza trabajos de torno tomando en cuenta las indicaciones para refrentado, el mandrilado y el moleteado.",
        "subtemas": [
          "6.1 Refrentado",
          "6.2 Mandrilado",
          "6.3 Moleteado"
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Teoría del roscado.",
        "objetivoEspecifico": "Opera el torno calculando y utilizando las tablas de velocidad según el tipo de roscado, para obtener un trabajo aceptable.",
        "subtemas": [
          "7.1 Diferentes tipos de roscado en el torno",
          "7.2 Uso de tablas",
          "7.3 Cálculos y tablas de velocidad"
        ],
        "transversal": false
      },
      {
        "numero": 8,
        "tema": "Roscados con machuelos y con tarraja.",
        "objetivoEspecifico": "Elabora roscas, usando machuelos y tarraja según el material para un trabajo de calidad.",
        "subtemas": [
          "8. Roscados con machuelos y con tarraja"
        ],
        "transversal": false
      },
      {
        "numero": 9,
        "tema": "Realización de trabajos aplicando los conocimientos adquiridos.",
        "objetivoEspecifico": "Maquina piezas usando los conocimientos adquiridos y las medidas de seguridad necesarias para obtener un acabado de calidad.",
        "subtemas": [
          "9. Realización de trabajos aplicando los conocimientos adquiridos"
        ],
        "transversal": false
      }
    ],
    "bibliografia": [
      "Henry Ford. (1971). Teoría del taller. Michigan: Gustavo Gilis.",
      "Izquierdo, J. J., y Martínez, J. A. (2011). Libro de taller de torno y fresadora. España: Ceysa. Cano Pina, S.L. Ediciones.",
      "López, A. (2008). Máquinas. Cálculos de taller. España: Autor-editor.",
      "South bend. (2018). Manual del tornero. Estados Unidos América: Twins."
    ],
    "fuente": "plan_248 TALLER GRUPO VI A MN.pdf",
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
                  "criterio": "Conocimiento - 1era Evaluación parcial (Unidad V)",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica de taller (Unidad I)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica de taller (Unidad II)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica de taller (Unidad III)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica de taller (Unidad IV)",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participaciones y uso de TICs - Investigación (Unidad II)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Participaciones y uso de TICs - Cuadro comparativo (Unidad V)",
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
              "desglose": [
                {
                  "criterio": "Conocimiento - 2da Evaluación parcial (Unidad IX)",
                  "instrumento": "Examen"
                }
              ]
            },
            {
              "categoria": "Prácticas y actividades de aprendizaje",
              "porcentaje": 50,
              "desglose": [
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica de taller (Unidad VI)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica de taller (Unidad VIII)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Prácticas y actividades de aprendizaje - Práctica de taller (Unidad IX)",
                  "instrumento": "Lista de cotejo"
                }
              ]
            },
            {
              "categoria": "Participación y TIC's",
              "porcentaje": 25,
              "desglose": [
                {
                  "criterio": "Participaciones y uso de TICs - Trabajo de investigación (Unidad VII)",
                  "instrumento": "Lista de cotejo"
                },
                {
                  "criterio": "Participaciones y uso de TICs - Participación de video (Unidad VIII)",
                  "instrumento": "Lista de cotejo"
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
