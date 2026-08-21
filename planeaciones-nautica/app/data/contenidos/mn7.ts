// MN — VII Semestre (PPE_LMN_FIDENA_2022).
// FUENTE DE VERDAD: PDFs oficiales FIDENA. Objetivos específicos: alta confianza;
// sin match limpio => "Pendiente de revisión". Bibliografía: mejor esfuerzo (revisar).
import type { ProgramaOficial } from "../tipos";

export const contenidosMN7: Record<string, ProgramaOficial> = {
  "Automática": {
    "clave": "AUT747",
    "nombre": "Automática",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 4,
      "teoricas": 20,
      "practicas": 52,
      "independientes": 8,
      "total": 80
    },
    "objetivoGeneral": "Aplicar la Teoría de la Lógica digital en el desarrollo y simplificación de funciones booleanas, implementando los correspondientes circuitos lógicos, para analizar y diseñar instrumentos de medición y sistemas de control.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Funciones booleanas",
        "objetivoEspecifico": "Temas y subtemas: Objetivos específicos.",
        "subtemas": [
          "1.1 Términos mínimos y términos máximos.",
          "1.3 Conversión entre formas canónicas.",
          "1.4 Formas normalizadas de una función booleana.",
          "1.5 Cantidad de funciones booleanas posibles correspondientes al Karnaugh, para realizarla con el número de variables.",
          "1.6 Simbología de compuertas lógicas."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Simplificación de funciones de Boole",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "2.1 Principio de simplificación.",
          "2.3 Uso del mapa con dos y tres variables.",
          "2.4 Uso del mapa con cuatro variables.",
          "2.5 Uso del mapa con cinco variables.",
          "2.6 Uso del mapa con seis variables.",
          "2.7 Condiciones de no importa y su aprovechamiento en la simplificación.",
          "2.8 El método del tabulado."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Ejecución de una función de Boole",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "3.1 Compuertas lógicas universales. NANO.",
          "3.3 Ejecución de una función de Boole con compuertas lógicas NOR. dada."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Lógica combinacional",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "4.1 Introducción.",
          "4.3 Sumadores y substractores.",
          "4.4 Códigos y transformación de uno a otro.",
          "4.5 Procedimiento de análisis de un circuito lógico.",
          "4.6 Funciones OR exclusiva y de equivalencia.",
          "4.7 Uso de circuitos integrados de mediana y de gran escala de integración.",
          "4.8 Sumador paralelo binario.",
          "4.9 Sumador decimal.",
          "4.10 Decodificadores y codificadores.",
          "4.11 Demultiplexor y multiplexor."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Lógica secuencial.",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "5.1 Introducción.",
          "5.2 Elementos de memoria (FLIP FLOPS).",
          "5.4 Análisis de circuitos combinacionales temporizados.",
          "5.5 Procedimiento de diseño.",
          "5.6 Diseño de contadores.",
          "5.7 Registros, contadores y unidad de memoria.",
          "5.8 Transferencia entre registros, tiempo de palabra.",
          "5.9 Adición en serie.",
          "5.1 0Contador BDC.",
          "5.11 Secuencias de tiempo."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Circuitos lógicos de control con elementos neumáticos, hidráulicos y fluídicos.",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "6.2 Válvulas de dos posiciones tres vías normalmente cerradas y normalmente abiertas.",
          "6.3 Válvulas de dos posiciones dos vías normalmente cerradas y normalmente abiertas.",
          "6.4 Válvulas de dos posiciones de cuatro vías.",
          "6.5 Válvulas de cuatro vías y tres posiciones.",
          "6.6 Elemento de memoria neumático.",
          "6.7 Válvulas unidireccionales y doble unidireccional.",
          "6.8 Implementación de funciones lógicas con elementos neumáticos.",
          "6.9 Elementos hidráulicos.",
          "6.10 Implementación de funciones lógicas con elementos hidráulicos.",
          "6.11 Principio de operación de los elementos fluídicos.",
          "6.12 Componentes fluídicos básicos.",
          "6.13 Equipos auxiliares fluídicos.",
          "6.14 Implementación de funciones lógicas con elementos fluídicos."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Instrumentos de medición y control.",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "7.1 Simbología de instrumentación.",
          "7.3 Errores de un instrumento y su calibración.",
          "7.4 Medición de presión.",
          "7.5 Medición de temperatura.",
          "7.6 Medición de flujo.",
          "7.7 Medición de nivel.",
          "7.8 Transductores.",
          "7.9 Transmisores.",
          "7.10 Controladores proporcional, integral y derivativo, neumáticos (PID).",
          "7.11 Controlador eléctrico.",
          "7.12 Controlador electrónico.",
          "7.13 Actuadores.",
          "7.14 Variable controlada y variable de control.",
          "7.15 Sistema de control ON-OFF.",
          "7.16 Sistema de control de lazo cerrado. UNIDAD"
        ],
        "transversal": false
      }
    ],
    "bibliografia": [
      "Electrónica digital. Teoría, problemas y MARTÍN, Sergio Alfaomega 2012",
      "simulación. RIOSERAS, Miguel",
      "Alfaomega - Marcombo 2011",
      "Electrónica de potencia. Principios BALL ESTER, Eduard",
      "fundamentales y estructuras básicas. PIQUE, Robert Mc Graw HilI 2000",
      "Autómatas programables. PORRAS"
    ],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.4_AUT747_-_.pdf"
  },
  "Familiarización con buques tanque": {
    "clave": "C0129",
    "nombre": "Familiarización con buques tanque",
    "tipo": "Teórica",
    "horas": {
      "semanas": 14,
      "porSemana": 5,
      "teoricas": 70,
      "practicas": 0,
      "independientes": 0,
      "total": 70
    },
    "objetivoGeneral": "Pendiente de revisión",
    "unidades": [
      {
        "numero": 1,
        "tema": "Física básica",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "1.1 Química básica , elementos químicos y los grupos",
          "1.2 propiedades físicas del petróleo, químico y gases transportadas a granel"
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Características de la carga",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "2.1 Física básica",
          "2.2 Química básica , elementos químicos y los grupos",
          "2.3 Propiedades físicas del petróleo, químico y gases transportadas a granel"
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Toxicidad y otros peligros",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "3.1 conceptos generales y efectos de la toxicidad",
          "3.2 peligro de incendio",
          "3.3 Peligro para la salud",
          "3.4 peligro al medio ambiente",
          "3.5 Peligro de radioactividad",
          "3.6 peligro a la corrosión"
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Prevención de accidentes",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "4.1 Hoja de carga de datos de seguridad",
          "4.2 Método para controlar sustancias peligrosas en buques tanques petroleros"
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Equipos de seguridad y protección personal",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "5.1 Instrumentos de medida de seguridad",
          "5.2 Aparatos especializados para la extinción de incendios",
          "5.3 Aparatos de respiración, tanque de evacuación, equipo de rescate y escape",
          "5.4 Ropa y equipo protector",
          "5.5 resucitador",
          "5.6 Medidas y precauciones de seguridad"
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Prevención de la contaminación",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "6.1 Causas de la contaminación marina y aire",
          "6.2 Prevencion de la contaminación marina",
          "6.3 Medidas que son tomadas en consideración en un evento de derrame",
          "6.4 SOPEP",
          "6.5 Enlace buque / tierra"
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Operaciones de emergencia",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "7.1 Medidas de emergencia",
          "7.2 estructura organizacional",
          "7.3 Alarmas",
          "7.4 Procedimiento de emergencia",
          "7.5 Tratamiento de primeros auxilios"
        ],
        "transversal": false
      },
      {
        "numero": 8,
        "tema": "Equipos para la carga",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "8.1 Equipo para la manipulación de la carga en buques tanques petroleros",
          "8.2 Equipo para la manipulación de la carga en buques tanques quimiqueros",
          "8.3 Equipo para la manipulación de la carga en buques tanques gaseros"
        ],
        "transversal": false
      },
      {
        "numero": 9,
        "tema": "Operaciones de la carga",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "9.1 conocimientos generales de los procedimientos operativos de seguridad de la carga de los buques tanques petroleros"
        ],
        "transversal": false
      },
      {
        "numero": 10,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "Unidad transversal: el docente incorpora contenidos o temas de actualidad del sector marítimo portuario (selección a cargo del profesor).",
        "subtemas": [],
        "transversal": true
      }
    ],
    "bibliografia": [
      "B1 international guide for oil tanker and terminal 4th edicion london WITHERBY AND CO. LTD. 32/36 AYLLES BURY STREET.",
      "LONDON EC1R, OET UK. 1996.",
      "B2 TANKER hand book for deck officers glasgow brown son ferguson LTD .",
      "B3 tanker safety guide chemical segunda edición LONDON WITHERBY AND CO. LTD 1991.",
      "B4 chemical parcel tankers tercera edición london fairply publication LTD 1984.",
      "B5 transport of liquid chemical in bulk ockero, b bengtsson and a.b inmar 1982",
      "B6 hasta la B20 del curso modelo 1.01 DE FAMILIARIZACIÓN DE BUQUES PETROLEROS.",
      "REFERENCIAS DE OMI",
      "R1 SOLAS 1974 (edición consolidada 1997)",
      "R2STCW78/95 (IMO-110E)"
    ],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.10_C0129_-_.pdf"
  },
  "Familiarización con buque de pasaje": {
    "clave": "C0131",
    "nombre": "Familiarización con buque de pasaje",
    "tipo": "Teórica",
    "horas": {
      "semanas": 8,
      "porSemana": 4,
      "teoricas": 24,
      "practicas": 8,
      "independientes": 0,
      "total": 32
    },
    "objetivoGeneral": "Pendiente de revisión",
    "unidades": [
      {
        "numero": 1,
        "tema": "Formación en control de multitudes.",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "1.1 Conocimientos de los dispositivos salvavidas y de los planes de control.",
          "1.2 La aptitud para prestar asistencia a los pasajeros que se dirijan a los puestos de reunión y de embarco.",
          "1.3 Los procedimientos de reunión."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Familiarización en Buque de Transbordo Rodado.",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "2.1 Limitaciones operacionales y de proyecto aptitud para comprender y observar las limitaciones operacionales de la estanqueidad, así como las consideraciones especiales sobre estabilidad que puedan afectar a la seguridad de los buques de pasaje de transbordo rodado.",
          "2.2 Aptitud para aplicar debidamente los procedimientos de a bordo relativos al mantenimiento del equipo propio de los buques de pasaje de transbordo rodado, tales como las puertas y rampas de proa y popa , y las puertas laterales, así como los imbornales y los sistemas conexos.",
          "2.3 Aptitud para entender y observar todas las prescripciones internacionales y de ámbito nacional aplicables a los buques de pasaje de transbordo rodado, habida cuenta del tipo de buque y de los cometidos que se vayan a desempeñar."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Formación sobre seguridad para el personal en contacto directo con los pasajeros en espacios destinados a ellos.",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "3.1 Aptitud para comunicarse con los pasajeros en una emergencia.",
          "3.2 Aptitud para efectuar demostraciones a los pasajeros sobre el uso de los dispositivos salvavidas individuales."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Formación sobre seguridad de los pasajeros, la carga e integridad del casco.",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "4.1 Aptitud para aplicar correctamente los procedimientos establecidos referentes a la carga y embarque.",
          "4.2 Aptitud para aplicar las precauciones, procedimientos y prescripciones especiales que se refieren al transporte de mercancías peligrosas a bordo de los buques de pasaje de transbordo rodado.",
          "4.3 Aptitud para cálculo de estabilidad, asiento y esfuerzos.",
          "4.4 Aptitud para apertura, cierre y sujeción de las aberturas del casco.",
          "4.5 Aptitud para controlar la atmósfera en las cubiertas para vehículos."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Formación sobre gestión de emergencias y comportamiento humano.",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "Unidad transversal: el docente incorpora contenidos o temas de actualidad del sector marítimo portuario (selección a cargo del profesor).",
        "subtemas": [],
        "transversal": true
      }
    ],
    "bibliografia": [],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.11_C0131_-_.pdf"
  },
  "Educación Física VII": {
    "clave": "CO011",
    "nombre": "Educación Física VII",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 3,
      "teoricas": 0,
      "practicas": 54,
      "independientes": 0,
      "total": 54
    },
    "objetivoGeneral": "Realizar movimientos físicos para el desarrollo de la percepción y mejora de la coordinación motriz fina y gruesa en el desempeño de cualquier función.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Percepción y coordinación motriz",
        "objetivoEspecifico": "Ejecutar movimientos físicos de forma adecuada, desarrollando la percepción y coordinación motriz, psicomotriz, para favorecer la ubicación en el espacio, tiempo, equilibrio y lateralidad.",
        "subtemas": [
          "1.1 Movimientos físicos.",
          "1.2 Ubicación espacial.",
          "1.3 Coordinación motriz y psicomotriz.",
          "1.4 Equilibrio.",
          "1.5 Lateralidad."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Desarrollo físico integral",
        "objetivoEspecifico": "Ejecutar movimientos físicos de forma adecuada, desarrollando la percepción y coordinación motriz, psicomotriz, para favorecer la ubicación en el espacio, tiempo, equilibrio y lateralidad.",
        "subtemas": [
          "2.1 Fuerza muscular.",
          "2.2 Resistencia cardiorespiratoria.",
          "2.3 Flexibilidad articular y muscular."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Concentración",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "3.1 Fútbol.",
          "3.2 Juegos de concentración.",
          "3.3 Básquetbol.",
          "3.4 Voleibol."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Condición física",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "4.1 Fuerza.",
          "4.2 Vigor.",
          "4.3 Flexibilidad."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Natación",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "5.1 Técnica.",
          "5.2 Flotación.",
          "5.3 Nado libre.",
          "5.4 Nado en grupo.",
          "5.5 Sobrevivencia."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "Unidad transversal: el docente incorpora contenidos o temas de actualidad del sector marítimo portuario (selección a cargo del profesor).",
        "subtemas": [],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Didáctica de la natación Facundo Comba",
      "Los 100 mejores ejercicios de natación Blythe Lucero Cordero 2021",
      "Curso básico de salvamento acuático Cruz Roja Mexicana",
      "Kindle 2016",
      "http://dipsa.com/ClanDuna 2015",
      "nt/Textos/CR%20-",
      "%20Acuatico,%20Manual",
      "%20de%20Salvamento%2",
      "0Acu%C3%A1tico.pdf"
    ],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.9_CO011_-_.pdf"
  },
  "Estabilidad del Buque": {
    "clave": "EST748",
    "nombre": "Estabilidad del Buque",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 4,
      "teoricas": 54,
      "practicas": 18,
      "independientes": 10,
      "total": 82
    },
    "objetivoGeneral": "Conocer la forma de calcular la estabilidad, utilizando el procedimiento adecuado, para garantizar la seguridad del buque.",
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
        "objetivoEspecifico": "Conocer la forma de calcular áreas y volúmenes, utilizando métodos aproximados de integración, para determinar los atributos de la carena y la estabilidad del buque.",
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
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "4.1 Definición.",
          "4.2 Centro de gravedad y centro de carena.",
          "4.3 Etacentro transversal.",
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
        "objetivoEspecifico": "Conocer la forma de calcular la estabilidad estática transversal a grandes ángulos de escora, mediante el uso de las curvas cruzadas o curvas KN, para garantizar una buena estabilidad y navegación segura.",
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
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "6.1 Análisis de la estabilidad dinámica.",
          "6.2 Cálculo de la estabilidad dinámica."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Asiento",
        "objetivoEspecifico": "Pendiente de revisión",
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
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [],
        "transversal": false
      },
      {
        "numero": 9,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "Unidad transversal: el docente incorpora contenidos o temas de actualidad del sector marítimo portuario (selección a cargo del profesor).",
        "subtemas": [],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Teoría del buque, flotabilidad y OLIVELLA PUIG, Joan UPC 2001",
      "estabilidad.",
      "OLIVELLA PUIG, Joan UPC 2006",
      "Teoría del buque, flotabilidad y",
      "estabilidad. Problemas. DERRET, D. R. Stanford Maritime 1997",
      "Ship stability for master & mates.",
      "4"
    ],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.5_EST748.pdf"
  },
  "Laboratorio de Máquinas": {
    "clave": "LMA745",
    "nombre": "Laboratorio de Máquinas",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 4,
      "teoricas": 36,
      "practicas": 36,
      "independientes": 10,
      "total": 82
    },
    "objetivoGeneral": "Utilizar el simulador ERS-2000, controlando satisfactoriamente los sistemas, para familiarizarse en la operación del departamento de máquinas en diversos tipos de buques.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Introducción",
        "objetivoEspecifico": "Conocer los equipos en el ERS-2000, identificando sus componentes y propósito, para familiarizarse con los equipos con que cuentan las embarcaciones.",
        "subtemas": [
          "1.1 Propósito de Simulador ERS-2000.",
          "1.2 Distribución del equipo."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Planta de Generación Eléctrica",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "2.1 Generador eléctrico de emergencia motor diesel.",
          "2.2 Generadores principales diesel.",
          "2.3 Interruptores.",
          "2.4 Red eléctrica y carga.",
          "2.5 Manejo del generador del eje de cola.",
          "2.6 Suministro de energía eléctrica de tierra."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Maquinaria Marítima Auxiliar",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "3.1 Sistema planta de vapor.",
          "3.2 Sistema agua de sentina.",
          "3.3 Sistema de gobierno.",
          "3.4 Planta destiladora.",
          "3.5 Estación alarma contra incendio.",
          "3.6 Estación CO2.",
          "3.7 Sistema contra incendio.",
          "3.8 Sistema refrigeración y aire acondicionado."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Máquina principal.",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "4.1 Puesta en servicio de la máquina principal.",
          "4.2 Control de los parámetros de la máquina principal. para la puesta en servicio.",
          "4.3 Deshabilitar la máquina principal."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "Unidad transversal: el docente incorpora contenidos o temas de actualidad del sector marítimo portuario (selección a cargo del profesor).",
        "subtemas": [],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Transas Marine Ltd.",
      "Manuales del simulador ERS 2000. Transas Marine Ltd. Transas Marine Ltd. 2005",
      "Transas Marine Ltd.",
      "Manuales del simulador ERS 4000. Transas Marine Ltd. 2005",
      "Manuales del simulador ERS 2000, Transas Marine Ltd. 2005",
      "ejercicios."
    ],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.2_LMA745_-_.pdf"
  },
  "Refrigeración II": {
    "clave": "REF746",
    "nombre": "Refrigeración II",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 6,
      "teoricas": 72,
      "practicas": 36,
      "independientes": 12,
      "total": 120
    },
    "objetivoGeneral": "Comprender que la conservación de un sistema de refrigeración se realiza manteniendo en buen estado sus elementos y respetando las normas de seguridad, para que el buque proporcione un buen servicio.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Controles del ciclo básico de refrigeración",
        "objetivoEspecifico": "Conocer y manejar los diferentes controles de operaciones del ciclo básico de refrigeración, siguiendo y aplicando los principios de su funcionamiento para una adecuada utilización.",
        "subtemas": [
          "1.1 Definición de controles del ciclo de refrigeración.",
          "1.2 Categoría de los controles.",
          "1.3 Tipos de controles.",
          "1.4 Controles de operación.",
          "1.5 Controles de seguridad.",
          "1.6 Principios de funcionamiento.",
          "1.7 Utilización."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Tuberías y accesorios de refrigeración",
        "objetivoEspecifico": "Determinar el refrigerante adecuado, considerando el tipo de material utilizado en los accesorios y tuberías de un sistema de refrigeración, para un funcionamiento óptimo.",
        "subtemas": [
          "2.1 Materiales utilizados en las tuberías y accesorios de acuerdo al refrigerante usado."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Accesorios del sistema",
        "objetivoEspecifico": "Identificar los accesorios utilizados en un sistema de refrigeración y aire acondicionado, usando esquemas y explicando su función para darle mantenimiento y seguridad al equipo de refrigeración.",
        "subtemas": [
          "3.1 Separador de aceite.",
          "3.2 Filtros.",
          "3.3 Secador.",
          "3.4 Visores.",
          "3.5 Válvulas de servicio y seguridad."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Procedimiento para carga de gas refrigerante en el sistema",
        "objetivoEspecifico": "Proceder a efectuar carga de gas refrigerante a un sistema de refrigeración y aire acondicionado, aplicando los procedimientos adecuados para prevenir accidentes.",
        "subtemas": [
          "4.1 Carga por lado de alta.",
          "4.2 Carga por lado de baja.",
          "4.3 Forma de efectuar vacío al sistema."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Operación y funcionamiento de un sistema de refrigeración y aire acondicionado",
        "objetivoEspecifico": "Operar con seguridad y dar mantenimiento a un sistema de refrigeración usando los conocimientos adquiridos, para el buen funcionamiento.",
        "subtemas": [
          "5.1 Puesta en servicio y fuera de servicio.",
          "5.2 Mantenimiento preventivo de un sistema de refrigeración.",
          "5.3 Mantenimiento correctivo de un sistema de refrigeración."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "Unidad transversal: el docente incorpora contenidos o temas de actualidad del sector marítimo portuario (selección a cargo del profesor).",
        "subtemas": [],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Manual de refrigeración. FRANCO LIJÓ, Juan M. Reverte 2006",
      "Manuales prácticos de refrigeración. BUQUÉ, Francesc. Trillas 2003",
      "Tratado práctico de refrigeración automática. ALARCÓN CREUS. Marcombo 2000"
    ],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.3_REF746.pdf"
  },
  "Convenios de la Organización Marítima Internacional": {
    "clave": "OMI749",
    "nombre": "Convenios de la Organización Marítima Internacional",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 3,
      "teoricas": 36,
      "practicas": 18,
      "independientes": 6,
      "total": 60
    },
    "objetivoGeneral": "Interpretar los convenios más importantes emitidos por la OMI, analizando el contenido de cada uno de los mismos para su aplicación en el análisis de problemas.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Convenio Internacional sobre Normas de Formación, Titulación y Guardia para la gente de mar.",
        "objetivoEspecifico": "Relacionar el contenido del Convenio Internacional sobre Normas de Formación, Titulación y Guardia para la Gente de Mar con la formación de los oficiales para la marina mercante, entendiendo la aplicación y contenido del convenio, para el mejor desempeño a bordo.",
        "subtemas": [
          "1.1 Importancia.",
          "1.2 Aplicación.",
          "1.3 Contenido del Convenio."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Convenio Internacional para el Control y la Gestión del Agua de Lastre y los Sedimentos de los Buques",
        "objetivoEspecifico": "Describir los procedimientos para el control del agua de lastre y sedimentos de los buques analizando el contenido del convenio, para su adecuado registro en el libro correspondiente.",
        "subtemas": [
          "2.1 Ámbito de aplicación.",
          "2.2 Contenido del convenio.",
          "2.3 Libro de registro del agua de lastre."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Reciclaje de buques",
        "objetivoEspecifico": "Describir e identificar los procedimientos de reciclaje de un buque, mediante el uso del convenio correspondiente para para buques, comprendiendo el control que se debe de seguir para la aplicación del convenio internacional.",
        "subtemas": [
          "3.1 Importancia del reciclaje de buques.",
          "3.2 Ámbito de aplicación.",
          "3.3 Procedimientos aplicables para el reciclaje de buques. aplicarlo en un momento dado."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Convenio Internacional sobre el Control de los Sistemas Describir los sistemas antiincrustantes Antiincrustantes Perjudiciales para Buques",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "4.1 Importancia.",
          "4.2 Ámbito de aplicación.",
          "4.3 Control de los sistemas antiincrustantes."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Piratería y terrorismo",
        "objetivoEspecifico": "Comprender la evolución y surgimiento de la piratería y terrorismo en el mar, revisando los documentos necesarios para explicar los motivos de impacto internacionalmente.",
        "subtemas": [
          "5.1 La evolución sobre la libertad de la navegación.",
          "5.2 La Organización Marítima Internacional frente al terrorismo.",
          "5.3 Los instrumentos del Convenio para la represión de económico, político y social actos ilícitos de octubre 2005 y el combate al terrorismo internacional.",
          "5.4 La piratería en las costas del tercer mundo y su incidencia en el comercio marítimo internacional.",
          "5.5 La seguridad en el Mar."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "Unidad transversal: el docente incorpora contenidos o temas de actualidad del sector marítimo portuario (selección a cargo del profesor).",
        "subtemas": [],
        "transversal": true
      }
    ],
    "bibliografia": [
      "STCW Convenio y Código de Formación IMO IMO 2010",
      "incluidas las enmiendas de 2010.",
      "Convenio Internacional sobre normas de",
      "formación, titulación y guardia para la",
      "gente de mar.",
      "Compuestos orgánicos de zinc y su ARIAS. E. / SUAU, P. / LIESA, ICM 1992",
      "aplicación en la formulación de pinturas F.",
      "anti-incrustantes.",
      "3",
      "Directrice s de la OMI sobre reciclado de OMI OMI 2006"
    ],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.6_OMI749_-_.pdf"
  },
  "Prácticas Marineras VII": {
    "clave": "PMR751",
    "nombre": "Prácticas Marineras VII",
    "tipo": "Práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 3,
      "teoricas": 18,
      "practicas": 36,
      "independientes": 0,
      "total": 54
    },
    "objetivoGeneral": "Aplicar los conocimientos para el auxilio de personas en peligro en agua, distinguiendo el significado de las banderas y señales, así como, diferencia el marcado de las cadenas de fondeo y utiliza métodos para combatir la corrosión.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Natación en grupo",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "1.1 Organización del grupo.",
          "1.2 Distribución."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Auxilio de personas en peligro en el agua",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "2.1 Identificación del peligro.",
          "2.2 Acercamiento a la víctima.",
          "2.3 Acciones a tomar para auxiliar."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Banderas y señales",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "3.1 Formas y colores del código internacional de banderas. describiendo el significado de ellas para",
          "3.2 Uso y significado."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Aplicación de anticorrosivos",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "4.1 Diferentes tipos y su uso."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Acabados, esmaltes y barnices",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "5.1 Composición de los esmaltes.",
          "5.2 Preparación de la pintura.",
          "5.3 Igualación de colores."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Interpretación y elaboración de reportes de existencias y Elaborar reportes que muestran los consumos",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "6.1 Existencia de cabos y cables.",
          "6.2 Existencia de pinturas y solventes.",
          "6.3 Herramientas y accesorios de trabajo.",
          "6.4 Partes de respeto."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Faenas con anclas",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "7.1 Bajada del ancla a plan de muelle.",
          "7.2 Chicoteo del ancla."
        ],
        "transversal": false
      },
      {
        "numero": 8,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "Unidad transversal: el docente incorpora contenidos o temas de actualidad del sector marítimo portuario (selección a cargo del profesor).",
        "subtemas": [],
        "transversal": true
      }
    ],
    "bibliografia": [
      "Manual de conocimientos marineros AUTOR",
      "Ane de la maniobra del buque José Real, Domingo Guardacostas B. A 2002",
      "Gómez, Victorio R.",
      "Centro de 1989",
      "Capitanes de Ultramar y",
      "Oficiales de la Marina",
      "Mercante",
      "B. A",
      "Manual del Marino Muller, Krauss Víctor Leru 1994"
    ],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.8_PMR751_-.pdf"
  },
  "Taller VI": {
    "clave": "TAL750",
    "nombre": "Taller VI",
    "tipo": "Teórico-práctica",
    "horas": {
      "semanas": 18,
      "porSemana": 4,
      "teoricas": 24,
      "practicas": 48,
      "independientes": 8,
      "total": 80
    },
    "objetivoGeneral": "Manejar con eficacia el cepillo mecánico y la fresadora, considerando las medidas de seguridad necesarias, para fabricar piezas que requiera el buque en sus reparaciones.",
    "unidades": [
      {
        "numero": 1,
        "tema": "Dispositivo de aseguramiento",
        "objetivoEspecifico": "Fijar diferentes piezas en los equipos, utilizando correctamente los dispositivos adecuados para garantizar su aseguramiento. Remachar diferentes materiales aplicando correctamente los diferentes tipos, de acuerdo a las necesidades.",
        "subtemas": [
          "1.1 Placa de aseguramiento.",
          "1.2 Tuerca seguro.",
          "1.3 Aseguramiento con adhesivos y cable.",
          "1.4 Pasadores.",
          "1.5 Resortes y arandelas."
        ],
        "transversal": false
      },
      {
        "numero": 2,
        "tema": "Remachado",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "2.1 Tipos de remache de acuerdo al material a unir."
        ],
        "transversal": false
      },
      {
        "numero": 3,
        "tema": "Dimensiones de piezas",
        "objetivoEspecifico": "Realizar mediciones de piezas, considerando límites y tolerancias, para diferentes trabajos. Instalar y ajustar los diferentes tipos de cojinetes usando los métodos adecuados, para un trabajo de calidad.",
        "subtemas": [
          "3.1 Límites en la dimensión.",
          "3.2 Tolerancias geométricas y ajustes."
        ],
        "transversal": false
      },
      {
        "numero": 4,
        "tema": "Cojinetes",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "4.1 Tipos y usos.",
          "4.2 Métodos de instalación.",
          "4.3 Ajuste de acuerdo a la carga."
        ],
        "transversal": false
      },
      {
        "numero": 5,
        "tema": "Sellos",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "5.1 Propósito y selección.",
          "5.2 Tipos de sellos según su material y aplicación."
        ],
        "transversal": false
      },
      {
        "numero": 6,
        "tema": "Lubricación en rodamiento",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "6.1 Importancia de la lubricación.",
          "6.2 Tipos de lubricación."
        ],
        "transversal": false
      },
      {
        "numero": 7,
        "tema": "Cepillo mecánico",
        "objetivoEspecifico": "Operar de forma segura los cepillos mecánicos aplicando velocidad de corte, medios de sujeción y ajuste de la carrera, para realizar un trabajo de calidad.",
        "subtemas": [
          "7.1 Clasificación y tipos.",
          "7.2 Elementos.",
          "7.3 Normas de seguridad para su uso.",
          "7.4 Velocidad de corte y golpes por minuto.",
          "7.5 Medios de sujeción.",
          "7.6 Ajuste de la longitud de la carrera."
        ],
        "transversal": false
      },
      {
        "numero": 8,
        "tema": "Fresadora",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "8.1 Tipos.",
          "8.2 Elementos componentes.",
          "8.3 Medidas de seguridad en su uso."
        ],
        "transversal": false
      },
      {
        "numero": 9,
        "tema": "Herramientas de corte para fresadoras",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "9.1 Tipos de herramientas de corte.",
          "9.2 Accesorios auxiliares."
        ],
        "transversal": false
      },
      {
        "numero": 10,
        "tema": "Cabezal divisor de la fresadora",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "10.1 Tipos de cabezal divisor de la fresadora. La presente unidad se incluye con el",
          "10.2 Función específica."
        ],
        "transversal": false
      },
      {
        "numero": 11,
        "tema": "Fabricación de engranes",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [
          "11.1 Engranes rectos.",
          "11.2 Engranes helicoidales."
        ],
        "transversal": false
      },
      {
        "numero": 12,
        "tema": "Práctica",
        "objetivoEspecifico": "Pendiente de revisión",
        "subtemas": [],
        "transversal": false
      },
      {
        "numero": 13,
        "tema": "Contenidos de actualidad en el sector marítimo portuario",
        "objetivoEspecifico": "Unidad transversal: el docente incorpora contenidos o temas de actualidad del sector marítimo portuario (selección a cargo del profesor).",
        "subtemas": [],
        "transversal": true
      }
    ],
    "bibliografia": [
      "ALMASOL. Key to New vistas of NEELY, R. J. Engineering Magazine 2001",
      "Lubrication Power. WALDEN, Everetteo",
      "BARNES , Christopher Machinery Lubrication 2005",
      "Improving Chain Lubrication.",
      "GONZÁLEZ REY, Magazine",
      "Ingeniería básica de rodamientos. Gonzalo",
      "Editorial Académica 2012",
      "Española",
      "4"
    ],
    "fuente": "PPE_LMN_FIDENA_2022-_07SEM_LMN_S7.7_TAL750.pdf"
  }
};
