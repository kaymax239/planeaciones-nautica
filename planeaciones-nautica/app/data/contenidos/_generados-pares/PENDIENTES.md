# PENDIENTES — Evaluación (captura/revisión manual)

Generado por `scripts/agregar-evaluacion-pares.mjs`. Estas materias NO recibieron
campo `evaluacion` porque los % no sumaban 100, faltaba %, o no había tabla.
Los porcentajes NO se ajustaron para forzar la suma.

## Metodología de la investigación
- archivo: `MN_Sem02_Metodologia-De-La-Investigacion.json`
- motivo: parcial "Examen primer parcial" suma 20, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Examen primer parcial",
      "criterios": [
        {
          "criterio": "Examen primer parcial",
          "peso": 20,
          "instrumento": null
        }
      ]
    }
  ]
}
```

## Estática
- archivo: `MN_Sem02_Estatica.json`
- motivo: parcial "Primer Parcial" suma 90, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Primer Parcial",
      "criterios": [
        {
          "criterio": "Práctica resultante de dos fuerzas y primera ley de Newton",
          "peso": 10,
          "instrumento": "Práctica escrita"
        },
        {
          "criterio": "Práctica escrita Momento",
          "peso": 10,
          "instrumento": "Práctica escrita"
        },
        {
          "criterio": "Examen Parcial",
          "peso": 70,
          "instrumento": "Examen Parcial"
        }
      ]
    }
  ]
}
```

## Educación Física II
- archivo: `MN_Sem02_Educacion-Fisica.json`
- motivo: parcial "1er Parcial" suma 120, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er Parcial",
      "criterios": [
        {
          "criterio": "Ejecución correcta de circuitos motores",
          "peso": 20,
          "instrumento": "Lista de cotejo y registro anecdótico (Diagnóstica y formativa)"
        },
        {
          "criterio": "Investigar sobre los nadadores con problemas psicomotores en la historia de México",
          "peso": 20,
          "instrumento": "Lista de cotejo y registro anecdótico (Diagnóstica y formativa)"
        },
        {
          "criterio": "Cumplimiento de rutina física con técnica adecuada",
          "peso": 30,
          "instrumento": "Lista de cotejo (formativa)"
        },
        {
          "criterio": "Participación y aplicación de tácticas básicas",
          "peso": 10,
          "instrumento": "Rúbrica de participación"
        },
        {
          "criterio": "EXAMEN",
          "peso": 20,
          "instrumento": "Examen (evaluación sumativa)"
        },
        {
          "criterio": "Investigación (investigar la historia del voleibol en México)",
          "peso": 20,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        }
      ]
    },
    {
      "nombre": "2DA EVALUACIÓN PARCIAL",
      "criterios": [
        {
          "criterio": "Mejora observable en condición física",
          "peso": 20,
          "instrumento": "Lista de cotejo (formativa)"
        },
        {
          "criterio": "Ejecución correcta de simulaciones, dominio de técnicas básicas y participación",
          "peso": 30,
          "instrumento": "Lista de cotejo (Formativa)"
        },
        {
          "criterio": "Participación reflexiva y práctica",
          "peso": 10,
          "instrumento": "Lista de cotejo (formativa)"
        },
        {
          "criterio": "Examen Segundo parcial",
          "peso": 20,
          "instrumento": "Examen (evaluación sumativa)"
        }
      ]
    }
  ]
}
```

## Prácticas Marineras II
- archivo: `MN_Sem02_Practicas-Marineras.json`
- motivo: parcial "Primer examen parcial": criterio sin % válido ("Examen diagnostico")
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Primer examen parcial",
      "criterios": [
        {
          "criterio": "Examen diagnostico",
          "peso": 0,
          "instrumento": "Evaluación diagnóstica"
        },
        {
          "criterio": "Practica Elabora nudos",
          "peso": 14,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Investigación",
          "peso": 5,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Practica taller",
          "peso": 14,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Practica de taller",
          "peso": 14,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Desarrolla un cuadro sinóptico relacionando pesos y resistencias de los cables de acero utilizados en las maniobras",
          "peso": 5,
          "instrumento": "Lista de cotejo Evaluación formativa"
        },
        {
          "criterio": "Practica taller",
          "peso": 14,
          "instrumento": "Lista de cotejo Evaluación formativa"
        },
        {
          "criterio": "Practica taller",
          "peso": 14,
          "instrumento": "Lista de cotejo Evaluación formativa"
        },
        {
          "criterio": "Examen",
          "peso": 20,
          "instrumento": "Examen Evaluación Sumativa"
        }
      ]
    }
  ]
}
```

## Pensamiento Crítico
- archivo: `MN_Sem06_Pensamiento-Critico.json`
- motivo: parcial "2do PARCIAL" suma 30, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er PARCIAL",
      "criterios": [
        {
          "criterio": "Actividad 1, 2 (UNIDAD 1. Pensamiento Crítico)",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Actividad 1,2,3 (UNIDAD 2. Pensar y Tomar Decisiones)",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Cuestionario",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Mapa conceptual (UNIDAD I)",
          "peso": 10,
          "instrumento": null
        },
        {
          "criterio": "Participación del estudiante (UNIDAD II)",
          "peso": 5,
          "instrumento": "Preguntas"
        },
        {
          "criterio": "Examen (UNIDAD I Y II)",
          "peso": 50,
          "instrumento": "Examen"
        }
      ]
    },
    {
      "nombre": "2do PARCIAL",
      "criterios": [
        {
          "criterio": "Estudio de caso (UNIDAD 3. Componentes del Pensamiento Crítico)",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Resumen (UNIDAD 4. Pensamiento Lateral)",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        }
      ]
    }
  ]
}
```

## Metodología de la investigación
- archivo: `MN_Sem08_Metodologia-Investigacion.json`
- motivo: parcial "Examen primer parcial" suma 20, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Examen primer parcial",
      "criterios": [
        {
          "criterio": "Examen primer parcial",
          "peso": 20,
          "instrumento": null
        }
      ]
    }
  ]
}
```

## Legislación Marítima y Laboral
- archivo: `MN_Sem08_Legislacion-Maritima.json`
- motivo: parcial "Examen primer parcial" suma 95, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Examen primer parcial",
      "criterios": [
        {
          "criterio": "Participación",
          "peso": 5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Debate",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Cuadro sinóptico",
          "peso": 7.5,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Investigación",
          "peso": 10,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Resumen",
          "peso": 7.5,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Examen primer parcial",
          "peso": 50,
          "instrumento": "Examen"
        },
        {
          "criterio": "Discusión guiada",
          "peso": 5,
          "instrumento": "Lista de cotejo"
        }
      ]
    }
  ]
}
```

## Metodología de la investigación
- archivo: `PN_Sem02_Metodologia-De-La-Investigacion.json`
- motivo: parcial "Examen primer parcial" suma 20, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Examen primer parcial",
      "criterios": [
        {
          "criterio": "Examen primer parcial",
          "peso": 20,
          "instrumento": null
        }
      ]
    }
  ]
}
```

## Estática
- archivo: `PN_Sem02_Estatica.json`
- motivo: parcial "Primer Parcial" suma 90, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Primer Parcial",
      "criterios": [
        {
          "criterio": "Práctica resultante de dos fuerzas y primera ley de Newton",
          "peso": 10,
          "instrumento": "Práctica escrita"
        },
        {
          "criterio": "Práctica escrita Momento",
          "peso": 10,
          "instrumento": "Práctica escrita"
        },
        {
          "criterio": "Examen Parcial",
          "peso": 70,
          "instrumento": "Examen Parcial"
        }
      ]
    }
  ]
}
```

## Educación Física II
- archivo: `PN_Sem02_Educacion-Fisica.json`
- motivo: parcial "1er Parcial" suma 120, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er Parcial",
      "criterios": [
        {
          "criterio": "Ejecución correcta de circuitos motores",
          "peso": 20,
          "instrumento": "Lista de cotejo y registro anecdótico (Diagnóstica y formativa)"
        },
        {
          "criterio": "Investigar sobre los nadadores con problemas psicomotores en la historia de México",
          "peso": 20,
          "instrumento": "Lista de cotejo y registro anecdótico (Diagnóstica y formativa)"
        },
        {
          "criterio": "Cumplimiento de rutina física con técnica adecuada",
          "peso": 30,
          "instrumento": "Lista de cotejo (formativa)"
        },
        {
          "criterio": "Participación y aplicación de tácticas básicas",
          "peso": 10,
          "instrumento": "Rúbrica de participación"
        },
        {
          "criterio": "EXAMEN",
          "peso": 20,
          "instrumento": "Evaluación sumativa"
        },
        {
          "criterio": "Investigación (investigar la historia del voleibol en México)",
          "peso": 20,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        }
      ]
    },
    {
      "nombre": "2da Evaluación Parcial",
      "criterios": [
        {
          "criterio": "Mejora observable en condición física",
          "peso": 20,
          "instrumento": "Lista de cotejo (formativa)"
        },
        {
          "criterio": "Ejecución correcta de simulaciones, dominio de técnicas básicas y participación",
          "peso": 30,
          "instrumento": "Lista de cotejo (Formativa)"
        },
        {
          "criterio": "Participación reflexiva y práctica",
          "peso": 10,
          "instrumento": "Lista de cotejo (formativa)"
        },
        {
          "criterio": "Examen Segundo parcial",
          "peso": 20,
          "instrumento": "Examen (evaluación sumativa)"
        }
      ]
    }
  ]
}
```

## Practicas Marineras II
- archivo: `PN_Sem02_Practicas-Marineras.json`
- motivo: parcial "Segundo Parcial" suma 91, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Primer Parcial",
      "criterios": [
        {
          "criterio": "Prácticas",
          "peso": 20,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Discusión guiada",
          "peso": 5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación",
          "peso": 5,
          "instrumento": "Guía de observación"
        },
        {
          "criterio": "Mapa conceptual",
          "peso": 7,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Discusión guiada",
          "peso": 5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación",
          "peso": 5,
          "instrumento": "Guía de observación"
        },
        {
          "criterio": "Práctica (estudio de casos)",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Síntesis",
          "peso": 8,
          "instrumento": "Rubrica"
        },
        {
          "criterio": "Participación",
          "peso": 5,
          "instrumento": "Guía de observación"
        },
        {
          "criterio": "Examen primer parcial",
          "peso": 25,
          "instrumento": "Examen"
        }
      ]
    },
    {
      "nombre": "Segundo Parcial",
      "criterios": [
        {
          "criterio": "Debate",
          "peso": 5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Práctica",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Debate",
          "peso": 1,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Práctica",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Discusión guiada",
          "peso": 1,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Debate / Conocimiento (examen)",
          "peso": 1,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Participación",
          "peso": 2,
          "instrumento": null
        },
        {
          "criterio": "Practica",
          "peso": 40,
          "instrumento": null
        },
        {
          "criterio": "Participación",
          "peso": 1,
          "instrumento": null
        },
        {
          "criterio": "Practica",
          "peso": 15,
          "instrumento": null
        }
      ]
    }
  ]
}
```

## Cálculo Diferencial e Integral
- archivo: `PN_Sem04_Calculo.json`
- motivo: parcial "1er Parcial" suma 105, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er Parcial",
      "criterios": [
        {
          "criterio": "Trabajo de investigación",
          "peso": 10,
          "instrumento": null
        },
        {
          "criterio": "Ejercicio dentro de clase",
          "peso": 10,
          "instrumento": null
        },
        {
          "criterio": "Ejercicio dentro de clase",
          "peso": 5,
          "instrumento": null
        },
        {
          "criterio": "Ejercicio dentro de clase",
          "peso": 5,
          "instrumento": null
        },
        {
          "criterio": "Trabajo de investigación",
          "peso": 10,
          "instrumento": null
        },
        {
          "criterio": "Ejercicio dentro de clase",
          "peso": 5,
          "instrumento": null
        },
        {
          "criterio": "Ejercicio dentro de clase",
          "peso": 5,
          "instrumento": null
        },
        {
          "criterio": "Trabajo de investigación",
          "peso": 5,
          "instrumento": null
        },
        {
          "criterio": "Ejercicio dentro de clase",
          "peso": 5,
          "instrumento": null
        },
        {
          "criterio": "Ejercicio dentro de clase",
          "peso": 5,
          "instrumento": null
        },
        {
          "criterio": "Ejercicio dentro de clase",
          "peso": 10,
          "instrumento": null
        },
        {
          "criterio": "Ejercicio dentro de clase",
          "peso": 5,
          "instrumento": null
        },
        {
          "criterio": "Examen parcial",
          "peso": 25,
          "instrumento": null
        }
      ]
    }
  ]
}
```

## Manejo de embarcaciones de supervivencia y botes de rescate que no sean botes de rescate rápidos
- archivo: `PN_Sem04_Manejo-Embarcaciones.json`
- motivo: parcial "1er Parcial" suma 50, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er Parcial",
      "criterios": [
        {
          "criterio": "Investigación de tipos de bote de rescate",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Síntesis sobre la importancia de conocer manejo de embarcaciones",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "1er examen parcial",
          "peso": 25,
          "instrumento": "Examen"
        }
      ]
    }
  ]
}
```

## Educación Física
- archivo: `PN_Sem04_Educacion-Fisica.json`
- motivo: parcial "1a evaluación parcial" suma 112.5, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1a evaluación parcial",
      "criterios": [
        {
          "criterio": "Participación del estudiante. Ejercicios físico-prácticos desarrollando su ubicación espacial.",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación del estudiante. Ejercicios actividad física (Lateralidad)",
          "peso": 20,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Ejercicios físico prácticos desarrollando su Resistencia Cardiorrespiratoria",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación del estudiante. Ejercicios actividad física (Flexibilidad articular y muscular)",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Ejercicios y juegos físico-prácticos, de concentración para el desarrollo integral de sus funciones.",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Examen parcial De la unidad I, II, al subtemas 3.2 de la unidad III un total de 100%",
          "peso": 25,
          "instrumento": "Rubrica"
        },
        {
          "criterio": "Participación del estudiante. actividad física. El alumno participa, realizando ejercicios de Voleibol.",
          "peso": 12.5,
          "instrumento": "Evaluación sumativa"
        }
      ]
    }
  ]
}
```

## Meteorología I
- archivo: `PN_Sem04_Meteorologia.json`
- motivo: parcial "Segundo Parcial" incompleto (null)
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Primer Parcial",
      "criterios": [
        {
          "criterio": "SINTESIS DE LECTURA",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Actividad de Aprendizaje",
          "peso": 12.5,
          "instrumento": "Lista de cotejo. Evaluación formativa"
        },
        {
          "criterio": "Diagrama del ciclo del agua",
          "peso": 12.5,
          "instrumento": "Lista de cotejo. Rúbrica. Evaluación formativa."
        },
        {
          "criterio": "Trabajo de Practica",
          "peso": 12.5,
          "instrumento": "Lista de cotejo. Evaluación formativa"
        },
        {
          "criterio": "Examen primer parcial",
          "peso": 50,
          "instrumento": "Examen Evaluación sumativa"
        }
      ]
    },
    {
      "nombre": "Segundo Parcial",
      "criterios": null
    }
  ]
}
```

## Educación Física
- archivo: `PN_Sem06_Educacion-Fisica.json`
- motivo: parcial "1ª Evaluación parcial" suma 112.5, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1ª Evaluación parcial",
      "criterios": [
        {
          "criterio": "Ejercicios sobre la ubicación espacial",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "El alumno realiza ejercicios sobre su lateralidad",
          "peso": 20,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "El alumno realiza ejercicios sobre la resistencia cardio respiratoria",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "El alumno realiza ejercicios sobre la flexibilidad articular",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "El alumno realiza ejercicios sobre Juegos de concentración",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Examen parcial De la unidad I,II, al subtema 3.2 de la unidad III, un total de 100%",
          "peso": 25,
          "instrumento": "Rubrica"
        },
        {
          "criterio": "El alumno participa con ejercicios de voleibol",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        }
      ]
    }
  ]
}
```

## Electrónica
- archivo: `PN_Sem06_Electronica.json`
- motivo: parcial "2do PARCIAL" incompleto (null)
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er PARCIAL",
      "criterios": [
        {
          "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Identificación de las partes de un motor/generador",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Construcción de un circuito rectificador de onda completa",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Construcción de un circuito secuencial simulando permisivos on/off",
          "peso": 5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "PARTICIPACIONES Y USO DE TICS - Exponer un equipo electrónico usado operaciones náuticas a bordo",
          "peso": 25,
          "instrumento": "Lista de cotejo."
        },
        {
          "criterio": "CONOCIMIENTO - 1ERA EVALUACION PARCIAL",
          "peso": 50,
          "instrumento": "EXAMEN"
        }
      ]
    },
    {
      "nombre": "2do PARCIAL",
      "criterios": null
    }
  ]
}
```

## Maniobras II
- archivo: `PN_Sem06_Maniobras.json`
- motivo: parcial "2do PARCIAL" incompleto (null)
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er PARCIAL",
      "criterios": [
        {
          "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Practicas (Unidad 1)",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "PRACTICAS Y ACTIVIDADES DE APRENDIZAJE - Practicas (Unidad 3)",
          "peso": 12.5,
          "instrumento": "Lista de cotejo."
        },
        {
          "criterio": "PARTICIPACIONES Y USO DE TICS - Participaciones (Unidad 2)",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "PARTICIPACIONES Y USO DE TICS - Participaciones (Unidad 4)",
          "peso": 12.5,
          "instrumento": "Lista de cotejo."
        },
        {
          "criterio": "CONOCIMIENTO - 1era evaluación parcial (Unidad 4)",
          "peso": 50,
          "instrumento": "Evaluación sumativa"
        }
      ]
    },
    {
      "nombre": "2do PARCIAL",
      "criterios": null
    }
  ]
}
```

## Pensamiento Crítico
- archivo: `PN_Sem06_Pensamiento-Critico.json`
- motivo: parcial "2do PARCIAL" suma 30, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er PARCIAL",
      "criterios": [
        {
          "criterio": "Actividad 1, 2",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Actividad 1,2,3",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Cuestionario",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Mapa conceptual",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación del estudiante",
          "peso": 5,
          "instrumento": "Preguntas"
        },
        {
          "criterio": "Examen",
          "peso": 50,
          "instrumento": "Examen"
        }
      ]
    },
    {
      "nombre": "2do PARCIAL",
      "criterios": [
        {
          "criterio": "Estudio de caso",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Resumen",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        }
      ]
    }
  ]
}
```

## Prácticas Marineras VI
- archivo: `PN_Sem06_Practicas-Marineras-Vi.json`
- motivo: parcial "2do PARCIAL" incompleto (null)
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er PARCIAL",
      "criterios": [
        {
          "criterio": "Cuestionario oral",
          "peso": 10,
          "instrumento": "Cuestionario"
        },
        {
          "criterio": "Mapa conceptual",
          "peso": 15,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Reporte de practicas",
          "peso": 15,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Prácticas de nudos",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación oral",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Discusión guiada",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Examen primer parcial",
          "peso": 25,
          "instrumento": "Examen"
        }
      ]
    },
    {
      "nombre": "2do PARCIAL",
      "criterios": null
    }
  ]
}
```

## Administración Naviera y Portuaria
- archivo: `PN_Sem08_Administracion-Naviera.json`
- motivo: parcial "PRIMER PARCIAL" suma 80, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "PRIMER PARCIAL",
      "criterios": [
        {
          "criterio": "PARTICIPACION DEL CADETE",
          "peso": 15,
          "instrumento": "LISTA COTEJO"
        },
        {
          "criterio": "RESUMEN DEL TEMA",
          "peso": 15,
          "instrumento": "LISTA COTEJO"
        },
        {
          "criterio": "EXAMEN",
          "peso": 50,
          "instrumento": "EXAMEN"
        }
      ]
    }
  ]
}
```

## Teoría del Buque I
- archivo: `PN_Sem06_Teoria-Del-Buque.json`
- motivo: parcial "1ra. Evaluación parcial": criterio sin % válido ("Examen diagnostico")
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1ra. Evaluación parcial",
      "criterios": [
        {
          "criterio": "Examen diagnostico",
          "peso": 0,
          "instrumento": "Examen diagnostico (evaluación diagnostica)"
        },
        {
          "criterio": "Participación del cadete",
          "peso": 15,
          "instrumento": "Lista de Cotejo (formativa)"
        },
        {
          "criterio": "Resolver problemas de coeficientes del buque",
          "peso": 15,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Elaboración de maqueta de planos y coeficientes de formas del buque",
          "peso": 20,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Participación del cadete",
          "peso": 10,
          "instrumento": "Lista de Cotejo (Formativa)"
        },
        {
          "criterio": "Resolver problemas de áreas y volumenes",
          "peso": 15,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Examen Parcial",
          "peso": 25,
          "instrumento": "Examen (Evaluación sumativa)"
        }
      ]
    },
    {
      "nombre": "2da. Evaluación Parcial",
      "criterios": [
        {
          "criterio": "Participación del cadete",
          "peso": 10,
          "instrumento": "Lista de Cotejo (Formativa)"
        },
        {
          "criterio": "Elaborar problemas de la unidad",
          "peso": 15,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Participación del cadete",
          "peso": 10,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Participación del cadete",
          "peso": 5,
          "instrumento": "Lista de Cotejo (Formativa)"
        },
        {
          "criterio": "Resolver problemas de C.G y asiento",
          "peso": 15,
          "instrumento": "Lista de cotejo (Evaluación formativa)"
        },
        {
          "criterio": "Cálculo de estabilidad completo",
          "peso": 20,
          "instrumento": "Lista de Cotejo (Formativa)"
        },
        {
          "criterio": "Examen",
          "peso": 25,
          "instrumento": "Examen (Evaluación sumativa)"
        }
      ]
    }
  ]
}
```

## Carga y Estiba II
- archivo: `PN_Sem08_Carga-Y-Estiba-B.json`
- motivo: parcial "Segunda Evaluación Parcial" suma 140, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1ra. Evaluación parcial",
      "criterios": [
        {
          "criterio": "Realizar mapa conceptual de conceptos de la unidad",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Realizar investigación de tema buque tanque",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación del cadete",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Resumen de los cuidados y equipos requeridos para entrada a espacios confinados",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Examen",
          "peso": 50,
          "instrumento": "Examen"
        }
      ]
    },
    {
      "nombre": "Segunda Evaluación Parcial",
      "criterios": [
        {
          "criterio": "Actividades del cadete",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Elaborar una investigación del tema gases licuados del petróleo",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Elaborar cálculos de carga",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Examen Ordinario",
          "peso": 100,
          "instrumento": "Examen"
        }
      ]
    }
  ]
}
```

## Sistema Mundial de Socorro y Salvamento Marítimo
- archivo: `PN_Sem08_Gmdss.json`
- motivo: parcial "Primer Parcial" suma 37.5, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Primer Parcial",
      "criterios": [
        {
          "criterio": "Practica",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Practica",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        }
      ]
    }
  ]
}
```

## Educación Física
- archivo: `PN_Sem08_Eduacion-Fisica.json`
- motivo: parcial "1ª Evaluación parcial" suma 112.5, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1ª Evaluación parcial",
      "criterios": [
        {
          "criterio": "Participación del alumno sobre su ubicación espacial",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "El alumno realiza ejercicios sobre el equilibrio",
          "peso": 20,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación del alumno sobre la Resistencia cardiorrespiratoria",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación del alumno sobre la Flexibilidad articular y muscular",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Participación del alumno sobre el deporte de Futbol",
          "peso": 15,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Examen parcial De la unidad I,II, al subtema 3.2 de la unidad III, un total de 100%",
          "peso": 25,
          "instrumento": "Rubrica"
        },
        {
          "criterio": "Participación del alumno sobre el deporte de voleibol",
          "peso": 12.5,
          "instrumento": "Lista de cotejo"
        }
      ]
    }
  ]
}
```

## Legislación Marítima y Laboral
- archivo: `PN_Sem08_Legislacion-Maritima.json`
- motivo: parcial "Primer Parcial" suma 95, no 100
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "Primer Parcial",
      "criterios": [
        {
          "criterio": "Participación",
          "peso": 5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Debate",
          "peso": 10,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Cuadro sinóptico",
          "peso": 7.5,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Investigación",
          "peso": 10,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Resumen",
          "peso": 7.5,
          "instrumento": "Rúbrica"
        },
        {
          "criterio": "Discusión guiada",
          "peso": 5,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Examen primer parcial",
          "peso": 50,
          "instrumento": "Examen"
        }
      ]
    }
  ]
}
```

## Inglés Marítimo VIII (Maritime English 2)
- archivo: `PN_Sem08_Ingles-Maritimo.json`
- motivo: parcial "1er PARCIAL": criterio sin % válido ("Actividades en Marlin’s")
- lo que devolvió la IA (revisar a mano):

```json
{
  "parciales": [
    {
      "nombre": "1er PARCIAL",
      "criterios": [
        {
          "criterio": "Actividades en el libro de texto y en el workbook",
          "peso": 15,
          "instrumento": "Lista de cotejo workbook"
        },
        {
          "criterio": "Actividades en Marlin’s",
          "peso": 0,
          "instrumento": "Lista de cotejo"
        },
        {
          "criterio": "Examen de Listening de Primer Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Listening de Primer Parcial"
        },
        {
          "criterio": "Examen de Reading de Primer Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Reading de Primer Parcial"
        },
        {
          "criterio": "Examen de Writing de Primer Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Writing de Primer Parcial"
        },
        {
          "criterio": "Examen de Grammar&Vocabulary de Primer Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Grammar&Vocabulary de Primer Parcial"
        },
        {
          "criterio": "Examen de Speaking de Primer Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Speaking de Primer Parcial"
        }
      ]
    },
    {
      "nombre": "Segundo PARCIAL",
      "criterios": [
        {
          "criterio": "Actividades en el libro de texto y en el workbook",
          "peso": 10,
          "instrumento": "Lista de cotejo Workbook"
        },
        {
          "criterio": "Actividades en el libro de texto y en el workbook",
          "peso": 5,
          "instrumento": "Lista de cotejo Workbook"
        },
        {
          "criterio": "Examen de Listening de Segundo Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Listening de Segundo Parcial"
        },
        {
          "criterio": "Examen de Reading de Segundo Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Reading de Segundo Parcial"
        },
        {
          "criterio": "Examen de Writing de Segundo Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Writing de Segundo Parcial"
        },
        {
          "criterio": "Examen de Grammar&Vocabulary de Segundo Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Grammar&Vocabulary de Segundo Parcial"
        },
        {
          "criterio": "Examen de Speaking de Segundo Parcial",
          "peso": 17,
          "instrumento": "Lista de cotejo de examen de Speaking de Segundo Parcial"
        }
      ]
    }
  ]
}
```

