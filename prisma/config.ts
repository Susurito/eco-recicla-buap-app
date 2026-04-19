/**
 * Configuration for trash containers and related settings
 * 
 * These values were previously hardcoded in prisma/seed.ts
 * Now they are available as reference data for manual database seeding
 */

export const CONTAINERS_CONFIG = [
  {
    id: 'TP1',
    name: 'Contenedor Cafeteria',
    lat: 19.0335,
    lng: -98.2734,
    detectedObject: 'Residuos plastcos',
    detectedImage: '/images/trash-1.jpg',
    category: 'plastico' as const,
    fillLevel: 85,
    lastCollected: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    alert: 'Contenedor casi lleno',
  },
  {
    id: 'TP2',
    name: 'Contenedor Entrada Principal',
    lat: 19.0340,
    lng: -98.2740,
    detectedObject: 'Papel y cartón',
    detectedImage: '/images/trash-2.jpg',
    category: 'papel' as const,
    fillLevel: 45,
    lastCollected: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    alert: null,
  },
  {
    id: 'TP3',
    name: 'Contenedor Jardin',
    lat: 19.0330,
    lng: -98.2745,
    detectedObject: 'Materia orgánica',
    detectedImage: '/images/trash-3.jpg',
    category: 'organico' as const,
    fillLevel: 30,
    lastCollected: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    alert: null,
  },
  {
    id: 'TP4',
    name: 'Contenedor Biblioteca',
    lat: 19.0332,
    lng: -98.2735,
    detectedObject: 'Residuos generales',
    detectedImage: '/images/trash-4.jpg',
    category: 'general' as const,
    fillLevel: 92,
    lastCollected: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    alert: 'CRÍTICO: Contenedor lleno',
  },
  {
    id: 'TP5',
    name: 'Contenedor Laboratorio',
    lat: 19.0338,
    lng: -98.2738,
    detectedObject: 'Residuos mixtos',
    detectedImage: '/images/trash-5.jpg',
    category: 'plastico' as const,
    fillLevel: 60,
    lastCollected: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    alert: null,
  },
]

export const TRASH_CATEGORIES = ['plastico', 'papel', 'organico', 'general']

/**
 * Prize configuration
 * Use these values to seed prizes via API or database
 */
export const PRIZES_CONFIG = [
  {
    id: 'p-1',
    name: '30 min Internet',
    description: '30 minutos de acceso a internet en laboratorios',
    cost: 100,
    icon: 'wifi',
    category: 'internet',
  },
  {
    id: 'p-2',
    name: '1 hora Internet',
    description: '1 hora de acceso a internet premium',
    cost: 200,
    icon: 'wifi',
    category: 'internet',
  },
  {
    id: 'p-3',
    name: '+0.5 Puntos Extra',
    description: '0.5 puntos extra en tu proxima evaluacion parcial',
    cost: 500,
    icon: 'graduation-cap',
    category: 'academic',
  },
  {
    id: 'p-4',
    name: '+1.0 Puntos Extra',
    description: '1.0 punto extra en tu proxima evaluacion parcial',
    cost: 900,
    icon: 'graduation-cap',
    category: 'academic',
  },
  {
    id: 'p-5',
    name: 'Cafe Gratis',
    description: 'Un cafe de cortesia en la cafeteria de la facultad',
    cost: 150,
    icon: 'coffee',
    category: 'cafeteria',
  },
  {
    id: 'p-6',
    name: 'Combo Almuerzo',
    description: 'Un combo de almuerzo en la cafeteria',
    cost: 400,
    icon: 'utensils',
    category: 'cafeteria',
  },
]
